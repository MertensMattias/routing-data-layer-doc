import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { SegmentCategory } from '@/api/types';
import type { WizardFormData } from '../SegmentTypeWizard';

interface Step1BasicInfoProps {
  formData: WizardFormData;
  onNext: (data: Partial<WizardFormData>) => void;
  onCancel: () => void;
}

export function Step1BasicInfo({ formData, onNext, onCancel }: Step1BasicInfoProps) {
  const [segmentTypeName, setSegmentTypeName] = useState(formData.segmentTypeName);
  const [displayName, setDisplayName] = useState(formData.displayName);
  const [description, setDescription] = useState(formData.description);
  const [category, setCategory] = useState<string>(formData.category || 'none');
  const [isTerminal, setIsTerminal] = useState(formData.isTerminal);
  const [isActive, setIsActive] = useState(formData.isActive);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!segmentTypeName.trim()) {
      newErrors.segmentTypeName = 'Segment type name is required';
    } else if (!/^[a-z_][a-z0-9_]*$/.test(segmentTypeName)) {
      newErrors.segmentTypeName = 'Must be lowercase_snake_case (e.g., api_call, menu_option)';
    }

    if (!displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext({
        segmentTypeName,
        displayName,
        description,
        category: category && category !== 'none' ? (category as SegmentCategory) : undefined,
        isTerminal,
        isActive,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Segment types define the structure of routing segments with configurable keys.
          After creation, you cannot change the segment type name.
        </AlertDescription>
      </Alert>

      {/* Form Fields */}
      <div className="space-y-4">
        {/* Segment Type Name */}
        <div className="space-y-2">
          <Label htmlFor="segmentTypeName">
            Segment Type Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="segmentTypeName"
            value={segmentTypeName}
            onChange={(e) => setSegmentTypeName(e.target.value)}
            placeholder="e.g., api_call, menu_option"
            className={errors.segmentTypeName ? 'border-destructive' : ''}
          />
          {errors.segmentTypeName && (
            <p className="text-sm text-destructive">{errors.segmentTypeName}</p>
          )}
          <p className="text-sm text-muted-foreground">
            Must be lowercase_snake_case. Cannot be changed after creation.
          </p>
        </div>

        {/* Display Name */}
        <div className="space-y-2">
          <Label htmlFor="displayName">
            Display Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g., API Call, Menu Option"
            className={errors.displayName ? 'border-destructive' : ''}
          />
          {errors.displayName && (
            <p className="text-sm text-destructive">{errors.displayName}</p>
          )}
          <p className="text-sm text-muted-foreground">
            Human-readable name displayed in the UI
          </p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this segment type"
            rows={3}
          />
          <p className="text-sm text-muted-foreground">
            Optional description to help users understand this segment type
          </p>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="category">
              <SelectValue placeholder="Select category (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value={SegmentCategory.SYSTEM}>System</SelectItem>
              <SelectItem value={SegmentCategory.INTERACTIVE}>Interactive</SelectItem>
              <SelectItem value={SegmentCategory.API}>API</SelectItem>
              <SelectItem value={SegmentCategory.TERMINAL}>Terminal</SelectItem>
              <SelectItem value={SegmentCategory.NAVIGATION}>Navigation</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Optional category for organizing segment types
          </p>
        </div>

        {/* Terminal Flag */}
        <div className="flex items-center space-x-2">
          <Switch
            id="isTerminal"
            checked={isTerminal}
            onCheckedChange={setIsTerminal}
          />
          <Label htmlFor="isTerminal" className="cursor-pointer">
            Terminal segment (ends flow execution)
          </Label>
        </div>
        <p className="text-sm text-muted-foreground ml-8">
          Enable this if segments of this type should end the routing flow
        </p>

        {/* Active Flag */}
        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={isActive}
            onCheckedChange={setIsActive}
          />
          <Label htmlFor="isActive" className="cursor-pointer">
            Active
          </Label>
        </div>
        <p className="text-sm text-muted-foreground ml-8">
          Only active segment types can be used in routing flows
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleNext}>
          Next: Define Keys
        </Button>
      </div>
    </div>
  );
}
