import { useEffect } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Language, CreateLanguageDto, UpdateLanguageDto } from '@/api/types';
import { createLanguage, updateLanguage } from '@/services/configuration';
import { getApiErrorMessage } from '@/api/client';

// Validation schema  
const languageSchema = z.object({
  languageCode: z
    .string()
    .min(1, 'Language code is required')
    .regex(/^[a-z]{2}-[A-Z]{2}$/, 'Must be in BCP47 format (e.g., nl-BE, fr-FR, en-US)'),
  displayName: z.string().min(1, 'Display name is required').max(128, 'Max 128 characters'),
  nativeName: z.string().max(128, 'Max 128 characters').optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

type LanguageFormData = z.infer<typeof languageSchema>;

interface LanguageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language: Language | null; // null = create mode, Language = edit mode
  onSuccess: () => void;
}

export function LanguageDialog({ open, onOpenChange, language, onSuccess }: LanguageDialogProps) {
  const isEditMode = language !== null;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<LanguageFormData>({
    resolver: zodResolver(languageSchema),
    defaultValues: {
      languageCode: '',
      displayName: '',
      nativeName: '',
      sortOrder: undefined,
      isActive: true,
    },
  });

  const isActive = watch('isActive');

  // Reset form when dialog opens/closes or language changes
  useEffect(() => {
    if (open && language) {
      // Edit mode - populate form
      reset({
        languageCode: language.languageCode,
        displayName: language.displayName,
        nativeName: language.nativeName || '',
        sortOrder: language.sortOrder,
        isActive: language.isActive,
      });
    } else if (open && !language) {
      // Create mode - reset to defaults
      reset({
        languageCode: '',
        displayName: '',
        nativeName: '',
        sortOrder: undefined,
        isActive: true,
      });
    }
  }, [open, language, reset]);

  const onSubmit = async (data: LanguageFormData) => {
    try {
      if (isEditMode) {
        // Update existing language
        const updateDto: UpdateLanguageDto = {
          displayName: data.displayName,
          nativeName: data.nativeName || undefined,
          sortOrder: data.sortOrder,
          isActive: data.isActive,
        };
        await updateLanguage(language.languageCode, updateDto);
        toast.success('Language updated successfully');
      } else {
        // Create new language
        const createDto: CreateLanguageDto = {
          languageCode: data.languageCode,
          displayName: data.displayName,
          nativeName: data.nativeName || undefined,
          sortOrder: data.sortOrder,
          isActive: data.isActive,
        };
        await createLanguage(createDto);
        toast.success('Language created successfully');
      }
      onSuccess();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err) || 'An error occurred');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Language' : 'Add New Language'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update language details. Language code cannot be changed.'
              : 'Add a new language to the system. Use BCP47 format for the language code.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Language Code */}
          <div className="space-y-2">
            <Label htmlFor="languageCode">
              Language Code <span className="text-destructive">*</span>
            </Label>
            <Input
              id="languageCode"
              placeholder="nl-BE"
              {...register('languageCode')}
              disabled={isEditMode}
              className={errors.languageCode ? 'border-destructive' : ''}
            />
            {errors.languageCode && (
              <p className="text-sm text-destructive">{errors.languageCode.message}</p>
            )}
            {!isEditMode && (
              <p className="text-xs text-muted-foreground">
                Format: lowercase language code - UPPERCASE country code (e.g., nl-BE, fr-FR, en-US)
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
              placeholder="Dutch (Belgium)"
              {...register('displayName')}
              className={errors.displayName ? 'border-destructive' : ''}
            />
            {errors.displayName && (
              <p className="text-sm text-destructive">{errors.displayName.message}</p>
            )}
            <p className="text-xs text-muted-foreground">User-friendly name for the language</p>
          </div>

          {/* Native Name */}
          <div className="space-y-2">
            <Label htmlFor="nativeName">Native Name (Optional)</Label>
            <Input
              id="nativeName"
              placeholder="Nederlands"
              {...register('nativeName')}
              className={errors.nativeName ? 'border-destructive' : ''}
            />
            {errors.nativeName && (
              <p className="text-sm text-destructive">{errors.nativeName.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Language name in its native script (e.g., Nederlands for nl-BE)
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
            {errors.sortOrder && (
              <p className="text-sm text-destructive">{errors.sortOrder.message}</p>
            )}
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
                Inactive languages are hidden from dropdowns
              </p>
            </div>
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setValue('isActive', checked)}
            />
          </div>

          {/* Warning for edit mode */}
          {isEditMode && !isActive && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Deactivating this language will hide it from all dropdowns. Existing references will
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

