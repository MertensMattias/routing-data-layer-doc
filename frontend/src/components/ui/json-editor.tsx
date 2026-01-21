import { useState, useEffect } from 'react';
import { Textarea } from './textarea';
import { Button } from './button';
import { cn } from './utils';
import { Code2, FileText } from 'lucide-react';

interface JsonEditorComponentProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export function JsonEditorComponent({
  value,
  onChange,
  placeholder = '{}',
  className,
  id,
}: JsonEditorComponentProps) {
  const [error, setError] = useState<string | null>(null);
  const [isJsonView, setIsJsonView] = useState(false);
  const [formattedJson, setFormattedJson] = useState<string>('');

  // Parse and format JSON when switching to JSON view
  useEffect(() => {
    if (isJsonView) {
      try {
        const trimmed = value.trim();
        if (!trimmed || trimmed === '{}' || trimmed === '}') {
          setFormattedJson('{}');
          setError(null);
          return;
        }

        const parsed = JSON.parse(value);
        if (typeof parsed !== 'object' || Array.isArray(parsed)) {
          setError('Must be a JSON object');
          setFormattedJson(value);
          return;
        }

        setFormattedJson(JSON.stringify(parsed, null, 2));
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invalid JSON');
        setFormattedJson(value);
      }
    }
  }, [value, isJsonView]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let newValue = e.target.value;
    // If user deletes everything, ensure we have at least {}
    if (!newValue.trim()) {
      newValue = '{}';
    }
    onChange(newValue);
    setError(null);
  };

  const toggleJsonView = () => {
    if (!isJsonView) {
      // Switching to JSON view - validate and format
      try {
        const trimmed = value.trim();
        if (!trimmed || trimmed === '{}' || trimmed === '}') {
          setFormattedJson('{}');
          setError(null);
          setIsJsonView(true);
          return;
        }

        const parsed = JSON.parse(value);
        if (typeof parsed !== 'object' || Array.isArray(parsed)) {
          setError('Must be a JSON object');
          setFormattedJson(value);
          setIsJsonView(true);
          return;
        }

        const formatted = JSON.stringify(parsed, null, 2);
        setFormattedJson(formatted);
        setError(null);
        setIsJsonView(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invalid JSON');
        setFormattedJson(value);
        setIsJsonView(true);
      }
    } else {
      // Switching back to text view - update value with formatted JSON if valid
      if (!error && formattedJson) {
        onChange(formattedJson);
      }
      setIsJsonView(false);
    }
  };

  // Ensure value always has proper structure when empty
  const displayValue = (() => {
    const trimmed = value.trim();
    if (!trimmed || trimmed === '}') {
      return '{}';
    }
    return value;
  })();

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleJsonView}
          className="h-7 text-xs"
        >
          {isJsonView ? (
            <>
              <FileText className="w-3 h-3 mr-1" />
              Switch to text view
            </>
          ) : (
            <>
              <Code2 className="w-3 h-3 mr-1" />
              Switch to JSON view
            </>
          )}
        </Button>
      </div>

      <div
        className={cn(
          'min-h-[100px] rounded-md border bg-input-background',
          error ? 'border-destructive' : 'border-input'
        )}
      >
        {error ? (
          <div className="p-3 text-sm text-destructive">
            <p className="font-medium">Invalid JSON</p>
            <p className="text-xs mt-1">{error}</p>
            <Textarea
              id={id}
              value={value}
              onChange={handleTextareaChange}
              placeholder={placeholder}
              className="mt-2 font-mono text-xs"
              rows={4}
            />
          </div>
        ) : isJsonView ? (
          <div className="p-3">
            <pre className="font-mono text-sm whitespace-pre-wrap break-words text-foreground">
              {formattedJson}
            </pre>
          </div>
        ) : (
          <div className="p-0">
            <Textarea
              id={id}
              value={displayValue}
              onChange={handleTextareaChange}
              placeholder={placeholder}
              className="font-mono text-sm border-0 bg-transparent resize-none focus-visible:ring-0"
              rows={4}
            />
          </div>
        )}
      </div>
    </div>
  );
}
