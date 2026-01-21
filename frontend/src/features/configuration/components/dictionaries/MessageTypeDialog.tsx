import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { MessageType, CreateMessageTypeDto, UpdateMessageTypeDto } from '@/api/types';
import { createMessageType, updateMessageType } from '@/services/configuration';
import { getApiErrorMessage } from '@/api/client';

// Validation schema
const messageTypeSchema = z.object({
  code: z
    .string()
    .min(1, 'Code is required')
    .max(20, 'Max 20 characters')
    .regex(/^[a-z][a-z0-9_]*$/, {
      message: 'Code must start with a lowercase letter and contain only lowercase letters, numbers, and underscores',
    }),
  displayName: z.string().min(1, 'Display name is required').max(64, 'Max 64 characters'),
  description: z.string().max(256, 'Max 256 characters').optional(),
  settingsSchema: z.string().optional(),
  defaultSettings: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

type MessageTypeFormData = z.infer<typeof messageTypeSchema>;

interface MessageTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageType: MessageType | null;
  onSuccess: () => void;
}

export function MessageTypeDialog({ open, onOpenChange, messageType, onSuccess }: MessageTypeDialogProps) {
  const isEditMode = messageType !== null;
  const [jsonError, setJsonError] = useState<{ field: string; message: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<MessageTypeFormData>({
    resolver: zodResolver(messageTypeSchema),
    defaultValues: {
      code: '',
      displayName: '',
      description: '',
      settingsSchema: '',
      defaultSettings: '',
      sortOrder: undefined,
      isActive: true,
    },
  });

  const isActive = watch('isActive');

  // Reset form when dialog opens/closes or type changes
  useEffect(() => {
    if (open && messageType) {
      reset({
        code: messageType.code,
        displayName: messageType.displayName,
        description: messageType.description || '',
        settingsSchema: messageType.settingsSchema || '',
        defaultSettings: messageType.defaultSettings || '',
        sortOrder: messageType.sortOrder,
        isActive: messageType.isActive,
      });
    } else if (open && !messageType) {
      reset({
        code: '',
        displayName: '',
        description: '',
        settingsSchema: '',
        defaultSettings: '',
        sortOrder: undefined,
        isActive: true,
      });
    }
    setJsonError(null);
  }, [open, messageType, reset]);

  // Validate JSON fields
  const validateJSON = (field: 'settingsSchema' | 'defaultSettings', value: string): boolean => {
    if (!value.trim()) return true; // Empty is valid

    try {
      JSON.parse(value);
      if (jsonError?.field === field) {
        setJsonError(null);
      }
      return true;
    } catch {
      setJsonError({ field, message: 'Invalid JSON format' });
      return false;
    }
  };

  // Generate JSON schema from default settings object
  const generateSchemaFromDefaults = (silent = false) => {
    const defaultSettingsValue = watch('defaultSettings');

    if (!defaultSettingsValue || !defaultSettingsValue.trim()) {
      if (!silent) {
        toast.error('Please enter default settings JSON first');
      }
      return;
    }

    try {
      const defaults = JSON.parse(defaultSettingsValue);

      if (typeof defaults !== 'object' || Array.isArray(defaults) || defaults === null) {
        toast.error('Default settings must be a JSON object');
        return;
      }

      // Generate schema properties from the defaults object
      const properties: Record<string, { type: string; default?: unknown }> = {};
      const required: string[] = [];

      const inferType = (value: unknown): { type: string; default?: unknown } => {
        if (value === null) {
          return { type: 'string' }; // Default to string for null
        }
        if (typeof value === 'string') {
          return { type: 'string', default: value };
        }
        if (typeof value === 'number') {
          return {
            type: Number.isInteger(value) ? 'integer' : 'number',
            default: value
          };
        }
        if (typeof value === 'boolean') {
          return { type: 'boolean', default: value };
        }
        if (Array.isArray(value)) {
          return { type: 'array' };
        }
        if (typeof value === 'object') {
          return { type: 'object' };
        }
        return { type: 'string' };
      };

      // Process each property in the defaults object
      Object.entries(defaults).forEach(([key, value]) => {
        const typeInfo = inferType(value);
        properties[key] = {
          type: typeInfo.type,
          ...(typeInfo.default !== undefined && { default: typeInfo.default }),
        };

        // Add to required if value is not null/undefined/empty string
        if (value !== null && value !== undefined && value !== '') {
          required.push(key);
        }
      });

      // Build the complete schema
      const schema = {
        type: 'object',
        properties,
        ...(required.length > 0 && { required }),
      };

      // Set the generated schema
      setValue('settingsSchema', JSON.stringify(schema, null, 2));
      toast.success('Schema generated from default settings');

      // Clear any errors
      if (jsonError?.field === 'settingsSchema') {
        setJsonError(null);
      }
    } catch {
      toast.error('Invalid JSON in default settings. Please fix the JSON format first.');
      setJsonError({ field: 'defaultSettings', message: 'Invalid JSON format' });
    }
  };

  const onSubmit = async (data: MessageTypeFormData) => {
    // Validate JSON fields before submission
    let hasError = false;
    if (data.settingsSchema && !validateJSON('settingsSchema', data.settingsSchema)) {
      hasError = true;
    }
    if (data.defaultSettings && !validateJSON('defaultSettings', data.defaultSettings)) {
      hasError = true;
    }

    if (hasError) {
      toast.error('Please fix JSON validation errors');
      return;
    }

    try {
      if (isEditMode) {
        const updateDto: UpdateMessageTypeDto = {
          displayName: data.displayName,
          description: data.description || undefined,
          settingsSchema: data.settingsSchema || undefined,
          defaultSettings: data.defaultSettings || undefined,
          sortOrder: data.sortOrder,
          isActive: data.isActive,
        };
        await updateMessageType(messageType.code, updateDto);
        toast.success('Message type updated successfully');
      } else {
        const createDto: CreateMessageTypeDto = {
          code: data.code,
          displayName: data.displayName,
          description: data.description || undefined,
          settingsSchema: data.settingsSchema || undefined,
          defaultSettings: data.defaultSettings || undefined,
          sortOrder: data.sortOrder,
          isActive: data.isActive,
        };
        await createMessageType(createDto);
        toast.success('Message type created successfully');
      }
      onSuccess();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err) || 'An error occurred');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Message Type' : 'Add New Message Type'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update message type details. Type code cannot be changed.'
              : 'Add a new message type with optional settings schema and defaults.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Code */}
          <div className="space-y-2">
            <Label htmlFor="code">
              Code <span className="text-destructive">*</span>
            </Label>
            <Input
              id="code"
              placeholder="sms_notification"
              {...register('code')}
              disabled={isEditMode}
              className={errors.code ? 'border-destructive' : ''}
            />
            {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
            {!isEditMode && (
              <p className="text-xs text-muted-foreground">
                Lowercase letters, numbers, and underscores only (e.g., tts, sms_notification)
              </p>
            )}
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">
              Display Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="displayName"
              placeholder="SMS Notification"
              {...register('displayName')}
              className={errors.displayName ? 'border-destructive' : ''}
            />
            {errors.displayName && (
              <p className="text-sm text-destructive">{errors.displayName.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Message type for SMS notifications"
              rows={2}
              {...register('description')}
              className={errors.description ? 'border-destructive' : ''}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Settings Schema */}
          <div className="space-y-2">
            <Label htmlFor="settingsSchema">Settings Schema (Optional JSON)</Label>
            <Textarea
              id="settingsSchema"
              placeholder={'{\n  "maxLength": 160,\n  "encoding": "UTF-8"\n}'}
              rows={6}
              {...register('settingsSchema')}
              onBlur={(e) => {
                if (e.target.value.trim()) {
                  validateJSON('settingsSchema', e.target.value);
                }
              }}
              className={`font-mono text-sm ${
                jsonError?.field === 'settingsSchema' ? 'border-destructive' : ''
              }`}
            />
            {jsonError?.field === 'settingsSchema' && (
              <p className="text-sm text-destructive">{jsonError.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              JSON schema defining configurable settings for this message type
            </p>
          </div>

          {/* Default Settings */}
          <div className="space-y-2">
            <Label htmlFor="defaultSettings">Default Settings (Optional JSON)</Label>
            <Textarea
              id="defaultSettings"
              placeholder={'{\n  "maxLength": 160,\n  "encoding": "UTF-8"\n}'}
              rows={6}
              {...register('defaultSettings')}
              onBlur={(e) => {
                const value = e.target.value.trim();
                if (value) {
                  // Validate JSON first
                  if (validateJSON('defaultSettings', value)) {
                    // Auto-generate schema from valid JSON (silent mode - no error toast if empty)
                    generateSchemaFromDefaults(true);
                  }
                }
              }}
              className={`font-mono text-sm ${
                jsonError?.field === 'defaultSettings' ? 'border-destructive' : ''
              }`}
            />
            {jsonError?.field === 'defaultSettings' && (
              <p className="text-sm text-destructive">{jsonError.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              JSON object with default values for settings. Schema will be auto-generated when you click
              outside this field.
            </p>
          </div>

          {/* Sort Order */}
          <div className="space-y-2">
            <Label htmlFor="sortOrder">Sort Order (Optional)</Label>
            <Input
              id="sortOrder"
              type="number"
              placeholder="10"
              {...register('sortOrder', { valueAsNumber: true })}
              className={errors.sortOrder ? 'border-destructive' : ''}
            />
            {errors.sortOrder && <p className="text-sm text-destructive">{errors.sortOrder.message}</p>}
            <p className="text-xs text-muted-foreground">
              Lower numbers appear first. Leave empty to auto-assign.
            </p>
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between space-x-2 rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="isActive" className="text-base">
                Active
              </Label>
              <p className="text-sm text-muted-foreground">
                Inactive types are hidden from dropdowns
              </p>
            </div>
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setValue('isActive', checked)}
            />
          </div>

          {isEditMode && !isActive && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Deactivating this message type will hide it from all dropdowns. Existing references will
                remain intact.
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

