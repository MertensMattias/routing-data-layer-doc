import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, X } from 'lucide-react';
import type { Transition } from './TransitionManager';
import type { Segment } from '@/api/types';

interface AddTransitionDialogProps {
  /**
   * Dialog open state
   */
  open: boolean;

  /**
   * Existing transition to edit (undefined = create new)
   */
  transition?: Transition;

  /**
   * Available target segments (filtered)
   */
  availableTargets: Segment[];

  /**
   * Callback when transition is saved
   */
  onSave: (transition: Transition) => void;

  /**
   * Callback when dialog is closed
   */
  onClose: () => void;
}

/**
 * AddTransitionDialog - Dialog for creating/editing a single transition
 *
 * Features:
 * - Create or edit mode based on presence of `transition` prop
 * - Target segment dropdown (with Terminal option)
 * - Optional context key and params (JSON)
 * - Result name validation (required, no empty strings)
 * - JSON validation for params field
 *
 * Note: This component uses a key prop in the parent to force remount
 * when transitioning between add/edit modes, ensuring clean state reset.
 */
export function AddTransitionDialog({
  open,
  transition,
  availableTargets,
  onSave,
  onClose,
}: AddTransitionDialogProps) {
  const isEditMode = !!transition;

  // Compute initial values directly from transition prop
  const initialResultName = transition?.resultName || '';
  const initialNextSegment =
    transition?.nextSegmentName ||
    transition?.nextSegmentId ||
    '__terminal__';
  const initialContextKey = transition?.contextKey || '';
  const initialParams = transition?.params || '';

  // Form state - Direct initialization from props (no useEffect needed)
  const [resultName, setResultName] = useState(initialResultName);
  const [nextSegmentName, setNextSegmentName] = useState<string>(initialNextSegment);
  const [contextKey, setContextKey] = useState(initialContextKey);
  const [params, setParams] = useState(initialParams);

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Result name is required
    if (!resultName || resultName.trim() === '') {
      newErrors.resultName = 'Result name is required';
    }

    // Validate JSON params if provided
    if (params && params.trim() !== '') {
      try {
        JSON.parse(params);
      } catch {
        newErrors.params = 'Invalid JSON format';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = () => {
    if (!validate()) {
      return;
    }

    const newTransition: Transition = {
      resultName: resultName.trim(),
      nextSegmentName: nextSegmentName === '__terminal__' ? null : nextSegmentName,  // NAME-BASED (preferred)
      nextSegmentId: null,  // Legacy field - not used
      contextKey: contextKey.trim() || null,
      params: params.trim() || null,
    };

    onSave(newTransition);
  };

  // Handle cancel
  const handleCancel = () => {
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-slate-900">
            {isEditMode ? 'Edit Transition' : 'Add Transition'}
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            {isEditMode
              ? 'Modify the transition details below.'
              : 'Define a new transition for this segment.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Result Name */}
          <div className="space-y-2">
            <Label htmlFor="resultName" className="text-slate-700 font-medium">
              Result Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="resultName"
              placeholder="e.g., success, error, timeout, default"
              value={resultName}
              onChange={(e) => setResultName(e.target.value)}
              className={errors.resultName ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20'}
            />
            {errors.resultName && (
              <p className="text-xs text-red-600">{errors.resultName}</p>
            )}
            <p className="text-xs text-slate-500">
              The result value returned by the segment that triggers this transition.
            </p>
          </div>

          {/* Target Segment */}
          <div className="space-y-2">
            <Label htmlFor="nextSegment" className="text-slate-700 font-medium">
              Target Segment
            </Label>
            <Select
              value={nextSegmentName}
              onValueChange={setNextSegmentName}
            >
              <SelectTrigger id="nextSegment" className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20">
                <SelectValue placeholder="Select target segment or terminal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__terminal__">
                  <span className="font-medium text-slate-500">End (Terminal)</span>
                </SelectItem>
                {availableTargets.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-slate-500">
                    No segments available
                  </div>
                ) : (
                  availableTargets.map((segment) => (
                    <SelectItem key={segment.segmentId} value={segment.segmentName}>
                      {segment.displayName || segment.segmentName}
                      {segment.segmentTypeName && (
                        <span className="ml-2 text-xs text-slate-400">
                          ({segment.segmentTypeName})
                        </span>
                      )}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              The next segment to execute, or leave as Terminal to end the flow.
            </p>
          </div>

          {/* Context Key */}
          <div className="space-y-2">
            <Label htmlFor="contextKey" className="text-slate-700 font-medium">
              Context Key <span className="text-slate-400">(Optional)</span>
            </Label>
            <Input
              id="contextKey"
              placeholder="e.g., user_choice, call_result"
              value={contextKey}
              onChange={(e) => setContextKey(e.target.value)}
              className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20"
            />
            <p className="text-xs text-slate-500">
              Store the result in call context with this key.
            </p>
          </div>

          {/* Params (JSON) */}
          <div className="space-y-2">
            <Label htmlFor="params" className="text-slate-700 font-medium">
              Parameters <span className="text-slate-400">(Optional, JSON)</span>
            </Label>
            <textarea
              id="params"
              placeholder='{"key": "value"}'
              value={params}
              onChange={(e) => setParams(e.target.value)}
              className={`flex min-h-[80px] w-full rounded-md border ${
                errors.params ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20'
              } bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono`}
            />
            {errors.params && (
              <p className="text-xs text-red-600">{errors.params}</p>
            )}
            <p className="text-xs text-slate-500">
              Additional parameters to pass with this transition (must be valid JSON).
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="border-slate-300 hover:bg-slate-50"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {isEditMode ? 'Save Changes' : 'Add Transition'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
