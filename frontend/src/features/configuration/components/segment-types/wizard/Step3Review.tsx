import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { WizardFormData } from '../SegmentTypeWizard';
import type { KeyConfig } from '@/api/types';
import { createSegmentType } from '@/services/configuration';
import { getApiErrorMessage } from '@/api/client';

interface Step3ReviewProps {
  formData: WizardFormData;
  onBack: () => void;
  onSubmit: () => void;
}

export function Step3Review({ formData, onBack, onSubmit }: Step3ReviewProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    try {
      setIsSubmitting(true);

      // Category is required by the API
      if (!formData.category) {
        toast.error('Category is required');
        setIsSubmitting(false);
        return;
      }

      await createSegmentType({
        segmentTypeName: formData.segmentTypeName,
        displayName: formData.displayName,
        description: formData.description || undefined,
        category: formData.category,
        isTerminal: formData.isTerminal,
        isActive: formData.isActive,
        keys: formData.keys,
      });
      toast.success('Segment type created successfully');
      onSubmit();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err) || 'Failed to create segment type');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          Review your segment type configuration. Click "Create Segment Type" to save.
        </AlertDescription>
      </Alert>

      {/* Basic Information */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Basic Information</h3>
        <div className="rounded-lg border p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="text-sm font-medium text-muted-foreground">Segment Type Name:</div>
            <div className="text-sm font-mono">{formData.segmentTypeName}</div>

            <div className="text-sm font-medium text-muted-foreground">Display Name:</div>
            <div className="text-sm">{formData.displayName}</div>

            {formData.description && (
              <>
                <div className="text-sm font-medium text-muted-foreground">Description:</div>
                <div className="text-sm">{formData.description}</div>
              </>
            )}

            {formData.category && (
              <>
                <div className="text-sm font-medium text-muted-foreground">Category:</div>
                <div className="text-sm">
                  <Badge variant="outline" className="capitalize">
                    {formData.category}
                  </Badge>
                </div>
              </>
            )}

            <div className="text-sm font-medium text-muted-foreground">Terminal:</div>
            <div className="text-sm">
              {formData.isTerminal ? (
                <Badge variant="default">Yes</Badge>
              ) : (
                <Badge variant="outline">No</Badge>
              )}
            </div>

            <div className="text-sm font-medium text-muted-foreground">Active:</div>
            <div className="text-sm">
              <Badge variant={formData.isActive ? 'default' : 'secondary'}>
                {formData.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Keys */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Keys ({formData.keys.length})</h3>
        <div className="rounded-lg border">
          {formData.keys.map((key: KeyConfig, index: number) => (
            <div
              key={index}
              className={`p-4 ${index < formData.keys.length - 1 ? 'border-b' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="font-medium font-mono text-sm">{key.keyName}</div>
                  {key.displayName && (
                    <div className="text-sm text-muted-foreground">{key.displayName}</div>
                  )}
                </div>
                <div className="flex gap-2">
                  {key.isRequired && <Badge variant="default">Required</Badge>}
                  {!key.isRequired && <Badge variant="outline">Optional</Badge>}
                </div>
              </div>
              <div className="mt-2 flex gap-2 flex-wrap text-xs text-muted-foreground">
                <span>Type ID: {key.dicTypeId}</span>
                {key.defaultValue && <span>• Default: {key.defaultValue}</span>}
                <span>• Displayed: {key.isDisplayed !== false ? 'Yes' : 'No'}</span>
                <span>• Editable: {key.isEditable !== false ? 'Yes' : 'No'}</span>
                <span>• Active: {key.isActive !== false ? 'Yes' : 'No'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
          Back
        </Button>
        <Button onClick={handleCreate} disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Segment Type
        </Button>
      </div>
    </div>
  );
}

