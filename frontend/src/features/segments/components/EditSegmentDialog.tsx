import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Loader2, Save, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { SegmentType } from '@/api/types';
import { DynamicConfigForm } from './segment-form/DynamicConfigForm';
import { HooksEditor } from './segment-form/HooksEditor';
import { TransitionManager, type Transition } from './segment-form/TransitionManager';
import { getSegment, updateSegment, type UpdateSegmentDto } from '@/services/segments/segments.service';
import type { Segment } from '@/api/types';
import apiClient from '@/api/client';
import { getApiErrorMessage } from '@/api/client';
import { useSegmentTypeKeys } from '@/features/flow-designer/hooks/useSegmentTypeKeys';
import { getSegmentType } from '@/services/configuration';
import {
  createChangeSet,
  listChangeSets,
} from '@/services/changeset';
import { publishDraft } from '@/services/flows/flows-draft.service';
import type { ChangeSet, CreateChangeSetDto } from '@/api/types';
import { ChangeSetStatus } from '@/api/types';

interface SegmentFormData {
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

interface EditSegmentDialogProps {
  segmentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditSegmentDialog({ segmentId, open, onOpenChange }: EditSegmentDialogProps) {
  const queryClient = useQueryClient();
  const [selectedSegmentType, setSelectedSegmentType] = useState<SegmentType | null>(null);
  const [hooksValid, setHooksValid] = useState(true);
  const [keyMapping, setKeyMapping] = useState<Record<string, KeyMapping>>({});
  const [changeSet, setChangeSet] = useState<ChangeSet | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['basic']); // Only basic expanded by default

  const {
    data: segment,
    isLoading: isLoadingSegment,
  } = useQuery<Segment>({
    queryKey: ['segment', segmentId],
    queryFn: async () => {
      if (!segmentId) throw new Error('Segment ID is required');
      return getSegment(segmentId);
    },
    enabled: open && !!segmentId,
  });

  // Fetch segment type when segment is loaded
  const { data: segmentTypes = [], isLoading: isLoadingSegmentTypes } = useQuery<SegmentType[]>({
    queryKey: ['segmentTypes'],
    queryFn: async () => {
      const response = await apiClient.get<SegmentType[]>('/segments/types/all');
      return response.data;
    },
    enabled: open,
  });

  // Fetch keys for the segment type
  const segmentTypeName = selectedSegmentType?.segmentTypeName || segment?.segmentTypeName;
  const { data: keys } = useSegmentTypeKeys(segmentTypeName || '');

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<SegmentFormData>({
    defaultValues: {
      config: {},
      isDisplayed: {},
      transitions: [],
    },
  });

  const config = watch('config');
  const isDisplayed = watch('isDisplayed');
  const hooks = watch('hooks');
  const transitions = watch('transitions');

  // Pre-populate form when segment loads
  useEffect(() => {
    if (segment && open && !isLoadingSegmentTypes) {
      // First, try to find segment type in the list
      let segmentType = segmentTypes.find(
        (t) => t.dicSegmentTypeId === segment.dicSegmentTypeId
      );

      // If not found in list (might be inactive), fetch it directly
      if (!segmentType && segment.segmentTypeName) {
        getSegmentType(segment.segmentTypeName, true)
          .then((fetchedType) => {
            setSelectedSegmentType(fetchedType);
          })
          .catch((err) => {
            console.error('Failed to fetch segment type:', err);
            toast.error('Failed to load segment type details');
          });
      } else if (segmentType) {
        setSelectedSegmentType(segmentType);
      }

      // Pre-fill form (always do this, even if segment type is being fetched)
      reset({
        displayName: segment.displayName || '',
        description: '',
        config: {},
        isDisplayed: {},
        hooks: segment.hooks || '',
        transitions: (segment.transitions || []).map(t => ({
          resultName: t.resultName,
          nextSegmentId: t.nextSegmentId ?? null,
          contextKey: undefined,
          params: null,
          transitionOrder: 0,
        })),
      });

      // Pre-fill config values (only if keys are available)
      if (segment.configs && keys && keys.length > 0) {
        const configObj: Record<string, unknown> = {};
        const displayedObj: Record<string, boolean> = {};
        const mapping: Record<string, KeyMapping> = {};

        keys.forEach((key) => {
          mapping[key.keyName] = {
            keyName: key.keyName,
            dicKeyId: key.dicKeyId,
          };

          const configItem = segment.configs?.find((c) => c.dicKeyId === key.dicKeyId);
          if (configItem) {
            // Parse value based on type
            const value = configItem.value;
            if (key.typeName?.toLowerCase() === 'json' || key.typeName?.toLowerCase() === 'object') {
              try {
                configObj[key.keyName] = JSON.parse(value || '{}');
              } catch {
                configObj[key.keyName] = value;
              }
            } else if (key.typeName?.toLowerCase() === 'boolean' || key.typeName?.toLowerCase() === 'bool') {
              configObj[key.keyName] = value === 'true' || value === 'True';
            } else if (key.typeName?.toLowerCase() === 'number' || key.typeName?.toLowerCase() === 'integer') {
              configObj[key.keyName] = value ? parseFloat(value) : undefined;
            } else {
              configObj[key.keyName] = value;
            }
            displayedObj[key.keyName] = true; // Assume displayed if value exists
          } else {
            displayedObj[key.keyName] = key.isDisplayed ?? true;
          }
        });

        setValue('config', configObj);
        setValue('isDisplayed', displayedObj);
        setKeyMapping(mapping);
      }
    }
  }, [segment, keys, open, reset, setValue, segmentTypes, isLoadingSegmentTypes]);

