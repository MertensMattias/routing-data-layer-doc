import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import { Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SegmentTypeList } from './segment-form/SegmentTypeList';
import type { SegmentType } from '@/api/types';
import { DynamicConfigForm } from './segment-form/DynamicConfigForm';
import { HooksEditor } from './segment-form/HooksEditor';
import { TransitionManager, type Transition } from './segment-form/TransitionManager';
import { createSegment, type CreateSegmentDto } from '@/services/segments/segments.service';
import { useCompanyProjectContext } from '@/contexts/CompanyProjectContext';
import { listRoutingEntries } from '@/services/routing';
import {
  createChangeSet,
  listChangeSets,
} from '@/services/changeset';
import { publishDraft } from '@/services/flows/flows-draft.service';
import type { ChangeSet, CreateChangeSetDto } from '@/api/types';
import { ChangeSetStatus } from '@/api/types';
import { getApiErrorMessage } from '@/api/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SegmentFormData {
  routingId: string;
  segmentName: string;
  displayName?: string;
  description?: string;
  config: Record<string, unknown>;
  isDisplayed: Record<string, boolean>;
  hooks?: string;
  transitions: Transition[];
}

interface KeyMapping {
  keyName: string;
  dicKeyId: number;
}

interface CreateSegmentDialogProps {
  defaultRoutingId?: string | null;
}

