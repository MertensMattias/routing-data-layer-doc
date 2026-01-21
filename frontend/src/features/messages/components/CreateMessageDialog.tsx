import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Loader2, X } from 'lucide-react';
import { TypeSettingsEditor } from './messages/TypeSettingsEditor';
import { LoadingSpinner } from '@/components/common';
import { createMessageKey, type CreateMessageKeyDto } from '@/services/messages/message-keys.service';
import {
  listMessageStores,
  getMessageStore,
  listMessageCategories,
  listMessageTypes,
  type MessageStoreResponseDto,
  type MessageCategoryResponseDto,
  type MessageTypeResponseDto,
} from '@/services/messages/message-stores.service';
import { listLanguages } from '@/services/configuration';
import { getApiErrorMessage } from '@/api/client';
import { useAuth } from '@/hooks/useAuth';
import type { Language } from '@/api/types';

interface CreateMessageDialogProps {
  onSuccess?: () => void;
  selectedStoreId: number | null;
}

const MESSAGE_KEY_REGEX = /^[A-Z][A-Z0-9_]*$/;

interface LanguageData {
  language: string;
  content: string;
  typeSettings: Record<string, unknown>;
  hasContent: boolean;
}

export function CreateMessageDialog({ onSuccess, selectedStoreId }: CreateMessageDialogProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [stores, setStores] = useState<MessageStoreResponseDto[]>([]);
  const [selectedStore, setSelectedStore] = useState<MessageStoreResponseDto | null>(null);
  const [categories, setCategories] = useState<MessageCategoryResponseDto[]>([]);
  const [messageTypes, setMessageTypes] = useState<MessageTypeResponseDto[]>([]);
  const [allLanguages, setAllLanguages] = useState<Language[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);

  // Common fields (shared across all languages)
  const [messageKey, setMessageKey] = useState('');
  const [messageStoreId, setMessageStoreId] = useState<number | undefined>(selectedStoreId ?? undefined);
  const [messageTypeId, setMessageTypeId] = useState<number | undefined>(undefined);
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [versionName, setVersionName] = useState('');

  // Per-language data
  const [languagesData, setLanguagesData] = useState<Record<string, LanguageData>>({});
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [showAddLanguage, setShowAddLanguage] = useState(false);
  const [selectedNewLanguage, setSelectedNewLanguage] = useState<string>('none');

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load stores, categories, types, and languages when dialog opens
  useEffect(() => {
    if (open) {
      loadData();
    } else {
      // Reset form when dialog closes
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Update messageStoreId when selectedStoreId changes
  useEffect(() => {
    if (selectedStoreId) {
      setMessageStoreId(selectedStoreId);
      loadStoreDetails(selectedStoreId);
    } else {
      setSelectedStore(null);
      setAvailableLanguages([]);
    }
  }, [selectedStoreId]);

  // Update available languages when store changes
  useEffect(() => {
    if (selectedStore && allLanguages.length > 0) {
      const allowed = allLanguages.filter((lang) =>
        selectedStore.allowedLanguages.includes(lang.languageCode)
      );
      setAvailableLanguages(allowed);

      // Automatically add ALL allowed languages when store is selected
      // This ensures version v1 is created for all languages
      if (selectedLanguages.length === 0 && allowed.length > 0) {
        // Add all allowed languages
        allowed.forEach((lang) => {
          addLanguage(lang.languageCode);
        });
      }
    } else {
      setAvailableLanguages([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStore, allLanguages]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [storesData, categoriesData, typesData, languagesData] = await Promise.all([
        listMessageStores(),
        listMessageCategories(),
        listMessageTypes(),
        listLanguages(false), // Only active languages
      ]);
      setStores(storesData);
      setCategories(categoriesData.filter((c) => c.isActive));
      setMessageTypes(typesData.filter((t) => t.isActive));
      setAllLanguages(languagesData.filter((l) => l.isActive));

      // Auto-select first message type if none selected yet
      if (!messageTypeId && typesData.length > 0) {
        setMessageTypeId(typesData[0].messageTypeId);
      }

      // Load store details if selectedStoreId is set
      if (selectedStoreId) {
        await loadStoreDetails(selectedStoreId);
      }
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error) || 'Failed to load message settings');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStoreDetails = async (storeId: number) => {
    try {
      const store = await getMessageStore(storeId);
      setSelectedStore(store);
    } catch (error: unknown) {
      console.error('Error loading store details:', error);
      toast.error(getApiErrorMessage(error) || 'Failed to load message store details');
    }
  };

  const addLanguage = (languageCode: string) => {
    if (selectedLanguages.includes(languageCode)) {
      return;
    }

    setSelectedLanguages((prev) => [...prev, languageCode]);
    setLanguagesData((prev) => ({
      ...prev,
      [languageCode]: {
        language: languageCode,
        content: '',
        typeSettings: {},
        hasContent: false,
      },
    }));

    // Set as active tab if it's the first language
    if (selectedLanguages.length === 0) {
      setActiveTab(languageCode);
    }
  };

  const removeLanguage = (languageCode: string) => {
    setSelectedLanguages((prev) => prev.filter((lang) => lang !== languageCode));
    setLanguagesData((prev) => {
      const updated = { ...prev };
      delete updated[languageCode];
      return updated;
    });

    // Switch to another tab if current tab is being removed
    if (activeTab === languageCode && selectedLanguages.length > 1) {
      const remaining = selectedLanguages.filter((lang) => lang !== languageCode);
      setActiveTab(remaining[0]);
    }
  };

  const handleAddLanguage = () => {
    if (selectedNewLanguage === 'none') {
      toast.error('Please select a language');
      return;
    }

    if (selectedLanguages.includes(selectedNewLanguage)) {
      toast.error('This language is already added');
      return;
    }

    if (selectedStore && !selectedStore.allowedLanguages.includes(selectedNewLanguage)) {
      toast.error('This language is not allowed in the selected message store');
      return;
    }

    addLanguage(selectedNewLanguage);
    setShowAddLanguage(false);
    setSelectedNewLanguage('none');
    setActiveTab(selectedNewLanguage);
  };

  const handleContentChange = (language: string, content: string) => {
    setLanguagesData((prev) => ({
      ...prev,
      [language]: {
        ...prev[language],
        content,
        hasContent: content.trim().length > 0,
      },
    }));
  };

  const handleTypeSettingsChange = (language: string, typeSettings: Record<string, unknown>) => {
    setLanguagesData((prev) => ({
      ...prev,
      [language]: {
        ...prev[language],
        typeSettings,
      },
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!messageStoreId) {
      newErrors.messageStoreId = 'Message store is required';
    }

    if (!messageKey) {
      newErrors.messageKey = 'Message key is required';
    } else if (!MESSAGE_KEY_REGEX.test(messageKey)) {
      newErrors.messageKey = 'Must be UPPER_SNAKE_CASE format';
    }

    if (selectedLanguages.length === 0) {
      newErrors.languages = 'At least one language is required';
    }

    // Validate each language has content
    for (const lang of selectedLanguages) {
      const langData = languagesData[lang];
      if (!langData || !langData.content.trim()) {
        newErrors[`content_${lang}`] = `Content is required for ${lang}`;
      }
    }

    if (!messageTypeId) {
      newErrors.messageTypeId = 'Message type is required';
    }

    if (!categoryId) {
      newErrors.categoryId = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      // Prepare languages array for atomic creation
      const languages = selectedLanguages
        .map((lang) => {
          const langData = languagesData[lang];
          if (!langData || !langData.content.trim()) {
            return null;
          }
          return {
            language: lang,
            content: langData.content,
            typeSettings:
              Object.keys(langData.typeSettings).length > 0
                ? langData.typeSettings
                : undefined,
          };
        })
        .filter((l): l is NonNullable<typeof l> => l !== null);

      if (languages.length === 0) {
        toast.error('At least one language with content is required');
        return;
      }

      // Create messageKey with all languages atomically (version 1)
      await createMessageKey(messageStoreId!, {
        messageStoreId: messageStoreId!,
        messageKey,
        messageTypeId: messageTypeId!,
        categoryId: categoryId!,
        languages,
        displayName: displayName || undefined,
        description: description || undefined,
        versionName: versionName || undefined,
        createdBy: user?.email || user?.username || undefined,
      });

      // Invalidate caches to refresh data
      queryClient.invalidateQueries({ queryKey: ['message-keys', messageStoreId] });
      queryClient.invalidateQueries({ queryKey: ['message-stores'] });

      toast.success(
        `Created messageKey '${messageKey}' with ${languages.length} language${languages.length > 1 ? 's' : ''}`,
        {
          description: 'Version 1 created as draft - publish it to make it live.',
        }
      );

      setOpen(false);
      resetForm();
      onSuccess?.();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error) || 'Failed to create messageKey');
      console.error('Error creating messageKey:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setMessageKey('');
    setMessageStoreId(selectedStoreId ?? undefined);
    setMessageTypeId(messageTypes[0]?.messageTypeId);
    setCategoryId(undefined);
    setDisplayName('');
    setDescription('');
    setVersionName('');
    setSelectedLanguages([]);
    setLanguagesData({});
    setActiveTab('');
    setShowAddLanguage(false);
    setSelectedNewLanguage('none');
    setErrors({});
  };

  const handleMessageKeyChange = (value: string) => {
    // Auto-format to UPPER_SNAKE_CASE
    const formatted = value.toUpperCase().replace(/[^A-Z0-9_]/g, '');
    setMessageKey(formatted);
    if (errors.messageKey) {
      setErrors({ ...errors, messageKey: '' });
    }
  };

  const getLanguageDisplayName = (languageCode: string): string => {
    const language = allLanguages.find((lang) => lang.languageCode === languageCode);
    return language ? language.displayName : languageCode;
  };

  const currentMessageType = messageTypes.find((t) => t.messageTypeId === messageTypeId);

  // Get available languages for adding (not already selected)
  const availableLanguagesToAdd = availableLanguages.filter(
    (lang) => !selectedLanguages.includes(lang.languageCode)
  );

  // Sort languages: default first, then others
  const sortedLanguages = [...selectedLanguages].sort((a, b) => {
    if (selectedStore?.defaultLanguage === a) return -1;
    if (selectedStore?.defaultLanguage === b) return 1;
    return 0;
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2 min-h-[44px]" 
          disabled={!selectedStoreId}
        >
          <Plus className="w-4 h-4" />
          Create Message
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Message</DialogTitle>
          <DialogDescription>
            Create a new message in multiple languages. Each language will be created as a separate message with the same message key.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8">
            <LoadingSpinner size="medium" message="Loading message stores and types..." />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Common Fields Section */}
            <div className="space-y-4 pb-4 border-b">
              {/* Message Store */}
              <div className="space-y-2">
                <Label htmlFor="messageStoreId">Message Store *</Label>
                <Select
                  value={messageStoreId?.toString()}
                  onValueChange={(value) => {
                    const storeId = parseInt(value, 10);
                    setMessageStoreId(storeId);
                    loadStoreDetails(storeId);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select message store" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem key={store.messageStoreId} value={store.messageStoreId.toString()}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.messageStoreId && (
                  <p className="text-xs text-red-600">{errors.messageStoreId}</p>
                )}
              </div>

              {/* Message Key */}
              <div className="space-y-2">
                <Label htmlFor="messageKey">Message Key *</Label>
                <Input
                  id="messageKey"
                  value={messageKey}
                  onChange={(e) => handleMessageKeyChange(e.target.value)}
                  placeholder="WELCOME_PROMPT"
                  maxLength={64}
                />
                <p className="text-xs text-slate-500">
                  Format: UPPER_SNAKE_CASE (e.g., WELCOME_PROMPT). This key will be used for all languages.
                </p>
                {errors.messageKey && (
                  <p className="text-xs text-red-600">{errors.messageKey}</p>
                )}
              </div>

              {/* Message Type */}
              <div className="space-y-2">
                <Label htmlFor="messageTypeId">Message Type *</Label>
                <Select
                  value={messageTypeId?.toString()}
                  onValueChange={(value) => setMessageTypeId(parseInt(value, 10))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {messageTypes.map((type) => (
                      <SelectItem key={type.messageTypeId} value={type.messageTypeId.toString()}>
                        {type.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.messageTypeId && (
                  <p className="text-xs text-red-600">{errors.messageTypeId}</p>
                )}
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="categoryId">Category *</Label>
                <Select
                  value={categoryId?.toString()}
                  onValueChange={(value) => setCategoryId(parseInt(value, 10))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.categoryId} value={cat.categoryId.toString()}>
                        {cat.displayName} ({cat.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoryId && (
                  <p className="text-xs text-red-600">{errors.categoryId}</p>
                )}
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g., Welcome prompt"
                  maxLength={128}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description..."
                  rows={3}
                  maxLength={512}
                />
              </div>

              {/* Version Name */}
              <div className="space-y-2">
                <Label htmlFor="versionName">Version Name (Optional)</Label>
                <Input
                  id="versionName"
                  value={versionName}
                  onChange={(e) => setVersionName(e.target.value)}
                  placeholder="e.g., Initial Release, Q1 2024"
                  maxLength={128}
                />
                <p className="text-xs text-slate-500">
                  Give this version a memorable name (e.g., "Q1 2024 Release", "Emergency Fix")
                </p>
              </div>
            </div>

            {/* Languages Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Languages *</Label>
                  {selectedStore && (
                    <p className="text-xs text-slate-500 mt-1">
                      All {selectedStore.allowedLanguages.length} language{selectedStore.allowedLanguages.length > 1 ? 's' : ''} from message store are automatically included
                    </p>
                  )}
                </div>
                {errors.languages && (
                  <p className="text-xs text-red-600">{errors.languages}</p>
                )}
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
                <div className="p-4 border rounded-lg bg-indigo-50/50">
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

              {/* Language Tabs */}
              {selectedLanguages.length > 0 ? (
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="flex-wrap h-auto">
                    {sortedLanguages.map((lang) => (
                      <TabsTrigger key={lang} value={lang} className="relative">
                        <span className={selectedStore?.defaultLanguage === lang ? 'font-bold' : ''}>
                          {getLanguageDisplayName(lang)}
                        </span>
                        {selectedLanguages.length > 1 && (
                          <span
                            role="button"
                            tabIndex={0}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeLanguage(lang);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                e.stopPropagation();
                                removeLanguage(lang);
                              }
                            }}
                            className="ml-2 hover:bg-slate-200 rounded p-0.5 cursor-pointer inline-flex items-center"
                            aria-label={`Remove ${getLanguageDisplayName(lang)} language`}
                            title={`Remove ${getLanguageDisplayName(lang)} language`}
                          >
                            <span className="sr-only">Remove {getLanguageDisplayName(lang)} language</span>
                            <X className="w-3 h-3" aria-hidden="true" />
                          </span>
                        )}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {sortedLanguages.map((lang) => {
                    const langData = languagesData[lang];
                    return (
                      <TabsContent key={lang} value={lang} className="space-y-4 mt-4">
                        <div className="space-y-4">
                          {/* Content */}
                          <div className="space-y-2">
                            <Label htmlFor={`content-${lang}`}>
                              Content * ({getLanguageDisplayName(lang)})
                            </Label>
                            <Textarea
                              id={`content-${lang}`}
                              value={langData?.content || ''}
                              onChange={(e) => handleContentChange(lang, e.target.value)}
                              placeholder="Enter the message content..."
                              rows={8}
                              required
                            />
                            {errors[`content_${lang}`] && (
                              <p className="text-xs text-red-600">{errors[`content_${lang}`]}</p>
                            )}
                          </div>

                          {/* Type Settings */}
                          {currentMessageType && currentMessageType.settingsSchema && (
                            <TypeSettingsEditor
                              schema={currentMessageType.settingsSchema}
                              value={langData?.typeSettings || {}}
                              onChange={(settings) => handleTypeSettingsChange(lang, settings)}
                            />
                          )}
                        </div>
                      </TabsContent>
                    );
                  })}
                </Tabs>
              ) : (
                <div className="p-4 border rounded-lg bg-slate-50 text-center text-sm text-slate-500">
                  No languages selected. Click "Add Language" to get started.
                </div>
              )}

              {selectedStore && (
                <p className="text-xs text-slate-500">
                  Allowed languages: {selectedStore.allowedLanguages.join(', ')}
                </p>
              )}
            </div>

            {/* Info Box */}
            {selectedLanguages.length > 0 && (
              <div className="bg-indigo-50/50 border border-indigo-200 p-3 rounded text-sm">
                <p className="font-medium text-indigo-900 mb-1">What happens next?</p>
                <ul className="text-indigo-800 space-y-1 ml-4 list-disc">
                  <li>Version v1 will be created for all {selectedLanguages.length} language{selectedLanguages.length > 1 ? 's' : ''} in the message store</li>
                  <li>All messages will use the same message key: <code className="bg-white px-1 rounded">{messageKey || 'YOUR_MESSAGE_KEY'}</code></li>
                  <li>All languages share the same version number (v1 applies to all languages)</li>
                  <li>New messages are saved as drafts (not published yet)</li>
                  <li>You can publish them from the Messages page</li>
                </ul>
              </div>
            )}

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                disabled={submitting}
                className="border-slate-300 hover:bg-slate-50 min-h-[44px]"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submitting || selectedLanguages.length === 0}
                className="bg-indigo-600 hover:bg-indigo-700 min-h-[44px] transition-colors"
                aria-label={`Create ${selectedLanguages.length} message${selectedLanguages.length > 1 ? 's' : ''}`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                    Creating {selectedLanguages.length} message{selectedLanguages.length > 1 ? 's' : ''}...
                  </>
                ) : (
                  `Create ${selectedLanguages.length > 0 ? `${selectedLanguages.length} ` : ''}Message${selectedLanguages.length > 1 ? 's' : ''}`
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