  // Keep only Basic Information expanded by default - removed auto-expand logic

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      reset();
      setSelectedSegmentType(null);
      setHooksValid(true);
      setKeyMapping({});
      setChangeSet(null);
      setIsPublishing(false);
      setExpandedSections(['basic']);
    }
  }, [open, reset]);


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

  const saveAsDraft = async (data: SegmentFormData) => {
    if (!segmentId || !selectedSegmentType || !segment || !hooksValid) {
      return;
    }

    try {
      let draftChangeSet = changeSet;

      // If segment is published (no changeSetId), create a draft ChangeSet
      if (!segment.changeSetId && !draftChangeSet) {
        const existingChangeSets = await listChangeSets(segment.routingId);
        draftChangeSet = existingChangeSets.find(cs => cs.status === ChangeSetStatus.DRAFT) || null;

        if (!draftChangeSet) {
          // Create new draft
          const createDto: CreateChangeSetDto = {
            routingId: segment.routingId,
            initSegment: segment.segmentName,
            createdBy: 'user@example.com', // TODO: Get from auth context
          };
          draftChangeSet = await createChangeSet(createDto);
        }
        setChangeSet(draftChangeSet);
      }

      // Map form data to UpdateSegmentDto
      const configs = Object.entries(data.config)
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

      const updateDto: UpdateSegmentDto = {
        displayName: data.displayName || undefined,
        hooks: data.hooks || undefined,
        configs: configs.length > 0 ? configs : undefined,
        transitions: transitionsDto.length > 0 ? transitionsDto : undefined,
        changeSetId: draftChangeSet?.changeSetId, // Update with ChangeSet ID if draft
      };

      await updateSegment(segmentId, updateDto);
      toast.success('Segment saved as draft!');
      queryClient.invalidateQueries({ queryKey: ['segments'] });
      queryClient.invalidateQueries({ queryKey: ['segment', segmentId] });
      // Don't close dialog - user might want to publish
    } catch (error: unknown) {
      toast.error('Failed to save segment as draft: ' + getApiErrorMessage(error));
    }
  };

  const publishSegment = async () => {
    if (!changeSet) {
      toast.error('No draft ChangeSet to publish. Save as draft first.');
      return;
    }

    if (!changeSet.routingId || !changeSet.changeSetId) {
      toast.error('Cannot publish: Missing routing ID or change set ID');
      return;
    }

    try {
      setIsPublishing(true);
      // Publish the ChangeSet (publishes all segments in it)
      await publishDraft(changeSet.routingId, changeSet.changeSetId);
      toast.success('Segment published successfully!');
      queryClient.invalidateQueries({ queryKey: ['segments'] });
      queryClient.invalidateQueries({ queryKey: ['segment', segmentId] });
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error('Failed to publish segment: ' + getApiErrorMessage(error));
    } finally {
      setIsPublishing(false);
    }
  };

  const onSubmit = async (data: SegmentFormData) => {
    // Default behavior: save as draft, then user can publish
    await saveAsDraft(data);
  };

  if (!open || !segmentId) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[1000px] lg:max-w-[1100px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-slate-900">Edit Segment</DialogTitle>
          <DialogDescription className="text-slate-600">
            Update segment configuration and properties.
          </DialogDescription>
        </DialogHeader>
        {isLoadingSegment ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              <div className="space-y-6">
                {/* Segment Type (Read-only) */}
                <div className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="segment-type" className="text-slate-700 font-medium">Segment Type</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-slate-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        The segment type defines the behavior and available configuration options. It cannot be changed after creation.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="segment-type"
                    value={selectedSegmentType?.displayName || selectedSegmentType?.segmentTypeName || ''}
                    disabled
                    className="bg-white border-slate-200 text-slate-600"
                  />
                  <p className="text-xs text-slate-500">
                    Segment type cannot be changed after creation.
                  </p>
                </div>

                {/* Collapsible Sections */}
                {isLoadingSegmentTypes ? (
                  <div className="text-center py-12 text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    <p>Loading segment types...</p>
                  </div>
                ) : selectedSegmentType ? (
                  <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                    <Accordion
                      type="multiple"
                      value={expandedSections}
                      onValueChange={setExpandedSections}
                      className="border-0"
                    >
                      {/* Basic Information */}
                      <AccordionItem value="basic" className="border-slate-200/60 px-6">
                        <AccordionTrigger className="hover:no-underline py-4">
                          <div className="flex items-center gap-2">
                            <span className="h-1 w-1 rounded-full bg-indigo-500"></span>
                            <span className="font-semibold text-slate-900">Basic Information</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-1 pb-6">
                        <div className="space-y-4 pt-2 px-1">
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
                      </AccordionContent>
                    </AccordionItem>

                      {/* Configuration */}
                      <AccordionItem value="configuration" className="border-slate-200/60 px-6">
                        <AccordionTrigger className="hover:no-underline py-4">
                          <div className="flex items-center gap-2">
                            <span className="h-1 w-1 rounded-full bg-indigo-500"></span>
                            <span className="font-semibold text-slate-900">Configuration</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-1 pb-6">
                        <div className="pt-2">
                          <DynamicConfigForm
                            segmentType={selectedSegmentType.segmentTypeName}
                            config={config}
                            isDisplayed={isDisplayed}
                            onConfigChange={handleConfigChange}
                            onDisplayedChange={handleDisplayedChange}
                            onKeysLoaded={(loadedKeys) => {
                              const mapping: Record<string, KeyMapping> = {};
                              loadedKeys.forEach((key) => {
                                mapping[key.keyName] = {
                                  keyName: key.keyName,
                                  dicKeyId: key.dicKeyId,
                                };
                              });
                              setKeyMapping(mapping);
                            }}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                      {/* Hooks */}
                      <AccordionItem value="hooks" className="border-slate-200/60 px-6">
                        <AccordionTrigger className="hover:no-underline py-4">
                          <div className="flex items-center gap-2">
                            <span className="h-1 w-1 rounded-full bg-indigo-500"></span>
                            <span className="font-semibold text-slate-900">Hooks</span>
                            <Badge variant="outline" className="ml-2 text-xs border-slate-300 text-slate-600">Optional</Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-1 pb-6">
                        <div className="pt-2 px-1">
                          <HooksEditor
                            defaultHooks={selectedSegmentType.hooks}
                            hooksSchema={selectedSegmentType.hooksSchema}
                            value={hooks}
                            onChange={handleHooksChange}
                            onValidationChange={handleHooksValidation}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                      {/* Transitions */}
                      {segment && (
                        <AccordionItem value="transitions" className="border-slate-200/60 px-6 border-b-0">
                          <AccordionTrigger className="hover:no-underline py-4">
                            <div className="flex items-center gap-2">
                              <span className="h-1 w-1 rounded-full bg-indigo-500"></span>
                              <span className="font-semibold text-slate-900">Transitions</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-1 pb-6">
                          <div className="pt-2 px-1">
                            <TransitionManager
                              transitions={transitions}
                              onChange={handleTransitionsChange}
                              routingId={segment.routingId}
                              currentSegmentName={segment.segmentName}
                              mode="edit"
                              showValidation
                              compact
                            />
                          </div>
                          </AccordionContent>
                        </AccordionItem>
                      )}
                    </Accordion>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <p>Loading segment type...</p>
                  </div>
                )}
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
                {segment && !segment.changeSetId && !changeSet && (
                  <div className="text-sm text-slate-500">Published segment - will create draft on save</div>
                )}
              </div>
              <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="border-slate-300 hover:bg-slate-50 min-h-[44px]"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubmit(saveAsDraft)(e);
                  }}
                  disabled={isSubmitting || !selectedSegmentType || !hooksValid}
                  className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 min-h-[44px]"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Saving...' : 'Save as Draft'}
                </Button>
                {changeSet && (
                  <Button
                    type="button"
                    onClick={publishSegment}
                    disabled={isPublishing || changeSet.status !== ChangeSetStatus.DRAFT}
                    className="bg-indigo-600 hover:bg-indigo-700 min-h-[44px]"
                  >
                    {isPublishing ? 'Publishing...' : 'Publish'}
                  </Button>
                )}
                {!changeSet && segment && !segment.changeSetId && (
                  <Button
                    type="submit"
                    disabled={isSubmitting || !selectedSegmentType || !hooksValid}
                    className="bg-indigo-600 hover:bg-indigo-700 min-h-[44px]"
                  >
                    {isSubmitting ? 'Updating...' : 'Update & Publish'}
                  </Button>
                )}
              </div>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

