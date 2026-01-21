'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
import { Loader2, Plus, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '@/components/common';
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
  createVersion,
  createMessageKey,
  type MessageKeyResponseDto,
  type CreateMessageKeyDto,
} from '@/services/messages/message-keys.service';
import { getMessageStore } from '@/services/messages/message-stores.service';
import { listMessageTypes, type MessageTypeResponseDto } from '@/services/messages/message-stores.service';
import { listLanguages } from '@/services/configuration';
import { listVersions, getVersion } from '@/services/messages/message-keys.service';
import type { Language } from '@/api/types';
import { useAuth } from '@/hooks/useAuth';
import { getApiErrorMessage } from '@/api/client';

interface MultiLanguageEditDialogProps {
  messageStoreId: number;
  messageKey: string;
  initialLanguage?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface LanguageData {
  language: string;
  content: string;
  typeSettings: Record<string, unknown>;
  isModified: boolean;
  isLoading: boolean;
  error?: string;
  exists: boolean;
}

export function MultiLanguageEditDialog({
  messageStoreId,
  messageKey,
  initialLanguage,
  open,
  onOpenChange,
  onSuccess,
}: MultiLanguageEditDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [loadingInitialData, setLoadingInitialData] = useState(false);
  const [messageTypes, setMessageTypes] = useState<MessageTypeResponseDto[]>([]);
  const [allLanguages, setAllLanguages] = useState<Language[]>([]);
  const [languagesData, setLanguagesData] = useState<Record<string, LanguageData>>({});
  const [languageOrder, setLanguageOrder] = useState<string[]>([]); // Track insertion order
  const [defaultLanguage, setDefaultLanguage] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<string>(initialLanguage || '');
  const [showAddLanguage, setShowAddLanguage] = useState(false);
  const [selectedNewLanguage, setSelectedNewLanguage] = useState<string>('none');
  const [versionName, setVersionName] = useState<string>('');
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [availableVersions, setAvailableVersions] = useState<Array<{ version: number; versionName?: string }>>([]);
  const [currentMessageKey, setCurrentMessageKey] = useState<MessageKeyResponseDto | null>(null);

  const loadMessageDetails = useCallback(async (language: string, versionNumber?: number) => {
    try {
      let content = '';
      let typeSettings: Record<string, unknown> = {};

      if (versionNumber !== undefined && versionNumber !== null) {
        // Load specific version (v5.0.0 - no language parameter, version contains all languages)
        const versionDetails = await getVersion(
          messageStoreId,
          messageKey,
          versionNumber
        );
        // Find language content in version
        const langContent = versionDetails.languages.find((l) => l.language === language);
        if (langContent) {
          content = langContent.content;
          typeSettings = langContent.typeSettings || {};
        }
      } else {
        // Load published version content for this language
        try {
          const messageKeyData = await getMessageKey(messageStoreId, messageKey);
          if (messageKeyData.publishedVersion) {
            const publishedVersion = await getVersion(
              messageStoreId,
              messageKey,
              messageKeyData.publishedVersion
            );
            const langContent = publishedVersion.languages.find((l) => l.language === language);
            if (langContent) {
              content = langContent.content;
              typeSettings = langContent.typeSettings || {};
            }
          }
        } catch (err) {
          // MessageKey might not exist yet - that's okay for new languages
          console.log('MessageKey not found, will create new one:', err);
        }
      }

      setLanguagesData((prev) => ({
        ...prev,
        [language]: {
          ...prev[language],
          content,
          typeSettings,
          isLoading: false,
          exists: true,
        },
      }));
    } catch (error: unknown) {
      const errorMessage = getApiErrorMessage(error) || `Failed to load ${language} version`;

      setLanguagesData((prev) => ({
        ...prev,
        [language]: {
          ...prev[language],
          isLoading: false,
          error: errorMessage,
          exists: prev[language]?.exists || false,
        },
      }));
    }
  }, [messageStoreId, messageKey]);

  // Load version content for all languages when version changes (but not on initial load)
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    if (selectedVersion !== null && languageOrder.length > 0 && !isInitialLoad) {
      // Load the selected version for all languages
      languageOrder.forEach((lang) => {
        loadMessageDetails(lang, selectedVersion);
      });
    }
    if (isInitialLoad && selectedVersion !== null) {
      setIsInitialLoad(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVersion, languageOrder]);

  const loadInitialData = useCallback(async () => {
    try {
      setLoadingInitialData(true);

      // Load message store and message key data
      const [store, types, languages, messageKeyData] = await Promise.all([
        getMessageStore(messageStoreId),
        listMessageTypes(),
        listLanguages(),
        getMessageKey(messageStoreId, messageKey).catch(() => null), // MessageKey might not exist yet
      ]);

      setMessageTypes(types);
      setAllLanguages(languages);
      setDefaultLanguage(store.defaultLanguage);

      // Get languages from MessageKey if it exists, otherwise use store's allowed languages
      let availableLanguages: string[] = [];
      if (messageKeyData) {
        setCurrentMessageKey(messageKeyData);
        // MessageKey exists - use languages from published version
        if (messageKeyData.publishedVersion) {
          const publishedVersion = await getVersion(
            messageStoreId,
            messageKey,
            messageKeyData.publishedVersion
          );
          availableLanguages = publishedVersion.languages.map((l) => l.language);
        } else if (messageKeyData.languages.length > 0) {
          // Use languages from latest version if no published version
          availableLanguages = messageKeyData.languages;
        } else {
          // Fallback to store's allowed languages
          availableLanguages = store.allowedLanguages;
        }
      } else {
        setCurrentMessageKey(null);
        // MessageKey doesn't exist - use store's allowed languages
        availableLanguages = store.allowedLanguages;
      }

      // Initialize language data map
      const languageDataMap: Record<string, LanguageData> = {};
      const order: string[] = [];

      for (const lang of availableLanguages) {
        languageDataMap[lang] = {
          language: lang,
          content: '',
          typeSettings: {},
          isModified: false,
          isLoading: true,
          exists: messageKeyData !== null, // Exists if MessageKey exists
        };
        order.push(lang);
      }

      setLanguagesData(languageDataMap);
      setLanguageOrder(order);

      // Set initial active tab (prefer default language, then first in order)
      // Only set if activeTab is not already set or if it's not in the new language list
      const initialLang = store.defaultLanguage && order.includes(store.defaultLanguage)
        ? store.defaultLanguage
        : order[0];

      // Only update activeTab if it's not set or if current activeTab is not in the new list
      setActiveTab((currentTab) => {
        if (!currentTab || !order.includes(currentTab)) {
          return initialLang;
        }
        return currentTab; // Keep current tab if it's still valid
      });

      // Load full details for each language
      for (const lang of order) {
        loadMessageDetails(lang);
      }

      // Load versions to populate version selector (v5.0.0 - versions are shared across all languages)
      try {
        // v5.0.0 - versions are not per-language, they contain all languages
        const versions = await listVersions(messageStoreId, messageKey);
        const versionList = versions.map((v) => ({
          version: v.version,
          versionName: v.versionName,
        }));
        setAvailableVersions(versionList);

        // Auto-select published version or latest
        const publishedVersion = versions.find((v) => v.isPublished);
        if (publishedVersion) {
          setSelectedVersion(publishedVersion.version);
        } else if (versions.length > 0) {
          setSelectedVersion(versions[0].version);
        }
      } catch (error: unknown) {
        console.error('Error loading versions:', error);
        // Don't show error toast - versions are optional for editing
      }
    } catch (error: unknown) {
      toast.error('Failed to load messages', {
        description: getApiErrorMessage(error) || 'Failed to load message data',
      });
      console.error('Error loading initial data:', error);
    } finally {
      setLoadingInitialData(false);
    }
  }, [messageStoreId, messageKey, loadMessageDetails, onOpenChange]);

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
      setSelectedVersion(null);
      setAvailableVersions([]);
      setIsInitialLoad(true);
    }
  }, [open, messageStoreId, messageKey, initialLanguage, loadInitialData]);


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

    // Capture the language code before any state updates
    const languageToAdd = selectedNewLanguage;

    // Check if language already exists
    if (languagesData[languageToAdd]) {
      toast.error('This language already exists for this message');
      setShowAddLanguage(false);
      setSelectedNewLanguage('none');
      setActiveTab(languageToAdd);
      return;
    }

    // Get message type from first existing language or use default
    const firstLanguageData = Object.values(languagesData).find((d) => d.exists);
    if (!firstLanguageData) {
      // No existing languages - will use default type when creating
      const messageType = messageTypes[0];
      if (!messageType) {
        toast.error('No message types available');
        return;
      }
    }

    // Add new language to the data
    const newLangData: LanguageData = {
      language: languageToAdd,
      content: '',
      typeSettings: {},
      isModified: true,
      isLoading: false,
      exists: false,
    };

    // Update all state together - React 18 batches these automatically
    // Update languagesData and languageOrder first
    setLanguagesData((prev) => ({
      ...prev,
      [languageToAdd]: newLangData,
    }));

    setLanguageOrder((prev) => [...prev, languageToAdd]);

    // Set active tab to the new language - this happens in the same render cycle
    setActiveTab(languageToAdd);

    // Hide add language section and reset selection
    setShowAddLanguage(false);
    setSelectedNewLanguage('none');

    // Show success message with the correct language code
    toast.success(`Added ${languageToAdd} language tab`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Get modified languages
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
      setSubmitting(true);
      const results: { language: string; success: boolean; error?: string }[] = [];

      // Check if MessageKey exists
      let messageKeyExists = false;
      let currentMessageKey: MessageKeyResponseDto | null = null;
      try {
        currentMessageKey = await getMessageKey(messageStoreId, messageKey);
        messageKeyExists = true;
      } catch (err) {
        // MessageKey doesn't exist - will create it
        messageKeyExists = false;
      }

      if (messageKeyExists && currentMessageKey) {
        // Update existing MessageKey - create new version with all language updates
        try {
          // Get base version (published or latest)
          const baseVersion = currentMessageKey.publishedVersion || currentMessageKey.latestVersion;
          if (!baseVersion) {
            throw new Error('No base version available');
          }

          // Get current version to preserve unchanged languages
          const currentVersion = await getVersion(messageStoreId, messageKey, baseVersion);

          // Build language updates: update modified languages, keep others unchanged
          const languageUpdatesMap = new Map<string, { language: string; content: string; typeSettings?: Record<string, unknown> }>();

          // First, add all current languages (preserve unchanged ones)
          for (const lang of currentVersion.languages) {
            languageUpdatesMap.set(lang.language, {
              language: lang.language,
              content: lang.content,
              typeSettings: lang.typeSettings,
            });
          }

          // Then, update with modified languages
          for (const langData of modifiedLanguages) {
            languageUpdatesMap.set(langData.language, {
              language: langData.language,
              content: langData.content,
              typeSettings: Object.keys(langData.typeSettings).length > 0 ? langData.typeSettings : undefined,
            });
          }

          await createVersion(messageStoreId, messageKey, {
            baseVersion,
            versionName: versionName || undefined,
            languageUpdates: Array.from(languageUpdatesMap.values()),
            createdBy: user?.email || user?.username || undefined,
          });

          // All languages updated atomically
          for (const langData of modifiedLanguages) {
            results.push({ language: langData.language, success: true });
          }
        } catch (err: unknown) {
          const errorMsg = getApiErrorMessage(err) || 'Unknown error';
          for (const langData of modifiedLanguages) {
            results.push({
              language: langData.language,
              success: false,
              error: errorMsg,
            });
          }
        }
      } else {
        // Create new MessageKey with initial version containing all languages
        try {
          // Get message type and category from first modified language (or use defaults)
          const firstLang = modifiedLanguages[0];
          if (!firstLang) {
            throw new Error('No languages to create');
          }

          // Find message type (use first available type as fallback)
          const messageType = messageTypes[0];
          if (!messageType) {
            throw new Error('No message types available');
          }

          // Use default category (categoryId 1 is typically 'general')
          const categoryId = 1;

          const createDto: CreateMessageKeyDto = {
            messageStoreId,
            messageKey,
            messageTypeId: messageType.messageTypeId,
            categoryId,
            languages: modifiedLanguages.map((langData) => ({
              language: langData.language,
              content: langData.content,
              typeSettings: Object.keys(langData.typeSettings).length > 0 ? langData.typeSettings : undefined,
            })),
            versionName: versionName || undefined,
            createdBy: user?.email || user?.username || undefined,
          };

          await createMessageKey(messageStoreId, createDto);

          // All languages created atomically
          for (const langData of modifiedLanguages) {
            results.push({ language: langData.language, success: true });
          }
        } catch (err: unknown) {
          const errorMsg = getApiErrorMessage(err) || 'Unknown error';
          for (const langData of modifiedLanguages) {
            results.push({
              language: langData.language,
              success: false,
              error: errorMsg,
            });
          }
        }
      }

      // Show results
      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.filter((r) => !r.success).length;

      if (successCount > 0) {
        // Invalidate caches to refresh data
        queryClient.invalidateQueries({ queryKey: ['message-keys'] });
        queryClient.invalidateQueries({ queryKey: ['message-stores'] });

        toast.success(
          `Saved ${successCount} language${successCount > 1 ? 's' : ''}`,
          {
            description:
              failureCount > 0
                ? `${failureCount} language(s) failed to save`
                : 'New version created. Publish it to make it live.',
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
      toast.error('Save failed', {
        description: errorMessage,
      });
      console.error('Error saving messages:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Sort languages: default first, then others in insertion order
  const languagesList = (() => {
    const allLanguages = Object.values(languagesData);
    const defaultLang = defaultLanguage && languagesData[defaultLanguage]
      ? languagesData[defaultLanguage]
      : null;
    const otherLanguages = allLanguages.filter(
      (lang) => lang.language !== defaultLanguage
    );

    // Sort other languages by insertion order
    const sortedOthers = otherLanguages.sort((a, b) => {
      const indexA = languageOrder.indexOf(a.language);
      const indexB = languageOrder.indexOf(b.language);
      // If not in order array, put at end
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

    // Return default first, then others
    return defaultLang ? [defaultLang, ...sortedOthers] : sortedOthers;
  })();

  // Get available languages for adding (not already in languagesData)
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
    if (!currentMessageKey) return undefined;
    return messageTypes.find((t) => t.messageTypeId === currentMessageKey.messageTypeId);
  };

  const currentMessageType = getCurrentMessageType();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Message - All Languages</DialogTitle>
          <DialogDescription>
            Edit {messageKey} across multiple languages. Changes will create new draft versions.
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
          <form onSubmit={handleSubmit}>
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
                    <span className="ml-2">
                      {currentMessageType?.displayName || 'Loading...'}
                    </span>
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

              {/* Version Selector */}
              {availableVersions.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="versionSelect">Select Version to Edit</Label>
                  <Select
                    value={selectedVersion?.toString() || ''}
                    onValueChange={(value) => setSelectedVersion(parseInt(value, 10))}
                  >
                    <SelectTrigger id="versionSelect">
                      <SelectValue placeholder="Select version">
                        {selectedVersion
                          ? `v${selectedVersion}${availableVersions.find((v) => v.version === selectedVersion)?.versionName ? ` - ${availableVersions.find((v) => v.version === selectedVersion)?.versionName}` : ''}`
                          : 'Select version'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {availableVersions.map((v) => (
                        <SelectItem key={v.version} value={v.version.toString()}>
                          v{v.version}
                          {v.versionName && ` - ${v.versionName}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">
                    Select a version to edit. The selected version applies to all languages.
                  </p>
                </div>
              )}

              {/* Version Name */}
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
                  Optional: Name for the new version that will be created when you save changes
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
                        {currentMessageKey?.publishedVersion && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            v{currentMessageKey.publishedVersion}
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
                      <div className="py-8 text-center">
                        <Loader2 className="h-6 w-6 animate-spin text-indigo-500 mx-auto" />
                        <p className="mt-2 text-sm text-slate-600">
                          Loading {langData.language}...
                        </p>
                      </div>
                    ) : langData.error ? (
                      <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded">
                        <p className="text-sm">{langData.error}</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Language Header */}
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">
                            {getLanguageDisplayName(langData.language)}
                          </h3>
                          {langData.exists ? (
                            <Badge variant="default">Existing Message</Badge>
                          ) : (
                            <Badge variant="secondary">New Message</Badge>
                          )}
                        </div>

                        {/* Content */}
                        <div className="space-y-2">
                          <Label htmlFor={`content-${langData.language}`}>
                            Content *
                            {currentMessageKey?.publishedVersion && (
                              <span className="ml-2 text-xs text-slate-500 font-normal">
                                (Editing from v{currentMessageKey.publishedVersion})
                              </span>
                            )}
                          </Label>
                          <Textarea
                            id={`content-${langData.language}`}
                            value={langData.content}
                            onChange={(e) =>
                              handleContentChange(langData.language, e.target.value)
                            }
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
                <p className="font-medium text-indigo-900 mb-1">What happens next?</p>
                <ul className="text-indigo-800 space-y-1 ml-4 list-disc">
                  <li>Editing from version {selectedVersion || 'selected'}, which applies to all {languagesList.length} published language{languagesList.length > 1 ? 's' : ''}</li>
                  <li>New versions will be created for all modified languages</li>
                  <li>All languages will share the same new version number</li>
                  <li>New versions are saved as drafts (not published yet)</li>
                  <li>Current published versions remain live until you publish the new ones</li>
                  <li>You can publish new versions from the Message Detail page</li>
                </ul>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
                className="transition-colors"
                aria-label="Cancel editing"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || modifiedCount === 0}
                className="transition-colors"
                aria-label={`Save ${modifiedCount} change${modifiedCount !== 1 ? 's' : ''}`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                    Saving...
                  </>
                ) : (
                  `Save ${modifiedCount > 0 ? `${modifiedCount} ` : ''}Change${
                    modifiedCount !== 1 ? 's' : ''
                  }`
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}


