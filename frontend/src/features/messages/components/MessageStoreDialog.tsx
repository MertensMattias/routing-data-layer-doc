import { useState, useEffect, useCallback } from 'react';
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
import { Plus, Loader2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { createMessageStore, updateMessageStore, listMessageVoices, getMessageStoreVoiceConfigs, type MessageStoreResponseDto, type CreateVoiceConfigItemDto } from '@/services/messages/message-stores.service';
import { listLanguages } from '@/services/configuration';
import { getApiErrorMessage } from '@/api/client';
import { useCompanyProjectContext } from '@/contexts/CompanyProjectContext';
import type { Language, Voice } from '@/api/types';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface MessageStoreDialogProps {
  store?: MessageStoreResponseDto;
  onSuccess?: (createdStore?: MessageStoreResponseDto) => void;
  trigger?: React.ReactNode;
}

interface FormData {
  name: string;
  description: string;
  allowedLanguages: string[];
  defaultLanguage: string;
  voiceConfigs: Record<string, number>; // language -> voiceId
}

export function MessageStoreDialog({ store, onSuccess, trigger }: MessageStoreDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingVoices, setLoadingVoices] = useState(false);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [voicesByLanguage, setVoicesByLanguage] = useState<Record<string, Voice[]>>({});
  const [showVoiceConfig, setShowVoiceConfig] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    allowedLanguages: [],
    defaultLanguage: '',
    voiceConfigs: {},
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedLanguageToAdd, setSelectedLanguageToAdd] = useState<string>('');

  // Load languages when dialog opens
  useEffect(() => {
    if (open) {
      loadLanguages();
    }
  }, [open]); // Remove loadLanguages from dependencies to prevent infinite loop

  // Load voice configs when editing a store
  const loadVoiceConfigs = useCallback(async () => {
    if (!store || !open) return;
    try {
      const configs = await getMessageStoreVoiceConfigs(store.messageStoreId);
      const voiceConfigsMap: Record<string, number> = {};
      // Get the default voice for each language
      configs.forEach((config) => {
        if (config.isDefault) {
          voiceConfigsMap[config.language] = config.voiceId;
        }
      });
      setFormData((prev) => ({
        ...prev,
        voiceConfigs: voiceConfigsMap,
      }));
      // Auto-expand voice config if there are existing configs
      if (Object.keys(voiceConfigsMap).length > 0) {
        setShowVoiceConfig(true);
      }
    } catch (error: unknown) {
      console.error('Error loading voice configs:', error);
      // Don't show error toast - voice configs are optional
    }
  }, [store, open]);

  // Initialize form data when store prop changes
  useEffect(() => {
    if (store) {
      setFormData({
        name: store.name,
        description: store.description || '',
        allowedLanguages: store.allowedLanguages,
        defaultLanguage: store.defaultLanguage || store.allowedLanguages[0] || '',
        voiceConfigs: {},
      });
      // Load voice configs after form data is initialized
      if (open) {
        loadVoiceConfigs();
      }
    } else {
      setFormData({
        name: '',
        description: '',
        allowedLanguages: [],
        defaultLanguage: '',
        voiceConfigs: {},
      });
    }
  }, [store, open, loadVoiceConfigs]);

  const loadLanguages = useCallback(async () => {
    try {
      setLoading(true);
      const languagesData = await listLanguages(false); // Only active languages
      setLanguages(languagesData.filter((l) => l.isActive));
    } catch (error: unknown) {
      console.error('Error loading languages:', error);
      toast.error(getApiErrorMessage(error) || 'Failed to load languages');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadVoicesForLanguages = useCallback(async () => {
    try {
      setLoadingVoices(true);
      const voicesMap: Record<string, Voice[]> = {};
      for (const langCode of formData.allowedLanguages) {
        try {
          const voices = await listMessageVoices(langCode);
          voicesMap[langCode] = voices;
        } catch (error: unknown) {
          console.error(`Error loading voices for ${langCode}:`, error);
        }
      }
      setVoicesByLanguage(voicesMap);
    } catch (error: unknown) {
      console.error('Error loading voices:', error);
    } finally {
      setLoadingVoices(false);
    }
  }, [formData.allowedLanguages]);

  // Load voices when voice config is expanded and languages are available
  useEffect(() => {
    if (open && formData.allowedLanguages.length > 0 && showVoiceConfig) {
      loadVoicesForLanguages();
    }
  }, [open, showVoiceConfig, formData.allowedLanguages, loadVoicesForLanguages]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.allowedLanguages.length === 0) {
      newErrors.allowedLanguages = 'At least one language is required';
    }

    if (formData.defaultLanguage && !formData.allowedLanguages.includes(formData.defaultLanguage)) {
      newErrors.defaultLanguage = 'Default language must be in allowed languages';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const { selectedCompanyProjectId } = useCompanyProjectContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      if (store) {
        // Build voice configs if explicitly configured
        const voiceConfigs: CreateVoiceConfigItemDto[] | undefined =
          showVoiceConfig &&
          Object.keys(formData.voiceConfigs).length > 0 &&
          formData.allowedLanguages.every((lang) => formData.voiceConfigs[lang] !== undefined)
            ? formData.allowedLanguages.map((lang) => ({
                language: lang,
                voiceId: formData.voiceConfigs[lang]!,
                isDefault: true, // Each language must have a default voice
              }))
            : showVoiceConfig && Object.keys(formData.voiceConfigs).length === 0
              ? [] // Empty array means remove all voice configs
              : undefined; // undefined means don't change voice configs

        // Update existing store
        await updateMessageStore(store.messageStoreId, {
          name: formData.name,
          description: formData.description || undefined,
          allowedLanguages: formData.allowedLanguages,
          defaultLanguage: formData.defaultLanguage || undefined,
          voiceConfigs,
        });

        // Invalidate caches to refresh data
        queryClient.invalidateQueries({ queryKey: ['message-stores'] });
        queryClient.invalidateQueries({ queryKey: ['message-keys'] });

        toast.success('Message store updated successfully');
      } else {
        // Create new store
        if (!selectedCompanyProjectId) {
          toast.error('Please select a company project first');
          return;
        }

        // Build voice configs if explicitly configured
        // Note: Each language must have a default voice, so we mark all configured voices as default
        // The "default language" concept is separate from "default voice per language"
        const voiceConfigs: CreateVoiceConfigItemDto[] | undefined =
          showVoiceConfig &&
          Object.keys(formData.voiceConfigs).length > 0 &&
          formData.allowedLanguages.every((lang) => formData.voiceConfigs[lang] !== undefined)
            ? formData.allowedLanguages.map((lang) => ({
                language: lang,
                voiceId: formData.voiceConfigs[lang]!,
                isDefault: true, // Each language must have a default voice
              }))
            : undefined;

        const createdStore = await createMessageStore({
          companyProjectId: selectedCompanyProjectId,
          name: formData.name,
          description: formData.description || undefined,
          allowedLanguages: formData.allowedLanguages,
          defaultLanguage: formData.defaultLanguage || undefined,
          voiceConfigs,
        });

        // Invalidate caches to refresh data
        queryClient.invalidateQueries({ queryKey: ['message-stores'] });

        toast.success('Message store created successfully');
        setOpen(false);
        resetForm();
        onSuccess?.(createdStore);
        return;
      }

      setOpen(false);
      resetForm();
      onSuccess?.();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error) || `Failed to ${store ? 'update' : 'create'} message store`);
      console.error('Error saving message store:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    if (!store) {
      setFormData({
        name: '',
        description: '',
        allowedLanguages: [],
        defaultLanguage: '',
        voiceConfigs: {},
      });
    }
    setErrors({});
    setSelectedLanguageToAdd('');
    setShowVoiceConfig(false);
    setVoicesByLanguage({});
  };

  const addLanguage = () => {
    if (selectedLanguageToAdd && !formData.allowedLanguages.includes(selectedLanguageToAdd)) {
      setFormData({
        ...formData,
        allowedLanguages: [...formData.allowedLanguages, selectedLanguageToAdd],
      });
      setSelectedLanguageToAdd('');
    }
  };

  const removeLanguage = (langCode: string) => {
    const newLanguages = formData.allowedLanguages.filter((l) => l !== langCode);
    const newVoiceConfigs = { ...formData.voiceConfigs };
    delete newVoiceConfigs[langCode];
    setFormData({
      ...formData,
      allowedLanguages: newLanguages,
      // Reset default language if it was removed
      defaultLanguage: formData.defaultLanguage === langCode
        ? newLanguages[0] || ''
        : formData.defaultLanguage,
      voiceConfigs: newVoiceConfigs,
    });
  };

  const availableToAdd = languages.filter(
    (lang) => !formData.allowedLanguages.includes(lang.languageCode)
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 min-h-[44px]"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Store
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{store ? 'Edit Message Store' : 'Create Message Store'}</DialogTitle>
          <DialogDescription>
            {store
              ? 'Update message store settings.'
              : 'Create a new message store for organizing messages.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., ENGIE Customer Service"
              maxLength={128}
            />
            {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description..."
              rows={3}
              maxLength={512}
            />
          </div>

          {/* Allowed Languages */}
          <div className="space-y-2">
            <Label>Allowed Languages *</Label>
            <div className="flex gap-2 flex-wrap mb-2">
            {loading ? (
                <p className="text-sm text-slate-500">Loading languages...</p>
              ) : formData.allowedLanguages.length === 0 ? (
                <p className="text-sm text-slate-500">No languages selected</p>
              ) : (
                formData.allowedLanguages.map((langCode) => {
                  const lang = languages.find((l) => l.languageCode === langCode);
                  return (
                    <Badge key={langCode} variant="secondary" className="flex items-center gap-1">
                      {lang ? (lang.nativeName || lang.displayName) : langCode}
                      {formData.defaultLanguage === langCode && (
                        <span className="ml-1 text-xs">(Default)</span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeLanguage(langCode)}
                        className="ml-1 hover:text-red-600"
                        aria-label={`Remove language ${lang ? (lang.nativeName || lang.displayName) : langCode}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  );
                })
              )}
            </div>
            {availableToAdd.length > 0 && (
              <div className="flex gap-2">
                <Select value={selectedLanguageToAdd} onValueChange={setSelectedLanguageToAdd}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Add language" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableToAdd.map((lang) => (
                      <SelectItem key={lang.languageCode} value={lang.languageCode}>
                        {lang.nativeName || lang.displayName} ({lang.languageCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" onClick={addLanguage} disabled={!selectedLanguageToAdd}>
                  Add
                </Button>
              </div>
            )}
            {errors.allowedLanguages && (
              <p className="text-xs text-red-600">{errors.allowedLanguages}</p>
            )}
          </div>

          {/* Default Language */}
          <div className="space-y-2">
            <Label htmlFor="defaultLanguage">Default Language</Label>
            <Select
              value={formData.defaultLanguage}
              onValueChange={(value) => setFormData({ ...formData, defaultLanguage: value })}
              disabled={formData.allowedLanguages.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select default language" />
              </SelectTrigger>
              <SelectContent>
                {formData.allowedLanguages.map((langCode) => {
                  const lang = languages.find((l) => l.languageCode === langCode);
                  return (
                    <SelectItem key={langCode} value={langCode}>
                      {lang ? (lang.nativeName || lang.displayName) : langCode} ({langCode})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {errors.defaultLanguage && (
              <p className="text-xs text-red-600">{errors.defaultLanguage}</p>
            )}
          </div>

          {/* Voice Configuration (Optional) */}
          <Collapsible open={showVoiceConfig} onOpenChange={setShowVoiceConfig}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between"
                  disabled={formData.allowedLanguages.length === 0}
                >
                  <span>Voice Configuration (Optional)</span>
                  {showVoiceConfig ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">
                  {store
                    ? 'Update voice configurations for each language. Leave empty to remove all voice configs and use auto-selection.'
                    : 'Configure voices for each language. If not specified, the system will automatically select the first available voice for each language.'}
                </p>
                {formData.allowedLanguages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Add languages first to configure voices.
                  </p>
                ) : loadingVoices ? (
                  <p className="text-sm text-muted-foreground">Loading voices...</p>
                ) : (
                  <div className="space-y-3">
                    {formData.allowedLanguages.map((langCode) => {
                      const lang = languages.find((l) => l.languageCode === langCode);
                      const voices = voicesByLanguage[langCode] || [];
                      const selectedVoiceId = formData.voiceConfigs[langCode];

                      return (
                        <div key={langCode} className="space-y-2">
                          <Label>
                            Voice for {lang ? lang.nativeName || lang.displayName : langCode}
                          </Label>
                          <Select
                            value={selectedVoiceId?.toString() || 'auto'}
                            onValueChange={(value) => {
                              if (value === 'auto') {
                                const newVoiceConfigs = { ...formData.voiceConfigs };
                                delete newVoiceConfigs[langCode];
                                setFormData((prev) => ({
                                  ...prev,
                                  voiceConfigs: newVoiceConfigs,
                                }));
                              } else {
                                setFormData((prev) => ({
                                  ...prev,
                                  voiceConfigs: { ...prev.voiceConfigs, [langCode]: parseInt(value, 10) },
                                }));
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Auto-select (recommended)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="auto">Auto-select (recommended)</SelectItem>
                              {voices.length === 0 ? (
                                <SelectItem value="none" disabled>
                                  No voices available
                                </SelectItem>
                              ) : (
                                voices.map((voice) => (
                                  <SelectItem key={voice.voiceId} value={voice.voiceId.toString()}>
                                    {voice.displayName} ({voice.engine})
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

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
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-700 min-h-[44px]"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {store ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                store ? 'Update Store' : 'Create Store'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


