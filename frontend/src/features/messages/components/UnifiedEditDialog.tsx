'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, AlertCircle, Info } from 'lucide-react';
import { LoadingSpinner, ErrorState } from '@/components/common';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TypeSettingsEditor } from './messages/TypeSettingsEditor';
import {
  getMessageKey,
  listVersions as listMessageKeyVersions,
  getVersion as getMessageKeyVersion,
  createVersion,
  publishVersion as publishMessageKeyVersion,
  type MessageKeyResponseDto,
  type MessageKeyVersionResponseDto,
  type LanguageContentDto,
} from '@/services/messages/message-keys.service';
import { getMessageStore } from '@/services/messages/message-stores.service';
import { listMessageTypes, type MessageTypeResponseDto } from '@/services/messages/message-stores.service';
import { listLanguages } from '@/services/configuration';
import type { Language } from '@/api/types';
import { useAuth } from '@/hooks/useAuth';
import { getApiErrorMessage } from '@/api/client';

interface UnifiedEditDialogProps {
  messageStoreId: number;
  messageKey: string;
  initialLanguage?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface LanguageData {
  language: string;
  sourceVersion: number | null;  // Version loaded from
  content: string;
  typeSettings: Record<string, unknown>;
  isModified: boolean;
  isLoading: boolean;
  error?: string;
  exists: boolean;
}

interface VersionInfo {
  version: number;
  versionName?: string;
  isPublished: boolean;
}

export function UnifiedEditDialog({
  messageStoreId,
  messageKey,
  initialLanguage,
  open,
  onOpenChange,
  onSuccess,
}: UnifiedEditDialogProps) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [loadingInitialData, setLoadingInitialData] = useState(false);
  const [messageTypes, setMessageTypes] = useState<MessageTypeResponseDto[]>([]);
  const [allLanguages, setAllLanguages] = useState<Language[]>([]);
  const [languagesData, setLanguagesData] = useState<Record<string, LanguageData>>({});
  const [languageOrder, setLanguageOrder] = useState<string[]>([]);
  const [defaultLanguage, setDefaultLanguage] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<string>(initialLanguage || '');
  const [showAddLanguage, setShowAddLanguage] = useState(false);
  const [selectedNewLanguage, setSelectedNewLanguage] = useState<string>('none');
  const [versionName, setVersionName] = useState<string>('');
  
  // Source version selection
  const [availableVersions, setAvailableVersions] = useState<VersionInfo[]>([]);
  const [selectedSourceVersion, setSelectedSourceVersion] = useState<number | null>(null);
  const [loadingVersionContent, setLoadingVersionContent] = useState(false);
  const [messageKeyData, setMessageKeyData] = useState<MessageKeyResponseDto | null>(null);

  // Calculate next version number from available versions
  const nextVersionNumber = useMemo(() => {
    if (availableVersions.length === 0) return 1;
    const maxVersion = Math.max(...availableVersions.map((v) => v.version));
    return maxVersion + 1;
  }, [availableVersions]);

  const loadVersionContent = useCallback(async (versionNumber: number) => {
    try {
      setLoadingVersionContent(true);
      
      // Set all languages to loading
      setLanguagesData((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((lang) => {
          updated[lang] = {
            ...updated[lang],
            isLoading: true,
          };
        });
        return updated;
      });

      // Load the version (contains all languages)
      const versionDetails = await getMessageKeyVersion(
        messageStoreId,
        messageKey,
        versionNumber
      );
      
      // Update all languages from the version
      const updatedLanguages: Record<string, LanguageData> = {};
      for (const langContent of versionDetails.languages) {
        updatedLanguages[langContent.language] = {
          language: langContent.language,
          sourceVersion: versionNumber,
          content: langContent.content,
          typeSettings: langContent.typeSettings || {},
          isModified: false,
          isLoading: false,
          exists: true,
        };
      }
      
      setLanguagesData((prev) => ({
        ...prev,
        ...updatedLanguages,
      }));
      
      setLoadingVersionContent(false);
    } catch (error: unknown) {
      const errorMessage = getApiErrorMessage(error) || `Failed to load version ${versionNumber}`;
      setLanguagesData((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((lang) => {
          updated[lang] = {
            ...updated[lang],
            isLoading: false,
            error: errorMessage,
          };
        });
        return updated;
      });
      setLoadingVersionContent(false);
    }
  }, [messageStoreId, messageKey]);

  // Removed - no longer needed with new API

