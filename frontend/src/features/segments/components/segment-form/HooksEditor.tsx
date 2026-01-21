import { useState, useEffect, useMemo } from 'react';
import Ajv from 'ajv';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface HooksEditorProps {
  defaultHooks?: string;
  hooksSchema?: string;
  value?: string;
  onChange: (hooks: string | undefined) => void;
  onValidationChange?: (isValid: boolean, error?: string) => void;
}

export function HooksEditor({
  defaultHooks,
  hooksSchema,
  value,
  onChange,
  onValidationChange,
}: HooksEditorProps) {
  // Memoize initial value to avoid unnecessary updates
  const initialValue = useMemo(() => value || '', [value]);

  const [hooksJson, setHooksJson] = useState(initialValue);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(true);

  // Sync external value changes to internal state
  useEffect(() => {
    setHooksJson(initialValue);
  }, [initialValue]);

  const validateHooks = (jsonString: string) => {
    if (!jsonString.trim()) {
      setValidationError(null);
      setIsValid(true);
      onValidationChange?.(true);
      onChange(undefined);
      return;
    }

    if (!hooksSchema) {
      // No schema defined, just validate JSON syntax
      try {
        JSON.parse(jsonString);
        setValidationError(null);
        setIsValid(true);
        onValidationChange?.(true);
        onChange(jsonString);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Invalid JSON';
        setValidationError(`Invalid JSON: ${errorMessage}`);
        setIsValid(false);
        onValidationChange?.(false, errorMessage);
        onChange(jsonString); // Still allow editing
      }
      return;
    }

    // Validate against schema
    try {
      const hooksObj = JSON.parse(jsonString);
      const schemaObj = JSON.parse(hooksSchema);
      const ajv = new Ajv();
      const validate = ajv.compile(schemaObj);
      const valid = validate(hooksObj);

      if (!valid) {
        const errorMessage = ajv.errorsText(validate.errors);
        setValidationError(errorMessage);
        setIsValid(false);
        onValidationChange?.(false, errorMessage);
      } else {
        setValidationError(null);
        setIsValid(true);
        onValidationChange?.(true);
      }
      onChange(jsonString);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (error instanceof Error && error.message.includes('JSON')) {
        setValidationError(`Invalid JSON: ${errorMessage}`);
      } else {
        setValidationError(`Schema validation error: ${errorMessage}`);
      }
      setIsValid(false);
      onValidationChange?.(false, errorMessage);
      onChange(jsonString); // Still allow editing
    }
  };

  const handleChange = (newValue: string) => {
    setHooksJson(newValue);
    validateHooks(newValue);
  };

  const handleBlur = () => {
    validateHooks(hooksJson);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="hooks-editor" className="text-sm font-medium">
          Hooks (Instance-level overrides)
        </Label>
        {isValid && hooksJson && (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        )}
      </div>
      {defaultHooks && (
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          <div className="font-medium mb-1">Default hooks (from dictionary):</div>
          <pre className="text-xs overflow-x-auto">{defaultHooks}</pre>
        </div>
      )}
      <Textarea
        id="hooks-editor"
        value={hooksJson}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        placeholder={
          defaultHooks
            ? 'Override default hooks (leave empty to use defaults)'
            : '{"onEnter": "hook:onEnter:name", "validate": "hook:validate:name", ...}'
        }
        rows={6}
        className={`font-mono text-xs ${
          validationError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
        }`}
      />
      {validationError && (
        <div className="flex items-start gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-medium">Validation Error</div>
            <div className="text-xs">{validationError}</div>
          </div>
        </div>
      )}
      {hooksSchema && !validationError && hooksJson && (
        <div className="text-xs text-gray-500">
          Hooks validated against schema successfully.
        </div>
      )}
    </div>
  );
}
