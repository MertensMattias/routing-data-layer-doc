import { useState, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { KeyConfig, KeyType } from '@/api/types';
import { addKeyToSegmentType, updateSegmentTypeKey } from '@/services/configuration';
import { getApiErrorMessage } from '@/api/client';

interface AddKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyTypes: KeyType[];
  existingKey: KeyConfig | null;
  existingKeyNames: string[];
  onSave: (key: KeyConfig) => void;
  segmentTypeName?: string; // If provided, will call API directly; otherwise returns via onSave
}

export function AddKeyDialog({
  open,
  onOpenChange,
  keyTypes,
  existingKey,
  existingKeyNames,
  onSave,
  segmentTypeName,
}: AddKeyDialogProps) {
  const [keyName, setKeyName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [dicTypeId, setDicTypeId] = useState<string>('');
  const [isRequired, setIsRequired] = useState(false);
  const [defaultValue, setDefaultValue] = useState('');
  const [isDisplayed, setIsDisplayed] = useState(true);
  const [isEditable, setIsEditable] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (existingKey) {
        // Edit mode
        setKeyName(existingKey.keyName);
        setDisplayName(existingKey.displayName || '');
        setDicTypeId(existingKey.dicTypeId.toString());
        setIsRequired(existingKey.isRequired || false);
        setDefaultValue(existingKey.defaultValue || '');
        setIsDisplayed(existingKey.isDisplayed !== false);
        setIsEditable(existingKey.isEditable !== false);
        setIsActive(existingKey.isActive !== false);
      } else {
        // Add mode - reset
        setKeyName('');
        setDisplayName('');
        setDicTypeId('');
        setIsRequired(false);
        setDefaultValue('');
        setIsDisplayed(true);
        setIsEditable(true);
        setIsActive(true);
      }
      setErrors({});
    }
  }, [open, existingKey]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!keyName.trim()) {
      newErrors.keyName = 'Key name is required';
    } else if (!/^[a-z_][a-z0-9_]*$/.test(keyName)) {
      newErrors.keyName = 'Must be lowercase_snake_case (e.g., api_url, timeout_ms)';
    } else if (existingKeyNames.includes(keyName)) {
      newErrors.keyName = 'Key name already exists in this segment type';
    }

    if (!dicTypeId) {
      newErrors.dicTypeId = 'Key type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const key: KeyConfig = {
      keyName,
      displayName: displayName || undefined,
      dicTypeId: parseInt(dicTypeId, 10),
      isRequired,
      defaultValue: defaultValue || undefined,
      isDisplayed,
      isEditable,
      isActive,
    };

    // If segmentTypeName provided, call API directly (editor mode)
    if (segmentTypeName) {
      try {
        setIsSaving(true);
        if (existingKey) {
          await updateSegmentTypeKey(segmentTypeName, keyName, key);
          toast.success('Key updated successfully');
        } else {
          await addKeyToSegmentType(segmentTypeName, key);
          toast.success('Key added successfully');
        }
        onSave(key); // Notify parent of success
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err) || 'Failed to save key');
      } finally {
        setIsSaving(false);
      }
    } else {
      // Wizard mode - just return the key data
      onSave(key);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{existingKey ? 'Edit Key' : 'Add Key'}</DialogTitle>
          <DialogDescription>
            Configure a key for storing segment-specific data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Key Name */}
          <div className="space-y-2">
            <Label htmlFor="keyName">
              Key Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="keyName"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="e.g., api_url, timeout_ms"
              disabled={!!existingKey}
              className={errors.keyName ? 'border-destructive' : ''}
            />
            {errors.keyName && (
              <p className="text-sm text-destructive">{errors.keyName}</p>
            )}
            {!existingKey && (
              <p className="text-sm text-muted-foreground">
                Must be lowercase_snake_case. Cannot be changed after creation.
              </p>
            )}
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g., API URL, Timeout (ms)"
            />
            <p className="text-sm text-muted-foreground">
              Optional human-readable name
            </p>
          </div>

          {/* Key Type */}
          <div className="space-y-2">
            <Label htmlFor="dicTypeId">
              Data Type <span className="text-destructive">*</span>
            </Label>
            <Select value={dicTypeId} onValueChange={setDicTypeId}>
              <SelectTrigger id="dicTypeId" className={errors.dicTypeId ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select data type" />
              </SelectTrigger>
              <SelectContent>
                {keyTypes.map((kt) => (
                  <SelectItem key={kt.dicTypeId} value={kt.dicTypeId.toString()}>
                    {kt.displayName || kt.typeName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.dicTypeId && (
              <p className="text-sm text-destructive">{errors.dicTypeId}</p>
            )}
          </div>

          {/* Default Value */}
          <div className="space-y-2">
            <Label htmlFor="defaultValue">Default Value</Label>
            <Input
              id="defaultValue"
              value={defaultValue}
              onChange={(e) => setDefaultValue(e.target.value)}
              placeholder="Optional default value"
            />
          </div>

          {/* Switches */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="isRequired" className="cursor-pointer">
                Required
              </Label>
              <Switch
                id="isRequired"
                checked={isRequired}
                onCheckedChange={setIsRequired}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isDisplayed" className="cursor-pointer">
                Displayed in UI
              </Label>
              <Switch
                id="isDisplayed"
                checked={isDisplayed}
                onCheckedChange={setIsDisplayed}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isEditable" className="cursor-pointer">
                Editable
              </Label>
              <Switch
                id="isEditable"
                checked={isEditable}
                onCheckedChange={setIsEditable}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isActive" className="cursor-pointer">
                Active
              </Label>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {existingKey ? 'Update Key' : 'Add Key'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