  const loadInitialData = useCallback(async () => {
    try {
      setLoadingInitialData(true);

      const [store, types, languages, messageKeyData, versions] = await Promise.all([
        getMessageStore(messageStoreId),
        listMessageTypes(),
        listLanguages(),
        getMessageKey(messageStoreId, messageKey),
        listMessageKeyVersions(messageStoreId, messageKey),
      ]);

      setMessageTypes(types);
      setAllLanguages(languages);
      setDefaultLanguage(store.defaultLanguage);

      // Initialize language data from messageKey
      const languageDataMap: Record<string, LanguageData> = {};
      const order: string[] = messageKeyData.languages;

      // Load published version by default (or latest if no published)
      const publishedVersion = messageKeyData.publishedVersion;
      const defaultVersion = publishedVersion || messageKeyData.latestVersion;

      if (defaultVersion) {
        // Load the default version (contains all languages)
        const versionDetails = await getMessageKeyVersion(
          messageStoreId,
          messageKey,
          defaultVersion
        );

        for (const langContent of versionDetails.languages) {
          languageDataMap[langContent.language] = {
            language: langContent.language,
            content: langContent.content,
            typeSettings: langContent.typeSettings || {},
            sourceVersion: defaultVersion,
            isModified: false,
            isLoading: false,
            exists: true,
          };
        }
      } else {
        // No versions yet - initialize empty
        for (const lang of messageKeyData.languages) {
          languageDataMap[lang] = {
            language: lang,
            content: '',
            typeSettings: {},
            sourceVersion: null,
            isModified: false,
            isLoading: false,
            exists: true,
          };
        }
      }

      setLanguagesData(languageDataMap);
      setLanguageOrder(order);

      // Set initial active tab
      const initialLang = store.defaultLanguage && order.includes(store.defaultLanguage)
        ? store.defaultLanguage
        : order[0];
      setActiveTab((currentTab) => {
        if (!currentTab || !order.includes(currentTab)) {
          return initialLang;
        }
        return currentTab;
      });

      // Set up versions list
      const versionList: VersionInfo[] = versions.map((v) => ({
        version: v.version,
        versionName: v.versionName,
        isPublished: v.isPublished,
      }));

      setAvailableVersions(versionList);
      setMessageKeyData(messageKeyData);
      
      // Set published version as default source
      if (publishedVersion) {
        setSelectedSourceVersion(publishedVersion);
      } else if (versionList.length > 0) {
        setSelectedSourceVersion(versionList[0].version);
      }

    } catch (error: unknown) {
      toast.error('Failed to load message data', {
        description: getApiErrorMessage(error) || 'An error occurred',
      });
      console.error('Error loading initial data:', error);
    } finally {
      setLoadingInitialData(false);
    }
  }, [messageStoreId, messageKey, onOpenChange]);

  // Load initial data when dialog opens
  useEffect(() => {
    if (open) {
      loadInitialData();
    } else {
      // Reset state when dialog closes
      setLanguagesData({});
      setLanguageOrder([]);
      setDefaultLanguage(undefined);
      setActiveTab(initialLanguage || '');
      setShowAddLanguage(false);
      setSelectedNewLanguage('none');
      setVersionName('');
      setAvailableVersions([]);
      setSelectedSourceVersion(null);
      setMessageKeyData(null);
    }
  }, [open, messageStoreId, messageKey, initialLanguage, loadInitialData]);

  // Handle source version change
  const handleSourceVersionChange = async (versionNumber: number) => {
    if (versionNumber === selectedSourceVersion) return;
    
    setSelectedSourceVersion(versionNumber);
    await loadVersionContent(versionNumber);
  };

  const handleContentChange = (language: string, content: string) => {
    setLanguagesData((prev) => ({
      ...prev,
      [language]: {
        ...prev[language],
        content,
        isModified: true,
      },
    }));
  };

  const handleTypeSettingsChange = (language: string, typeSettings: Record<string, unknown>) => {
    setLanguagesData((prev) => ({
      ...prev,
      [language]: {
        ...prev[language],
        typeSettings,
        isModified: true,
      },
    }));
  };

