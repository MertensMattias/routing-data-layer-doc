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
import type { MessageCategory, CreateMessageCategoryDto, UpdateMessageCategoryDto } from '@/api/types';
import { createMessageCategory, updateMessageCategory } from '@/services/configuration';
import { getApiErrorMessage } from '@/api/client';

// Validation schema
const categorySchema = z.object({
  code: z
    .string()
    .min(1, 'Code is required')
    .max(32, 'Max 32 characters')
    .regex(/^[a-z][a-z0-9_]*$/, {
      message: 'Code must start with a lowercase letter and contain only lowercase letters, numbers, and underscores',
    }),
  displayName: z.string().min(1, 'Display name is required').max(64, 'Max 64 characters'),
  description: z.string().max(256, 'Max 256 characters').optional(),
  icon: z.string().max(32, 'Max 32 characters').optional(),
  color: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^#[0-9A-Fa-f]{6}$/.test(val),
      'Must be a valid hex color (#RRGGBB)'
    ),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface MessageCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: MessageCategory | null;
  onSuccess: () => void;
}

// Predefined color palette
const COLOR_PALETTE = [
  '#FF5733', '#33FF57', '#3357FF', '#FF33F6', '#F6FF33',
  '#33FFF6', '#F633FF', '#FF8C33', '#8C33FF', '#33FF8C',
  '#FF3333', '#33FF33', '#3333FF', '#FFFF33', '#FF33FF',
  '#33FFFF', '#808080', '#000000',
];

// Extended emoji icon catalog (deduplicated)
const ICON_EMOJIS = Array.from(
  new Set([
    // Communication
    '👋', '📞', '✉️', '💬', '📢', '📣', '📯', '📮',
    // Voice & TTS
    '🎤', '🎙️', '🔊', '🔉', '🔈', '🗣️', '👄', '👂',
    // Phone & IVR
    '📱', '☎️', '📲', '📟', '📠',
    // Services & Support
    '🛎️', '🏢', '🏛️', '🏪', '🏬', '🏭', '🏗️', '🏥',
    // Disconnect & End
    '📴', '⛔', '🚫', '🛑', '⏹️', '⏸️', '🔚',
    // Status & Actions
    '✅', '❌', '⚠️', '🔔', '🔕', '📋', '📝', '📄',
    // Objects & Tools
    '🎯', '⭐', '🔥', '💡', '📌', '🏷️', '📊', '📈',
    // Categories & Types
    '📁', '📂', '🗂️', '📑', '🔖', '📎', '📍',
    // Symbols & Shapes
    '⚡', '✨', '🌟', '💫', '🔆', '🔅', '💠',
    // Business & Work
    '💼', '📉', '📃',
    // Alerts & Notifications
    '🚨', '💭', '🗨️',
    // Routing & Navigation
    '🧭', '🗺️', '🔀', '↩️', '↪️', '🔄', '🔁', '↔️', '⇄',
    // Menu & Options
    '🍔', '☰',
    // Disconnect & End Call (additional)
    '🔌', '📵',
    // Callback & Return (additional)
    '↻', '🔙',
    // Identification & Security
    '🔒', '🪪', '👤', '🆔', '🔐', '🛡️',
    // AI & Intelligence
    '🤖', '🧠', '🔮', '🎓',
    // Questions & Prompts
    '❓', '❔',
    // Time & Scheduling
    '📅', '📆', '⏰', '⏱️', '🕐', '🕒', '⏲️',
    // Information & Documentation
    'ℹ️', '📖', '📚', '📰',
    // Transaction & Commerce
    '🧾', '💳', '🛒', '💰', '💵', '💸',
    // Miscellaneous
    '🎨', '🎭', '🎪', '🎬', '🎧', '🎵', '🎶',
  ])
);

