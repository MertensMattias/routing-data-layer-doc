import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';
import type { SegmentType } from '@/api/types';
import { SegmentCategory } from '@/api/types';
import { updateSegmentType } from '@/services/configuration';
import { getApiErrorMessage } from '@/api/client';

interface BasicInfoTabProps {
  segmentType: SegmentType;
  onSuccess: () => void;
  onClose: () => void;
}

export function BasicInfoTab({ segmentType, onSuccess, onClose }: BasicInfoTabProps) {
  const [displayName, setDisplayName] = useState(segmentType.displayName || '');
  const [description, setDescription] = useState(segmentType.description || '');
  const [category, setCategory] = useState<string>(segmentType.category || 'none');
  const [isTerminal, setIsTerminal] = useState(segmentType.isTerminal);
  const [isActive, setIsActive] = useState(segmentType.isActive);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      await updateSegmentType(segmentType.segmentTypeName, {
        displayName,
        description: description || undefined,
        category: category && category !== 'none' ? (category as SegmentCategory) : undefined,
        isTerminal,
        isActive,
      });
      toast.success('Segment type updated successfully');
      onSuccess();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err) || 'Failed to update segment type');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = () => {
    return (
      displayName !== (segmentType.displayName || '') ||
      description !== (segmentType.description || '') ||
      category !== (segmentType.category || 'none') ||
      isTerminal !== segmentType.isTerminal ||
      isActive !== segmentType.isActive
    );
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Edit basic information for this segment type. The segment type name cannot be changed.
        </AlertDescription>
      </Alert>

      {/* Form Fields */}
      <div className="space-y-4">
        {/* Segment Type Name (Read-only) */}
        <div className="space-y-2">
          <Label>Segment Type Name</Label>
          <Input
            value={segmentType.segmentTypeName}
            disabled
            className="font-mono bg-muted"
          />
          <p className="text-sm text-muted-foreground">
            The segment type name is immutable and cannot be changed
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
        </div>

        {/* Terminal Flag */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="isTerminal">Terminal Segment</Label>
            <p className="text-sm text-muted-foreground">
              Segments of this type will end the routing flow
            </p>
          </div>
          <Switch
            id="isTerminal"
            checked={isTerminal}
            onCheckedChange={setIsTerminal}
          />
        </div>

        {/* Active Flag */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="isActive">Active</Label>
            <p className="text-sm text-muted-foreground">
              Only active segment types can be used in routing flows
            </p>
          </div>
          <Switch
            id="isActive"
            checked={isActive}
            onCheckedChange={setIsActive}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving || !hasChanges()}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}