  const handleAddLanguage = async () => {
    if (selectedNewLanguage === 'none') {
      toast.error('Please select a language');
      return;
    }

    const languageToAdd = selectedNewLanguage;

    if (languagesData[languageToAdd]) {
      toast.error('This language already exists');
      setShowAddLanguage(false);
      setSelectedNewLanguage('none');
      setActiveTab(languageToAdd);
      return;
    }

    // Get content from default language as template
    const defaultLangData = defaultLanguage && languagesData[defaultLanguage]
      ? languagesData[defaultLanguage]
      : Object.values(languagesData)[0];

    const newLangData: LanguageData = {
      language: languageToAdd,
      content: '', // Start empty - user must provide translation
      typeSettings: defaultLangData?.typeSettings || {},
      sourceVersion: null,
      isModified: true,
      isLoading: false,
      exists: false,
    };

    setLanguagesData((prev) => ({
      ...prev,
      [languageToAdd]: newLangData,
    }));

    setLanguageOrder((prev) => [...prev, languageToAdd]);
    setActiveTab(languageToAdd);
    setShowAddLanguage(false);
    setSelectedNewLanguage('none');

    toast.success(`Added ${languageToAdd} - provide translation content`);
  };

  const handleSaveAsDraft = async () => {
    await handleSubmit(false);
  };

  const handleSaveAndPublish = async () => {
    await handleSubmit(true);
  };

  const handleSubmit = async (publish: boolean) => {
    const modifiedLanguages = Object.values(languagesData).filter((data) => data.isModified);

    if (modifiedLanguages.length === 0) {
      toast.error('No changes to save');
      return;
    }

    // Validate all modified languages
    const invalidLanguages = modifiedLanguages.filter((data) => !data.content.trim());
    if (invalidLanguages.length > 0) {
      toast.error(
        `Content is required for: ${invalidLanguages.map((d) => d.language).join(', ')}`
      );
      return;
    }

    try {
      if (publish) {
        setPublishing(true);
      } else {
        setSubmitting(true);
      }

      const results: { language: string; success: boolean; error?: string; versionId?: string }[] = [];

      // Create new version with all modified languages (atomic operation)
      try {
        const languageUpdates: LanguageContentDto[] = modifiedLanguages.map((langData) => ({
          language: langData.language,
          content: langData.content,
          typeSettings:
            Object.keys(langData.typeSettings).length > 0
              ? langData.typeSettings
              : undefined,
        }));

        // Create new version (copies from base, applies updates)
        const newVersion = await createVersion(messageStoreId, messageKey, {
          baseVersion: selectedSourceVersion || undefined,
          versionName: versionName || undefined,
          languageUpdates,
          createdBy: user?.email || user?.username || undefined,
        });

        // If publishing, publish the new version (all languages atomically)
        if (publish) {
          await publishMessageKeyVersion(messageStoreId, messageKey, {
            version: newVersion.version,
            publishedBy: user?.email || user?.username || undefined,
          });
        }

        // All languages succeeded
        for (const langData of modifiedLanguages) {
          results.push({ language: langData.language, success: true });
        }
      } catch (error: unknown) {
        // Single error affects all languages
        const errorMessage = getApiErrorMessage(error) || 'Failed to save';
        for (const langData of modifiedLanguages) {
          results.push({
            language: langData.language,
            success: false,
            error: errorMessage,
          });
        }
      }

      // Show results
      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.filter((r) => !r.success).length;

      if (successCount > 0) {
        const actionWord = publish ? 'Published' : 'Saved';
        toast.success(
          `${actionWord} ${successCount} language${successCount > 1 ? 's' : ''} as v${nextVersionNumber}`,
          {
            description: failureCount > 0
              ? `${failureCount} language(s) failed`
              : publish
                ? 'New versions are now live'
                : 'New versions saved as drafts. Publish to make them live.',
          }
        );
      }

      if (failureCount > 0) {
        const failedLanguages = results
          .filter((r) => !r.success)
          .map((r) => `${r.language}: ${r.error}`)
          .join('; ');
        toast.error(`Failed to save ${failureCount} language(s)`, {
          description: failedLanguages,
        });
      }

      // Close dialog if all succeeded
      if (failureCount === 0) {
        onOpenChange(false);
        onSuccess?.();
      }
    } catch (error: unknown) {
      const errorMessage = getApiErrorMessage(error) || 'Failed to save messages';
      toast.error('Save failed', { description: errorMessage });
      console.error('Error saving messages:', error);
    } finally {
      setSubmitting(false);
      setPublishing(false);
    }
  };