export function MessageCategoryDialog({ open, onOpenChange, category, onSuccess }: MessageCategoryDialogProps) {
  const isEditMode = category !== null;
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedIcon, setSelectedIcon] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      code: '',
      displayName: '',
      description: '',
      icon: '',
      color: '',
      sortOrder: undefined,
      isActive: true,
    },
  });

  const isActive = watch('isActive');
  const colorValue = watch('color');
  const iconValue = watch('icon');

  // Reset form when dialog opens/closes or category changes
  useEffect(() => {
    if (!open) return; // Only reset when opening

    if (category) {
      reset({
        code: category.code,
        displayName: category.displayName,
        description: category.description || '',
        icon: category.icon || '',
        color: category.color || '',
        sortOrder: category.sortOrder,
        isActive: category.isActive,
      });
      setSelectedColor(category.color || '');
      setSelectedIcon(category.icon || '');
    } else {
      reset({
        code: '',
        displayName: '',
        description: '',
        icon: '',
        color: '',
        sortOrder: undefined,
        isActive: true,
      });
      setSelectedColor('');
      setSelectedIcon('');
    }
  }, [open, category, reset]);

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setValue('color', color);
  };

  const handleIconSelect = (icon: string) => {
    setSelectedIcon(icon);
    setValue('icon', icon);
  };

  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (isEditMode) {
        const updateDto: UpdateMessageCategoryDto = {
          displayName: data.displayName,
          description: data.description || undefined,
          icon: data.icon || undefined,
          color: data.color || undefined,
          sortOrder: data.sortOrder,
          isActive: data.isActive,
        };
        await updateMessageCategory(category.code, updateDto);
        toast.success('Category updated successfully');
      } else {
        const createDto: CreateMessageCategoryDto = {
          code: data.code,
          displayName: data.displayName,
          description: data.description || undefined,
          icon: data.icon || undefined,
          color: data.color || undefined,
          sortOrder: data.sortOrder,
          isActive: data.isActive,
        };
        await createMessageCategory(createDto);
        toast.success('Category created successfully');
      }
      onSuccess();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err) || 'An error occurred');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Category' : 'Add New Category'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update category details. Category code cannot be changed.'
              : 'Add a new message category to organize messages in the message store.'}
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
              placeholder="welcome_message"
              {...register('code')}
              disabled={isEditMode}
              className={errors.code ? 'border-destructive' : ''}
            />
            {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
            {!isEditMode && (
              <p className="text-xs text-muted-foreground">
                Lowercase letters, numbers, and underscores only (e.g., greeting, welcome_message)
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
              placeholder="Welcome Messages"
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
              placeholder="Messages for greeting callers at the start of the call"
              rows={3}
              {...register('description')}
              className={errors.description ? 'border-destructive' : ''}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Icon Picker */}
          <div className="space-y-2">
            <Label htmlFor="icon">Icon (Optional)</Label>
            <div className="max-h-64 overflow-y-auto rounded-md border p-2">
              <div className="grid grid-cols-8 gap-2">
                {ICON_EMOJIS.map((emoji, index) => (
                  <button
                    key={`icon-${index}`}
                    type="button"
                    onClick={() => handleIconSelect(emoji)}
                    className={`h-10 w-10 flex items-center justify-center text-2xl border rounded transition-colors ${
                      selectedIcon === emoji
                        ? 'border-primary bg-primary/10 ring-2 ring-primary ring-offset-1'
                        : 'border-border hover:border-primary/50'
                    }`}
                    title={emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <Input
              id="icon"
              placeholder="Or enter custom emoji/icon"
              {...register('icon')}
              value={iconValue}
              onChange={(e) => {
                setValue('icon', e.target.value);
                setSelectedIcon(e.target.value);
              }}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground">
              Select an icon from the grid above or enter a custom emoji/icon in the field below
            </p>
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <Label htmlFor="color">Color (Optional)</Label>
            <div className="grid grid-cols-9 gap-2">
              {COLOR_PALETTE.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleColorSelect(color)}
                  className={`h-10 w-10 rounded border-2 transition-all ${
                    selectedColor === color ? 'border-primary scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            <Input
              id="color"
              placeholder="#FF5733"
              {...register('color')}
              value={colorValue}
              onChange={(e) => {
                setValue('color', e.target.value);
                setSelectedColor(e.target.value);
              }}
              className="mt-2"
            />
            {errors.color && <p className="text-sm text-destructive">{errors.color.message}</p>}
            {selectedColor && (
              <div className="flex items-center gap-2 mt-2">
                <div
                  className="w-8 h-8 rounded border"
                  style={{ backgroundColor: selectedColor }}
                />
                <span className="text-sm text-muted-foreground">Preview</span>
              </div>
            )}
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
                Inactive categories are hidden from dropdowns
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
                Deactivating this category will hide it from all dropdowns. Existing references will
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

