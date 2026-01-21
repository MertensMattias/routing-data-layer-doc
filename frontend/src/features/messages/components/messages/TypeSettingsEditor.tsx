import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

interface TypeSettingsEditorProps {
  schema?: string; // JSON Schema as string
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

interface SchemaProperty {
  type: string;
  title?: string;
  description?: string;
  default?: unknown;
  enum?: string[];
  minimum?: number;
  maximum?: number;
}

interface Schema {
  type: string;
  properties?: Record<string, SchemaProperty>;
  required?: string[];
}

export function TypeSettingsEditor({ schema, value, onChange }: TypeSettingsEditorProps) {
  const [parsedSchema, setParsedSchema] = useState<Schema | null>(null);
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (schema) {
      try {
        const parsed = JSON.parse(schema);
        setParsedSchema(parsed);
      } catch (err) {
        console.error('Invalid schema:', err);
        setParsedSchema(null);
      }
    } else {
      setParsedSchema(null);
    }
  }, [schema]);

  // Always keep jsonText in sync with value when value changes from form edits
  // This ensures JSON view always shows current form state
  useEffect(() => {
    const stringified = JSON.stringify(value, null, 2);
    // Only update if jsonText doesn't already match value
    // This prevents overwriting user input while they're typing in JSON mode
    // (When user edits JSON, handleJsonChange updates both jsonText and value,
    // so they should stay in sync)
    if (jsonText !== stringified) {
      setJsonText(stringified);
      // Clear error when value changes (form edit succeeded)
      if (jsonError) {
        setJsonError(null);
      }
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync JSON text when switching to JSON mode (ensure it's current)
  useEffect(() => {
    if (jsonMode) {
      setJsonText(JSON.stringify(value, null, 2));
      setJsonError(null); // Clear any previous errors when switching modes
    }
  }, [jsonMode, value]);

  // Initialize fields with default values when schema changes
  useEffect(() => {
    if (parsedSchema?.properties) {
      const updatedValue = { ...value };
      let hasChanges = false;

      Object.entries(parsedSchema.properties).forEach(([fieldName, property]) => {
        // If field is not in value and has a default, initialize it
        if (value[fieldName] === undefined && property.default !== undefined) {
          updatedValue[fieldName] = property.default;
          hasChanges = true;
        }
      });

      if (hasChanges) {
        onChange(updatedValue);
      }
    }
  }, [parsedSchema]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFieldChange = (fieldName: string, fieldValue: unknown, property?: SchemaProperty) => {
    // Only include the field if it has a value (not undefined)
    // This prevents empty fields from cluttering the object
    // BUT: preserve fields with default values (including 0, false, empty string if that's the default)
    const updatedValue = { ...value };

    // Check if this field has a default value
    const hasDefault = property?.default !== undefined;

    if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
      // Remove the field if it's empty AND has no default
      // If it has a default, keep it with the default value
      if (hasDefault) {
        updatedValue[fieldName] = property.default;
      } else {
        delete updatedValue[fieldName];
      }
    } else {
      updatedValue[fieldName] = fieldValue;
    }
    onChange(updatedValue);
  };

  const handleJsonChange = (text: string) => {
    setJsonText(text);
    try {
      const parsed = JSON.parse(text);
      setJsonError(null);
      onChange(parsed);
    } catch {
      setJsonError('Invalid JSON');
    }
  };

  const renderField = (fieldName: string, property: SchemaProperty, isRequired: boolean) => {
    // Use default value if field is not in value object
    const fieldValue = value[fieldName] !== undefined ? value[fieldName] : property.default;
    const label = property.title || fieldName;
    const description = property.description;

    switch (property.type) {
      case 'string':
        if (property.enum && property.enum.length > 0) {
          // Dropdown for enum
          return (
            <div key={fieldName} className="space-y-2">
              <Label htmlFor={fieldName}>
                {label} {isRequired && '*'}
              </Label>
              <Select
                value={fieldValue as string}
                onValueChange={(val) => handleFieldChange(fieldName, val, property)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {property.enum.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {description && <p className="text-xs text-slate-500">{description}</p>}
            </div>
          );
        }
        // Text input for string
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName}>
              {label} {isRequired && '*'}
            </Label>
            <Input
              id={fieldName}
              value={(fieldValue as string) || ''}
              onChange={(e) => handleFieldChange(fieldName, e.target.value, property)}
              placeholder={property.default as string}
            />
            {description && <p className="text-xs text-slate-500">{description}</p>}
          </div>
        );

      case 'number':
      case 'integer':
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName}>
              {label} {isRequired && '*'}
            </Label>
            <Input
              id={fieldName}
              type="number"
              value={fieldValue !== undefined && fieldValue !== null ? String(fieldValue) : ''}
              onChange={(e) => {
                const inputValue = e.target.value.trim();
                if (inputValue === '') {
                  // Empty input - use default if available, otherwise undefined
                  const defaultValue = property.default !== undefined ? property.default : undefined;
                  handleFieldChange(fieldName, defaultValue, property);
                } else {
                  const numValue =
                    property.type === 'integer'
                      ? parseInt(inputValue, 10)
                      : parseFloat(inputValue);
                  if (!isNaN(numValue)) {
                    handleFieldChange(fieldName, numValue, property);
                  }
                }
              }}
              onBlur={(e) => {
                // When field loses focus and is empty, ensure default is applied if it exists
                const inputValue = e.target.value.trim();
                if (inputValue === '' && property.default !== undefined) {
                  handleFieldChange(fieldName, property.default, property);
                }
              }}
              min={property.minimum}
              max={property.maximum}
              placeholder={property.default !== undefined ? String(property.default) : ''}
            />
            {description && <p className="text-xs text-slate-500">{description}</p>}
          </div>
        );

      case 'boolean':
        return (
          <div key={fieldName} className="flex items-center justify-between space-x-2">
            <div className="flex-1">
              <Label htmlFor={fieldName}>
                {label} {isRequired && '*'}
              </Label>
              {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
            </div>
            <Switch
              id={fieldName}
              checked={(fieldValue as boolean) || false}
              onCheckedChange={(checked) => handleFieldChange(fieldName, checked, property)}
            />
          </div>
        );

      case 'object':
        // Object type - render as JSON textarea
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName}>
              {label} {isRequired && '*'}
            </Label>
            <Textarea
              id={fieldName}
              value={
                fieldValue
                  ? JSON.stringify(fieldValue, null, 2)
                  : ''
              }
              onChange={(e) => {
                const text = e.target.value.trim();
                if (!text) {
                  handleFieldChange(fieldName, {}, property);
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next[fieldName];
                    return next;
                  });
                  return;
                }
                try {
                  const parsed = JSON.parse(text);
                  if (typeof parsed !== 'object' || Array.isArray(parsed)) {
                    throw new Error('Must be a JSON object');
                  }
                  handleFieldChange(fieldName, parsed, property);
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next[fieldName];
                    return next;
                  });
                } catch (err) {
                  setFieldErrors((prev) => ({
                    ...prev,
                    [fieldName]: err instanceof Error ? err.message : 'Invalid JSON',
                  }));
                }
              }}
              placeholder="{}"
              rows={4}
              className={`font-mono text-xs ${
                fieldErrors[fieldName] ? 'border-red-500' : ''
              }`}
            />
            {fieldErrors[fieldName] && (
              <p className="text-xs text-red-600">{fieldErrors[fieldName]}</p>
            )}
            {description && <p className="text-xs text-slate-500">{description}</p>}
            {!fieldErrors[fieldName] && (
              <p className="text-xs text-slate-400">Enter as JSON object</p>
            )}
          </div>
        );

      default:
        // Fallback to text input
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName}>
              {label} {isRequired && '*'}
            </Label>
            <Input
              id={fieldName}
              value={String(fieldValue || '')}
              onChange={(e) => handleFieldChange(fieldName, e.target.value, property)}
            />
            {description && <p className="text-xs text-slate-500">{description}</p>}
          </div>
        );
    }
  };

  if (!schema || !parsedSchema) {
    return (
      <div className="text-sm text-slate-500 p-4 bg-slate-50 rounded border">
        No type-specific settings required for this message type.
      </div>
    );
  }

  // If schema is complex or user prefers JSON mode
  if (jsonMode || !parsedSchema.properties) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Type Settings (JSON)</Label>
          {parsedSchema.properties && (
            <button
              type="button"
              onClick={() => {
                // Sync JSON text to value before switching back to form view
                if (jsonText && !jsonError) {
                  try {
                    const parsed = JSON.parse(jsonText);
                    onChange(parsed);
                  } catch {
                    // Invalid JSON - keep current value
                  }
                }
                setJsonMode(false);
              }}
              className="text-xs text-indigo-600 hover:underline"
            >
              Switch to form view
            </button>
          )}
        </div>
        <Textarea
          value={jsonText}
          onChange={(e) => handleJsonChange(e.target.value)}
          rows={8}
          className="font-mono text-xs"
          placeholder="{}"
        />
        {jsonError && <p className="text-sm text-red-600">{jsonError}</p>}
        <p className="text-xs text-slate-500">
          Enter type-specific settings as JSON object
        </p>
      </div>
    );
  }

  // Form view with fields from schema
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Type Settings</Label>
        <button
          type="button"
          onClick={() => {
            // Ensure jsonText is synced with current value before switching
            setJsonText(JSON.stringify(value, null, 2));
            setJsonMode(true);
          }}
          className="text-xs text-indigo-600 hover:underline"
        >
          Switch to JSON view
        </button>
      </div>

      <div className="space-y-4">
        {(() => {
          // Sort fields: required first, then fields with defaults, then others
          // Maintain insertion order within each group
          const fields = Object.entries(parsedSchema.properties);

          // Calculate priority for each field (lower number = higher priority)
          const fieldsWithPriority = fields.map(([fieldName, property], index) => {
            const isRequired = parsedSchema.required?.includes(fieldName) || false;
            const hasDefault = property.default !== undefined;

            let priority = 2; // Default: other fields
            if (isRequired) {
              priority = 0; // Required fields first
            } else if (hasDefault) {
              priority = 1; // Fields with defaults second
            }

            return {
              fieldName,
              property,
              priority,
              originalIndex: index, // Preserve original order within same priority
            };
          });

          // Sort by priority, then by original index
          const sortedFields = fieldsWithPriority.sort((a, b) => {
            if (a.priority !== b.priority) {
              return a.priority - b.priority;
            }
            return a.originalIndex - b.originalIndex;
          });

          return sortedFields.map(({ fieldName, property }) => {
            const isRequired = parsedSchema.required?.includes(fieldName) || false;
            return renderField(fieldName, property, isRequired);
          });
        })()}
      </div>

      {Object.keys(parsedSchema.properties).length === 0 && (
        <p className="text-sm text-slate-500 p-4 bg-slate-50 rounded border">
          No configurable settings for this type.
        </p>
      )}
    </div>
  );
}