  // Sort languages: default first, then others in insertion order
  const languagesList = useMemo(() => {
    const allLangs = Object.values(languagesData);
    const defaultLang = defaultLanguage && languagesData[defaultLanguage]
      ? languagesData[defaultLanguage]
      : null;
    const otherLangs = allLangs.filter((lang) => lang.language !== defaultLanguage);

    const sortedOthers = otherLangs.sort((a, b) => {
      const indexA = languageOrder.indexOf(a.language);
      const indexB = languageOrder.indexOf(b.language);
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

    return defaultLang ? [defaultLang, ...sortedOthers] : sortedOthers;
  }, [languagesData, defaultLanguage, languageOrder]);

  // Get available languages for adding
  const existingLanguageCodes = Object.keys(languagesData);
  const availableLanguagesToAdd = allLanguages.filter(
    (lang) => !existingLanguageCodes.includes(lang.languageCode)
  );

  const modifiedCount = Object.values(languagesData).filter((d) => d.isModified).length;

  const getLanguageDisplayName = (languageCode: string): string => {
    const language = allLanguages.find((lang) => lang.languageCode === languageCode);
    return language ? language.displayName : languageCode;
  };

  const getCurrentMessageType = (): MessageTypeResponseDto | undefined => {
    if (!messageKeyData) return undefined;
    return messageTypes.find((t) => t.messageTypeId === messageKeyData.messageTypeId);
  };

  const currentMessageType = getCurrentMessageType();

  // Get published version info for display
  const publishedVersionInfo = availableVersions.find((v) => v.isPublished);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Message: {messageKey}</DialogTitle>
          <DialogDescription>
            Edit content across languages. Saving creates new versions (v{nextVersionNumber}).
          </DialogDescription>
        </DialogHeader>

        {loadingInitialData ? (
          <div className="py-8">
            <LoadingSpinner size="medium" message="Loading message data..." />
          </div>
        ) : languagesList.length === 0 ? (
          <div className="py-8 text-center">
            <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm text-slate-600">No languages found for this message</p>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Message Info */}
            <div className="bg-slate-50/50 p-4 rounded border space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-slate-500">Message Key:</span>
                  <span className="ml-2 font-mono">{messageKey}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-500">Type:</span>
                  <span className="ml-2">{currentMessageType?.displayName || 'Loading...'}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-500">Languages:</span>
                  <span className="ml-2">{languagesList.length}</span>
                </div>
                {modifiedCount > 0 && (
                  <div>
                    <span className="font-medium text-slate-500">Modified:</span>
                    <span className="ml-2">
                      <Badge variant="secondary">{modifiedCount} language(s)</Badge>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Source Version Selector */}
            <div className="space-y-2">
              <Label htmlFor="sourceVersion">Edit From Version</Label>
              <Select
                value={selectedSourceVersion?.toString() || ''}
                onValueChange={(value) => handleSourceVersionChange(parseInt(value, 10))}
                disabled={loadingVersionContent}
              >
                <SelectTrigger id="sourceVersion">
                  <SelectValue placeholder="Select source version">
                    {loadingVersionContent ? (
                      <span className="flex items-center">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </span>
                    ) : selectedSourceVersion ? (
                      <span>
                        v{selectedSourceVersion}
                        {availableVersions.find((v) => v.version === selectedSourceVersion)?.isPublished && (
                          <Badge className="ml-2 bg-emerald-100 text-emerald-700" variant="secondary">
                            Published
                          </Badge>
                        )}
                        {availableVersions.find((v) => v.version === selectedSourceVersion)?.versionName && (
                          <span className="ml-2 text-slate-500">
                            - {availableVersions.find((v) => v.version === selectedSourceVersion)?.versionName}
                          </span>
                        )}
                      </span>
                    ) : (
                      'Select version'
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {availableVersions.map((v) => (
                    <SelectItem key={v.version} value={v.version.toString()}>
                      <div className="flex items-center gap-2">
                        <span>v{v.version}</span>
                        {v.isPublished && (
                          <Badge className="bg-emerald-100 text-emerald-700" variant="secondary">
                            Published
                          </Badge>
                        )}
                        {v.versionName && (
                          <span className="text-slate-500">- {v.versionName}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Content will be loaded from this version. Published version is selected by default.
              </p>
            </div>

            {/* Version Name for New Version */}
            <div className="space-y-2">
              <Label htmlFor="versionName">New Version Name (Optional)</Label>
              <Input
                id="versionName"
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
                placeholder="e.g., Q1 2024 Update, Bug Fix"
                maxLength={128}
              />
              <p className="text-xs text-slate-500">
                Name for version v{nextVersionNumber} that will be created when you save.
              </p>
            </div>

            {/* Language Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex items-center justify-between mb-2">
                <TabsList className="flex-wrap h-auto">
                  {languagesList.map((langData) => (
                    <TabsTrigger key={langData.language} value={langData.language}>
                      {getLanguageDisplayName(langData.language)}
                      {langData.isModified && (
                        <span className="ml-1 text-indigo-600 font-bold">*</span>
                      )}
                      {!langData.exists && (
                        <Badge variant="secondary" className="ml-2 text-xs bg-amber-100 text-amber-700">
                          new
                        </Badge>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {availableLanguagesToAdd.length > 0 && !showAddLanguage && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddLanguage(true)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Language
                  </Button>
                )}
              </div>

              {/* Add Language Section */}
              {showAddLanguage && (
                <div className="mb-4 p-4 border rounded-lg bg-indigo-50/50">
                  <div className="flex items-end gap-3">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="newLanguage">Select Language to Add</Label>
                      <Select
                        value={selectedNewLanguage}
                        onValueChange={setSelectedNewLanguage}
                      >
                        <SelectTrigger id="newLanguage">
                          <SelectValue placeholder="Select a language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Select a language</SelectItem>
                          {availableLanguagesToAdd.map((lang) => (
                            <SelectItem key={lang.languageCode} value={lang.languageCode}>
                              {lang.displayName} ({lang.languageCode})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="button" onClick={handleAddLanguage} size="sm">
                      Add
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowAddLanguage(false);
                        setSelectedNewLanguage('none');
                      }}
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Tab Content for Each Language */}
              {languagesList.map((langData) => (
                <TabsContent key={langData.language} value={langData.language}>
                  {langData.isLoading ? (
                    <div className="py-8">
                      <LoadingSpinner size="small" message={`Loading ${langData.language}...`} />
                    </div>
                  ) : langData.error ? (
                    <ErrorState
                      title="Failed to load language content"
                      message={langData.error}
                      showIcon={false}
                      className="mb-0"
                    />
                  ) : (
                    <div className="space-y-4">
                      {/* Language Header */}
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">
                          {getLanguageDisplayName(langData.language)}
                          {langData.language === defaultLanguage && (
                            <Badge variant="outline" className="ml-2">default</Badge>
                          )}
                        </h3>
                        <div className="flex gap-2">
                          {langData.exists ? (
                            <Badge variant="default" className="bg-slate-100 text-slate-700">
                              {langData.sourceVersion
                                ? `Editing from v${langData.sourceVersion}`
                                : 'Existing'}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                              New Language
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="space-y-2">
                        <Label htmlFor={`content-${langData.language}`}>
                          Content *
                        </Label>
                        <Textarea
                          id={`content-${langData.language}`}
                          value={langData.content}
                          onChange={(e) => handleContentChange(langData.language, e.target.value)}
                          placeholder="Enter the message content..."
                          rows={10}
                          required
                        />
                      </div>

                      {/* Type Settings */}
                      {currentMessageType && currentMessageType.settingsSchema && (
                        <TypeSettingsEditor
                          schema={currentMessageType.settingsSchema}
                          value={langData.typeSettings}
                          onChange={(settings) =>
                            handleTypeSettingsChange(langData.language, settings)
                          }
                        />
                      )}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>

            {/* Info Box */}
            <div className="bg-indigo-50/50 border border-indigo-200 p-3 rounded text-sm">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-indigo-900 mb-1">What happens when you save?</p>
                  <ul className="text-indigo-800 space-y-1 ml-4 list-disc">
                    <li>Editing from: v{selectedSourceVersion || '?'} {publishedVersionInfo?.version === selectedSourceVersion && '(Published)'}</li>
                    <li>New version v{nextVersionNumber} will be created for {modifiedCount || 'modified'} language{modifiedCount !== 1 ? 's' : ''}</li>
                    <li>"Save as Draft" - new version saved but not published</li>
                    <li>"Save & Publish" - new version saved and immediately goes live</li>
                    <li>Current published version remains live until you publish v{nextVersionNumber}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting || publishing}
            className="transition-colors"
            aria-label="Cancel editing"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveAsDraft}
            disabled={submitting || publishing || modifiedCount === 0}
            className="transition-colors"
            aria-label={`Save as draft version ${nextVersionNumber}`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                Saving...
              </>
            ) : (
              `Save as Draft (v${nextVersionNumber})`
            )}
          </Button>
          <Button
            type="button"
            onClick={handleSaveAndPublish}
            disabled={submitting || publishing || modifiedCount === 0}
            className="bg-emerald-600 hover:bg-emerald-700 transition-colors"
            aria-label={`Save and publish version ${nextVersionNumber}`}
          >
            {publishing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                Publishing...
              </>
            ) : (
              `Save & Publish (v${nextVersionNumber})`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
