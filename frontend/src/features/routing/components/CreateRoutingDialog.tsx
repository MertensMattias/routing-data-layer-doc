import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus } from 'lucide-react';
import { createRoutingEntry, listRoutingEntries } from '@/services/routing';
import { listSegments } from '@/services/segments/segments.service';
import { listMessageStores } from '@/services/messages/message-stores.service';
import { listLanguages } from '@/services/configuration';
import { useCompanyProjectContext } from '@/contexts/CompanyProjectContext';
import { getApiErrorMessage } from '@/api/client';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { JsonEditorComponent } from '@/components/ui/json-editor';
import type { Language } from '@/api/types';
import type { MessageStoreResponseDto } from '@/services/messages/types';

export function CreateRoutingDialog() {
  const queryClient = useQueryClient();
  const { selectedCompanyProjectId, availableProjects } = useCompanyProjectContext();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // Data state
  const [existingRoutingIds, setExistingRoutingIds] = useState<string[]>([]);
  const [availableSegments, setAvailableSegments] = useState<string[]>([]);
  const [messageStores, setMessageStores] = useState<MessageStoreResponseDto[]>([]);
  const [allLanguages, setAllLanguages] = useState<Language[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);

  // Form state
  const [sourceId, setSourceId] = useState('');
  const [routingId, setRoutingId] = useState('');
  const [isNewRoutingId, setIsNewRoutingId] = useState(false);
  const [companyProjectId, setCompanyProjectId] = useState<number | undefined>();
  const [languageCode, setLanguageCode] = useState<string>('');
  const [messageStoreId, setMessageStoreId] = useState<number | undefined>();
  const [schedulerId, setSchedulerId] = useState<string>('');
  const [initSegment, setInitSegment] = useState('GET_LANGUAGE');
  const [featureFlags, setFeatureFlags] = useState('');
  const [config, setConfig] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Load initial data when dialog opens
  useEffect(() => {
    if (open) {
      loadDialogData();
    }
  }, [open, selectedCompanyProjectId]);

  // Update available languages when message store changes
  useEffect(() => {
    if (messageStoreId) {
      const store = messageStores.find(s => s.messageStoreId === messageStoreId);
      if (store) {
        const filtered = allLanguages.filter(lang =>
          store.allowedLanguages.includes(lang.languageCode)
        );
        setAvailableLanguages(filtered);

        // Set default language if available
        if (store.defaultLanguage && !languageCode) {
          setLanguageCode(store.defaultLanguage);
        }
      }
    } else {
      setAvailableLanguages(allLanguages);
    }
  }, [messageStoreId, messageStores, allLanguages]);

  // Load segments when routingId changes
  useEffect(() => {
    if (routingId && !isNewRoutingId) {
      loadSegmentsForRouting(routingId);
    } else {
      setAvailableSegments([]);
    }
  }, [routingId, isNewRoutingId]);

  const loadDialogData = async () => {
    try {
      setLoadingData(true);

      // Load existing routing IDs
      const entries = await listRoutingEntries(undefined, selectedCompanyProjectId ?? undefined);
      const uniqueRoutingIds = Array.from(new Set(entries.map(e => e.routingId)));
      setExistingRoutingIds(uniqueRoutingIds);

      // Load message stores
      const stores = await listMessageStores(undefined, selectedCompanyProjectId ?? undefined);
      setMessageStores(stores);

      // Load all languages
      const languages = await listLanguages();
      setAllLanguages(languages);
      setAvailableLanguages(languages);

      // Set default language if available
      if (languages.length > 0 && !languageCode) {
        const defaultLang = languages.find(l => l.languageCode === 'en-US') || languages[0];
        setLanguageCode(defaultLang.languageCode);
      }

      // Set company project ID
      if (selectedCompanyProjectId) {
        setCompanyProjectId(selectedCompanyProjectId);
      }
    } catch (error) {
      toast.error('Failed to load dialog data', {
        description: getApiErrorMessage(error),
      });
    } finally {
      setLoadingData(false);
    }
  };

  const loadSegmentsForRouting = async (routingIdValue: string) => {
    try {
      const segments = await listSegments(routingIdValue);
      const segmentNames = segments.map(s => s.segmentName);
      setAvailableSegments(segmentNames);
    } catch {
      // Routing might not exist yet, that's okay
      setAvailableSegments([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyProjectId) {
      toast.error('Please select a company project');
      return;
    }

    // Validate JSON fields
    let parsedFeatureFlags: Record<string, unknown> | undefined;
    let parsedConfig: Record<string, unknown> | undefined;

    if (featureFlags.trim()) {
      try {
        parsedFeatureFlags = JSON.parse(featureFlags);
        if (typeof parsedFeatureFlags !== 'object' || Array.isArray(parsedFeatureFlags)) {
          toast.error('FeatureFlags must be a valid JSON object');
          return;
        }
      } catch {
        toast.error('Invalid JSON in FeatureFlags field');
        return;
      }
    }

    if (config.trim()) {
      try {
        parsedConfig = JSON.parse(config);
        if (typeof parsedConfig !== 'object' || Array.isArray(parsedConfig)) {
          toast.error('Config must be a valid JSON object');
          return;
        }
      } catch {
        toast.error('Invalid JSON in Config field');
        return;
      }
    }

    try {
      setLoading(true);
      await createRoutingEntry({
        sourceId: sourceId.trim(),
        routingId: routingId.trim(),
        companyProjectId,
        initSegment: initSegment.trim(),
        languageCode: languageCode || undefined,
        messageStoreId: messageStoreId || undefined,
        schedulerId: schedulerId ? parseInt(schedulerId, 10) : undefined,
        featureFlags: parsedFeatureFlags,
        config: parsedConfig,
        isActive: isActive,
      });

      // Invalidate cache to trigger refresh
      queryClient.invalidateQueries({ queryKey: ['routing-entries'] });

      toast.success('Routing configuration created successfully!', {
        description: 'Your new routing configuration is now active.',
      });

      // Reset form
      resetForm();
      setOpen(false);
    } catch (error: unknown) {
      toast.error('Failed to create routing entry', {
        description: getApiErrorMessage(error),
      });
      console.error('Error creating routing entry:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSourceId('');
    setRoutingId('');
    setIsNewRoutingId(false);
    setCompanyProjectId(selectedCompanyProjectId ?? undefined);
    setLanguageCode('');
    setMessageStoreId(undefined);
    setSchedulerId('');
    setInitSegment('GET_LANGUAGE');
    setFeatureFlags('');
    setConfig('');
    setIsActive(true);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2 min-h-[44px]">
          <Plus className="w-4 h-4" />
          Create Routing
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-[700px] lg:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-slate-900">Create New Routing Configuration</DialogTitle>
            <DialogDescription className="text-slate-600">
              Configure a new IVR routing entry. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>

          {loadingData ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <p className="ml-3 text-slate-600">Loading options...</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              <div className="space-y-6 py-4">
                {/* Basic Information Section */}
                <div className="space-y-4 bg-white">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-indigo-500"></span>
                    Basic Information
                  </h3>
                  {/* Source ID */}
                  <div className="space-y-2">
                    <Label htmlFor="source-id" className="text-slate-700 font-medium">
                      Source ID <span className="text-red-500">*</span>
                    </Label>
                  <Input
                    id="source-id"
                    value={sourceId}
                    onChange={(e) => setSourceId(e.target.value)}
                    placeholder="e.g., +3212345678"
                    className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20"
                    required
                    maxLength={150}
                  />
                    <p className="text-xs text-slate-500">Phone number or logical identifier (max 150 characters)</p>
                  </div>

                  {/* Routing ID */}
                  <div className="space-y-2">
                    <Label htmlFor="routing-id" className="text-slate-700 font-medium">
                      Routing ID <span className="text-red-500">*</span>
                    </Label>
                  {isNewRoutingId ? (
                    <div className="flex gap-2">
                      <Input
                        id="routing-id"
                        value={routingId}
                        onChange={(e) => setRoutingId(e.target.value)}
                        placeholder="e.g., EEBL-ENERGYLINE-MAIN"
                        className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20"
                        required
                        maxLength={150}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => { setIsNewRoutingId(false); setRoutingId(''); }}
                        className="border-slate-300 hover:bg-slate-50"
                      >
                        Select Existing
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Select value={routingId} onValueChange={setRoutingId}>
                        <SelectTrigger className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20">
                          <SelectValue placeholder="Select existing routing ID" />
                        </SelectTrigger>
                        <SelectContent>
                          {existingRoutingIds.map((id) => (
                            <SelectItem key={id} value={id}>
                              {id}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => { setIsNewRoutingId(true); setRoutingId(''); }}
                        className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 whitespace-nowrap"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create New
                      </Button>
                    </div>
                  )}
                    <p className="text-xs text-slate-500">Select existing routing or create a new one for segment grouping</p>
                  </div>

                  {/* Company Project ID */}
                  <div className="space-y-2">
                    <Label htmlFor="company-project" className="text-slate-700 font-medium">
                      Company Project <span className="text-red-500">*</span>
                    </Label>
                  <Select
                    value={companyProjectId?.toString() || ''}
                    onValueChange={(val) => setCompanyProjectId(parseInt(val, 10))}
                  >
                    <SelectTrigger className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20">
                      <SelectValue placeholder="Select company project" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProjects.map((project) => (
                        <SelectItem key={project.companyProjectId} value={project.companyProjectId.toString()}>
                          {project.customerId}/{project.projectId} <span className="text-xs text-slate-500">ID:{project.companyProjectId}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                    <p className="text-xs text-slate-500">Select the company project for this routing</p>
                  </div>
                </div>

                {/* Configuration Section */}
                <div className="space-y-4 bg-white">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-indigo-500"></span>
                    Configuration
                  </h3>

                  {/* Message Store */}
                  <div className="space-y-2">
                    <Label htmlFor="message-store" className="text-slate-700 font-medium">
                      Message Store
                    </Label>
                  <Select
                    value={messageStoreId?.toString() || 'none'}
                    onValueChange={(val) => setMessageStoreId(val === 'none' ? undefined : parseInt(val, 10))}
                  >
                    <SelectTrigger className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20">
                      <SelectValue placeholder="Select message store" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <span className="text-slate-500">None</span>
                      </SelectItem>
                      {messageStores.map((store) => (
                        <SelectItem key={store.messageStoreId} value={store.messageStoreId.toString()}>
                          {store.name} <span className="text-xs text-slate-500">ID:{store.messageStoreId}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                    <p className="text-xs text-slate-500">Message store containing audio/TTS messages</p>
                  </div>

                  {/* Language Code */}
                  <div className="space-y-2">
                    <Label htmlFor="language-code" className="text-slate-700 font-medium">
                      Language {messageStoreId ? <span className="text-red-500">*</span> : ''}
                    </Label>
                  <Select value={languageCode || 'none'} onValueChange={(val) => setLanguageCode(val === 'none' ? '' : val)}>
                    <SelectTrigger className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {!messageStoreId && (
                        <SelectItem value="none">
                          <span className="text-slate-500">None</span>
                        </SelectItem>
                      )}
                      {availableLanguages.map((lang) => (
                        <SelectItem key={lang.languageCode} value={lang.languageCode}>
                          {lang.displayName} ({lang.languageCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                    <p className="text-xs text-slate-500">
                      {messageStoreId
                        ? 'Filtered to message store allowed languages'
                        : 'BCP47 format (e.g., en-US, nl-BE)'}
                    </p>
                  </div>

                  {/* Scheduler ID */}
                  <div className="space-y-2">
                    <Label htmlFor="scheduler-id" className="text-slate-700 font-medium">
                      Scheduler ID
                    </Label>
                  <Input
                    id="scheduler-id"
                    type="number"
                    value={schedulerId}
                    onChange={(e) => setSchedulerId(e.target.value)}
                    placeholder="e.g., 1"
                    className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20"
                  />
                    <p className="text-xs text-slate-500">Scheduler ID for business hours check</p>
                  </div>

                  {/* Initial Segment */}
                  <div className="space-y-2">
                    <Label htmlFor="init-segment" className="text-slate-700 font-medium">
                      Initial Segment <span className="text-red-500">*</span>
                    </Label>
                  {availableSegments.length > 0 ? (
                    <Select value={initSegment} onValueChange={setInitSegment}>
                      <SelectTrigger className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20">
                        <SelectValue placeholder="Select initial segment" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSegments.map((seg) => (
                          <SelectItem key={seg} value={seg}>
                            {seg}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="init-segment"
                      value={initSegment}
                      onChange={(e) => setInitSegment(e.target.value)}
                      placeholder="GET_LANGUAGE"
                      className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20"
                      required
                      maxLength={100}
                    />
                  )}
                    <p className="text-xs text-slate-500">
                      {availableSegments.length > 0
                        ? 'Select from existing segments for this routing'
                        : 'Segment name to start call flow (default: GET_LANGUAGE)'}
                    </p>
                  </div>
                </div>

                {/* Advanced Settings Section */}
                <div className="space-y-4 bg-white">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-indigo-500"></span>
                    Advanced Settings
                  </h3>

                  {/* Feature Flags */}
                  <div className="space-y-2">
                    <Label htmlFor="feature-flags" className="text-slate-700 font-medium">
                      Feature Flags
                    </Label>
                  <JsonEditorComponent
                    id="feature-flags"
                    value={featureFlags}
                    onChange={setFeatureFlags}
                    placeholder='{"enableRecording": true, "timeout": 30}'
                  />
                    <p className="text-xs text-slate-500">JSON object for feature flags (default: {})</p>
                  </div>

                  {/* Config */}
                  <div className="space-y-2">
                    <Label htmlFor="config" className="text-slate-700 font-medium">
                      Configuration
                    </Label>
                  <JsonEditorComponent
                    id="config"
                    value={config}
                    onChange={setConfig}
                    placeholder='{"maxRetries": 3, "fallbackNumber": "+32123456789"}'
                  />
                    <p className="text-xs text-slate-500">JSON object for additional configuration (default: {})</p>
                  </div>

                  {/* Is Active */}
                  <div className="flex items-center justify-between rounded-md border border-slate-200/60 p-4">
                    <div>
                      <Label htmlFor="is-active" className="text-slate-700 font-medium cursor-pointer">
                        Active Status
                      </Label>
                      <p className="text-xs text-slate-500 mt-1">Enable this routing entry immediately</p>
                    </div>
                    <Switch
                      id="is-active"
                      checked={isActive}
                      onCheckedChange={setIsActive}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex-shrink-0 mt-4 pt-4 border-t border-slate-200 flex items-center justify-between gap-4 bg-white">
            <div className="flex-1"></div>
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setOpen(false); resetForm(); }}
                disabled={loading}
                className="border-slate-300 hover:bg-slate-50 min-h-[44px]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || loadingData}
                className="bg-indigo-600 hover:bg-indigo-700 text-white min-h-[44px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Routing Entry
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

