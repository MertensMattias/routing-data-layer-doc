import { useEffect } from 'react';
import { useSegmentTypeKeys } from '@/features/flow-designer/hooks/useSegmentTypeKeys';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, AlertCircle } from 'lucide-react';
import type { KeyResponse } from '@/api/types';

interface DynamicConfigFormProps {
  segmentType: string;
  config: Record<string, unknown>;
  isDisplayed: Record<string, boolean>;
  onConfigChange: (key: string, value: unknown) => void;
  onDisplayedChange: (key: string, displayed: boolean) => void;
  onKeysLoaded?: (keys: KeyResponse[]) => void;
}

export function DynamicConfigForm({
  segmentType,
  config,
  isDisplayed,
  onConfigChange,
  onDisplayedChange,
  onKeysLoaded,
}: DynamicConfigFormProps) {
  const { data: keys, isLoading, error } = useSegmentTypeKeys(segmentType);

  // Notify parent when keys are loaded
  useEffect(() => {
    if (keys && keys.length > 0 && onKeysLoaded) {
      onKeysLoaded(keys);
    }
  }, [keys, onKeysLoaded]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading configuration</h3>
            <p className="mt-1 text-sm text-red-700">{(error as Error).message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!keys || keys.length === 0) {
    return (
      <div className="text-sm text-gray-500 py-4">
        No configuration keys defined for this segment type.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {keys.map((key) => {
        const value = config[key.keyName] ?? key.defaultValue ?? '';
        const displayed = isDisplayed[key.keyName] ?? key.isDisplayed ?? true;

        return (
          <div key={key.keyName} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={`config-${key.keyName}`} className="text-sm font-medium">
                {key.displayName || key.keyName}
                {key.isRequired && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`displayed-${key.keyName}`}
                  checked={displayed}
                  onCheckedChange={(checked) =>
                    onDisplayedChange(key.keyName, checked === true)
                  }
                />
                <Label
                  htmlFor={`displayed-${key.keyName}`}
                  className="text-xs text-gray-500 cursor-pointer"
                >
                  Display
                </Label>
              </div>
            </div>
            {renderField(key, value, displayed, (newValue) =>
              onConfigChange(key.keyName, newValue)
            )}
          </div>
        );
      })}
    </div>
  );
}

function renderField(
  key: KeyResponse,
  value: unknown,
  displayed: boolean,
  onChange: (value: unknown) => void
) {
  if (!displayed) return null;

  const dataType = key.typeName?.toLowerCase() || 'string';
  const commonProps = {
    id: `config-${key.keyName}`,
    className: 'w-full',
    placeholder: key.defaultValue || undefined,
  };

  switch (dataType) {
    case 'string':
    case 'text':
      return (
        <Input
          type="text"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          {...commonProps}
        />
      );
    case 'number':
    case 'integer':
    case 'int':
      return (
        <Input
          type="number"
          value={value !== undefined && value !== null ? String(value) : ''}
          onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
          {...commonProps}
        />
      );
    case 'boolean':
    case 'bool':
      return (
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`config-${key.keyName}`}
            checked={value === true || value === 'true'}
            onCheckedChange={(checked) => onChange(checked === true)}
          />
          <Label htmlFor={`config-${key.keyName}`} className="text-sm text-gray-600">
            {key.displayName || key.keyName}
          </Label>
        </div>
      );
    case 'json':
    case 'object':
      return (
        <Textarea
          value={
            typeof value === 'string'
              ? value
              : value !== undefined && value !== null
              ? JSON.stringify(value, null, 2)
              : ''
          }
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              onChange(parsed);
            } catch {
              // Keep invalid JSON until user finishes typing
              onChange(e.target.value);
            }
          }}
          rows={4}
          id={commonProps.id}
          placeholder={commonProps.placeholder}
          className="w-full font-mono text-xs"
        />
      );
    default:
      return (
        <Input
          type="text"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          {...commonProps}
        />
      );
  }
}