export function CreateSegmentDialog({ defaultRoutingId }: CreateSegmentDialogProps = {}) {
  const { selectedCompanyProjectId } = useCompanyProjectContext();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedSegmentType, setSelectedSegmentType] = useState<SegmentType | null>(null);
  const [routingEntries, setRoutingEntries] = useState<Array<{ routingId: string }>>([]);
  const [hooksValid, setHooksValid] = useState(true);
  const [keyMapping, setKeyMapping] = useState<Record<string, KeyMapping>>({});
  const [changeSet, setChangeSet] = useState<ChangeSet | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<SegmentFormData>({
    defaultValues: {
      routingId: defaultRoutingId || '',
      segmentName: '',
      config: {},
      isDisplayed: {},
      transitions: [],
    },
  });

  // Update routingId when defaultRoutingId changes
  useEffect(() => {
    if (defaultRoutingId && open) {
      setValue('routingId', defaultRoutingId);
    }
  }, [defaultRoutingId, open, setValue]);

  const config = watch('config');
  const isDisplayed = watch('isDisplayed');
  const hooks = watch('hooks');
  const transitions = watch('transitions');
  const routingId = watch('routingId');
  const segmentName = watch('segmentName');

  // Load routing entries
  useEffect(() => {
    if (open && selectedCompanyProjectId) {
      const loadRoutings = async () => {
        try {
          const projectId = selectedCompanyProjectId ?? undefined;
          const data = await listRoutingEntries(undefined, projectId);
          setRoutingEntries(data.map((r) => ({ routingId: r.routingId })));
        } catch (err: unknown) {
          console.error('Error loading routing entries:', getApiErrorMessage(err) || 'Unknown error', err);
          setRoutingEntries([]);
        }
      };
      loadRoutings();
    }
  }, [open, selectedCompanyProjectId]);


  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      reset();
      setSelectedSegmentType(null);
      setHooksValid(true);
      setChangeSet(null);
      setIsPublishing(false);
    }
  }, [open, reset]);

  const handleTypeSelect = (type: SegmentType) => {
    setSelectedSegmentType(type);
    setValue('config', {});
    setValue('isDisplayed', {});
    setKeyMapping({}); // Reset key mapping when type changes
  };

  const handleConfigChange = (key: string, value: unknown) => {
    setValue(`config.${key}`, value, { shouldValidate: true });
  };

  const handleDisplayedChange = (key: string, displayed: boolean) => {
    setValue(`isDisplayed.${key}`, displayed, { shouldValidate: true });
  };

  const handleHooksChange = (hooksValue: string | undefined) => {
    setValue('hooks', hooksValue, { shouldValidate: true });
  };

  const handleHooksValidation = (isValid: boolean) => {
    setHooksValid(isValid);
  };

  const handleTransitionsChange = (newTransitions: Transition[]) => {
    setValue('transitions', newTransitions, { shouldValidate: true });
  };

  const saveAsDraft = async (data: SegmentFormData): Promise<ChangeSet | null> => {
    console.log('[CreateSegmentDialog] saveAsDraft called with data:', {
      routingId: data.routingId,
      segmentName: data.segmentName,
      selectedSegmentType: selectedSegmentType?.segmentTypeName,
      hooksValid,
      hasConfig: Object.keys(data.config || {}).length > 0,
    });

    if (!selectedSegmentType) {
      console.error('[CreateSegmentDialog] Validation failed: No segment type selected');
      toast.error('Please select a segment type');
      return null;
    }

    if (!data.routingId) {
      console.error('[CreateSegmentDialog] Validation failed: No routing ID');
      toast.error('Please select a routing');
      return null;
    }

    if (!data.segmentName) {
      console.error('[CreateSegmentDialog] Validation failed: No segment name');
      toast.error('Please enter a segment name');
      return null;
    }

    if (!hooksValid) {
      console.error('[CreateSegmentDialog] Validation failed: Hooks validation failed');
      toast.error('Please fix hooks errors before saving');
      return null;
    }

    try {
      console.log('[CreateSegmentDialog] Getting or creating draft ChangeSet...');
      // Get or create draft ChangeSet
      const existingChangeSets = await listChangeSets(data.routingId);
      let draftChangeSet = existingChangeSets.find(cs => cs.status === ChangeSetStatus.DRAFT);

      if (!draftChangeSet) {
        // Create new draft (initSegment will be set when first segment is created)
        const createDto: CreateChangeSetDto = {
          routingId: data.routingId,
          initSegment: data.segmentName, // Use first segment name as initSegment
          createdBy: 'user@example.com', // TODO: Get from auth context
        };
        draftChangeSet = await createChangeSet(createDto);
      }
      console.log('[CreateSegmentDialog] ChangeSet created/retrieved:', draftChangeSet.changeSetId);
      setChangeSet(draftChangeSet);

      // Map form data to CreateSegmentDto
      const configs = Object.entries(data.config || {})
        .filter(([keyName, value]) => {
          const displayed = data.isDisplayed[keyName] ?? true;
          return (
            displayed &&
            value !== undefined &&
            value !== null &&
            value !== '' &&
            keyMapping[keyName]
          );
        })
        .map(([keyName, value]) => {
          const mapping = keyMapping[keyName];
          return {
            dicKeyId: mapping.dicKeyId,
            value: typeof value === 'string' ? value : JSON.stringify(value),
          };
        });

      // Map transitions to API format
      const transitionsDto = data.transitions.map((t, index) => {
        let parsedParams: Record<string, unknown> | undefined;
        if (t.params) {
          try {
            parsedParams = JSON.parse(t.params) as Record<string, unknown>;
          } catch {
            // If parsing fails, use empty object
            parsedParams = {};
          }
        }
        // Backend DTO expects: resultName, nextSegmentName (preferred), nextSegmentId (deprecated), contextKey, transitionOrder, params
        return {
          resultName: t.resultName,
          nextSegmentName: t.nextSegmentName || undefined,
          nextSegmentId: t.nextSegmentId || undefined,
          contextKey: t.contextKey || undefined,
          transitionOrder: t.transitionOrder !== undefined ? t.transitionOrder : index,
          params: parsedParams,
        };
      });

      // Ensure dicSegmentTypeId is a number (handle potential string conversion from JSON)
      const dicSegmentTypeId = Number(selectedSegmentType.dicSegmentTypeId);
      if (isNaN(dicSegmentTypeId) || dicSegmentTypeId <= 0) {
        console.error('[CreateSegmentDialog] Validation failed: Invalid dicSegmentTypeId', selectedSegmentType.dicSegmentTypeId);
        toast.error('Invalid segment type selected');
        return null;
      }

      const createDto: CreateSegmentDto = {
        routingId: data.routingId,
        segmentName: data.segmentName,
        dicSegmentTypeId: dicSegmentTypeId,
        displayName: data.displayName || undefined,
        hooks: data.hooks || undefined,
        changeSetId: draftChangeSet.changeSetId, // Save as draft
        configs: configs.length > 0 ? configs : undefined,
        transitions: transitionsDto.length > 0 ? transitionsDto : undefined,
      };

      console.log('[CreateSegmentDialog] Creating segment with DTO:', {
        ...createDto,
        configs: createDto.configs?.length || 0,
      });

      await createSegment(createDto);
      console.log('[CreateSegmentDialog] Segment created successfully');
      toast.success('Segment saved as draft!');
      queryClient.invalidateQueries({ queryKey: ['segments'] });
      // Don't close dialog - user might want to publish
      return draftChangeSet;
    } catch (error: unknown) {
      const errorMessage = getApiErrorMessage(error);
      console.error('[CreateSegmentDialog] Failed to save segment as draft:', error);
      console.error('[CreateSegmentDialog] Error details:', {
        message: errorMessage,
        error,
      });
      toast.error('Failed to save segment as draft: ' + errorMessage);
      return null;
    }
  };

  const publishSegment = async (changeSetToPublish?: ChangeSet) => {
    const targetChangeSet = changeSetToPublish || changeSet;
    if (!targetChangeSet) {
      console.error('[CreateSegmentDialog] No ChangeSet to publish');
      toast.error('No draft ChangeSet to publish. Save as draft first.');
      return;
    }

    try {
      if (!targetChangeSet.routingId || !targetChangeSet.changeSetId) {
        toast.error('Cannot publish: Missing routing ID or change set ID');
        return;
      }
      console.log('[CreateSegmentDialog] Publishing ChangeSet:', targetChangeSet.changeSetId);
      setIsPublishing(true);
      // Publish the ChangeSet (publishes all segments in it)
      await publishDraft(targetChangeSet.routingId, targetChangeSet.changeSetId);
      console.log('[CreateSegmentDialog] ChangeSet published successfully');
      toast.success('Segment published successfully!');
      queryClient.invalidateQueries({ queryKey: ['segments'] });
      setOpen(false);
      reset();
      setSelectedSegmentType(null);
      setChangeSet(null);
    } catch (error: unknown) {
      const errorMessage = getApiErrorMessage(error);
      console.error('[CreateSegmentDialog] Failed to publish segment:', error);
      console.error('[CreateSegmentDialog] Error details:', {
        message: errorMessage,
        error,
      });
      toast.error('Failed to publish segment: ' + errorMessage);
    } finally {
      setIsPublishing(false);
    }
  };

  const onSubmit = async (data: SegmentFormData) => {
    // Default behavior: save as draft, then user can publish
    await saveAsDraft(data);
  };

  const createAndPublish = async (data: SegmentFormData) => {
    console.log('[CreateSegmentDialog] createAndPublish called');

    // First save as draft and get the ChangeSet
    const draftChangeSet = await saveAsDraft(data);

    if (!draftChangeSet) {
      console.error('[CreateSegmentDialog] Failed to create draft, cannot publish');
      toast.error('Failed to create draft. Please check form errors and try again.');
      return;
    }

    console.log('[CreateSegmentDialog] Draft created, now publishing ChangeSet:', draftChangeSet.changeSetId);
    // Immediately publish the ChangeSet
    await publishSegment(draftChangeSet);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2 min-h-[44px]">
          <Plus className="w-4 h-4" />
          Create Segment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-[1000px] lg:max-w-[1100px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-slate-900">Create New Segment</DialogTitle>
          <DialogDescription className="text-slate-600">
            Configure a new IVR segment for your call flow.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-hidden flex flex-col">
          {/* Single unified scroll container */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="grid lg:grid-cols-[1fr_320px] gap-6">
              {/* Left Panel - Form */}
              <div className="space-y-6">
                {/* Basic Fields */}
                <div className="space-y-4 bg-white">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-indigo-500"></span>
                    Basic Information
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="routingId" className="text-slate-700 font-medium">
                      Routing <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={watch('routingId') || ''}
                      onValueChange={(value) => setValue('routingId', value, { shouldValidate: true })}
                      required
                    >
                      <SelectTrigger className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20">
                        <SelectValue placeholder="Select routing" />
                      </SelectTrigger>
                      <SelectContent>
                        {routingEntries.map((routing) => (
                          <SelectItem key={routing.routingId} value={routing.routingId}>
                            {routing.routingId}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.routingId && (
                      <p className="text-xs text-red-600">{errors.routingId.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="segmentName" className="text-slate-700 font-medium">
                      Segment Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="segmentName"
                      {...register('segmentName', {
                        required: 'Segment name is required',
                        pattern: {
                          value: /^[a-z][a-z0-9_]*$/,
                          message: 'Segment name must be snake_case (lowercase letters, numbers, underscores)',
                        },
                      })}
                      placeholder="e.g., welcome_menu"
                      className={errors.segmentName
                        ? "border-red-500 focus:ring-red-500/20"
                        : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20"
                      }
                    />
                    {errors.segmentName && (
                      <p className="text-xs text-red-600">{errors.segmentName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="displayName" className="text-slate-700 font-medium">Display Name</Label>
                    <Input
                      id="displayName"
                      {...register('displayName')}
                      placeholder="e.g., Welcome Menu"
                      className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-slate-700 font-medium">Description</Label>
                    <Textarea
                      id="description"
                      {...register('description')}
                      placeholder="Optional description"
                      rows={3}
                      className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                {/* Dynamic Configuration */}
                {selectedSegmentType && (
                  <div className="space-y-4 bg-white">
                    <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-indigo-500"></span>
                      Configuration
                    </h3>
                    <DynamicConfigForm
                      segmentType={selectedSegmentType.segmentTypeName}
                      config={config}
                      isDisplayed={isDisplayed}
                      onConfigChange={handleConfigChange}
                      onDisplayedChange={handleDisplayedChange}
                      onKeysLoaded={(keys) => {
                        // Build key mapping for dicKeyId lookup
                        const mapping: Record<string, KeyMapping> = {};
                        keys.forEach((key) => {
                          mapping[key.keyName] = {
                            keyName: key.keyName,
                            dicKeyId: key.dicKeyId,
                          };
                        });
                        setKeyMapping(mapping);
                      }}
                    />
                  </div>
                )}

                {/* Hooks Section */}
                {selectedSegmentType && (
                  <div className="space-y-4 bg-white">
                    <div className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-indigo-500 flex-shrink-0"></span>
                      <h3 className="text-sm font-semibold text-slate-900">Hooks</h3>
                      <Badge variant="outline" className="text-xs border-slate-300 text-slate-600">Optional</Badge>
                    </div>
                    <HooksEditor
                      defaultHooks={selectedSegmentType.hooks}
                      hooksSchema={selectedSegmentType.hooksSchema}
                      value={hooks}
                      onChange={handleHooksChange}
                      onValidationChange={handleHooksValidation}
                    />
                  </div>
                )}

                {/* Transitions Section */}
                {selectedSegmentType && routingId && (
                  <div className="space-y-4 bg-white">
                    <TransitionManager
                      transitions={transitions}
                      onChange={handleTransitionsChange}
                      routingId={routingId}
                      currentSegmentName={segmentName}
                      mode="create"
                      showValidation
                      compact
                    />
                  </div>
                )}

                {!selectedSegmentType && (
                  <div className="text-center py-16 text-slate-500 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                    <p className="text-sm">👉 Select a segment type from the panel on the right to begin configuration</p>
                  </div>
                )}
              </div>

              {/* Right Panel - Segment Type List */}
              <div>
                <div className="rounded-lg border border-slate-200 bg-slate-50/50">
                  <SegmentTypeList
                    selectedTypeId={selectedSegmentType?.dicSegmentTypeId}
                    onTypeSelect={handleTypeSelect}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-shrink-0 mt-4 pt-4 border-t border-slate-200 flex items-center justify-between gap-4 bg-white">
            <div className="flex-1">
              {changeSet && (
                <div className="text-sm text-slate-600">
                  <span className="font-medium">Draft ChangeSet:</span> {changeSet.changeSetId.slice(0, 8)}...
                  <span className="ml-2 text-xs text-slate-500">({changeSet.status})</span>
                </div>
              )}
            </div>
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="border-slate-300 hover:bg-slate-50 min-h-[44px]"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={async (e) => {
                  e.preventDefault();
                  console.log('[CreateSegmentDialog] Save as Draft button clicked');
                  try {
                    await handleSubmit(saveAsDraft)(e);
                  } catch (error) {
                    console.error('[CreateSegmentDialog] Form submission error:', error);
                  }
                }}
                disabled={isSubmitting || !selectedSegmentType || !hooksValid}
                className="border-slate-300 hover:bg-slate-50 min-h-[44px]"
              >
                {isSubmitting ? 'Saving...' : 'Save as Draft'}
              </Button>
              {changeSet && (
                <Button
                  type="button"
                  onClick={() => publishSegment()}
                  disabled={isPublishing || changeSet.status !== ChangeSetStatus.DRAFT}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white min-h-[44px]"
                >
                  {isPublishing ? 'Publishing...' : 'Publish'}
                </Button>
              )}
              {!changeSet && (
                <Button
                  type="button"
                  onClick={async (e) => {
                    e.preventDefault();
                    console.log('[CreateSegmentDialog] Create & Publish button clicked');
                    try {
                      await handleSubmit(createAndPublish)(e);
                    } catch (error) {
                      console.error('[CreateSegmentDialog] Form submission error:', error);
                    }
                  }}
                  disabled={isSubmitting || isPublishing || !selectedSegmentType || !hooksValid}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white min-h-[44px]"
                >
                  {isSubmitting || isPublishing ? 'Creating & Publishing...' : 'Create & Publish'}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

