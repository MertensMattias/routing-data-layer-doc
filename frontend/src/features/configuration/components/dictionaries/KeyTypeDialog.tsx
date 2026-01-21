import { useState, useEffect } from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { KeyType, CreateKeyTypeDto, UpdateKeyTypeDto } from '@/api/types';
import { createKeyType, updateKeyType } from '@/services/configuration';
import { getApiErrorMessage } from '@/api/client';

const keyTypeSchema = z.object({
  typeName: z
    .string()
    .min(1, 'Type name is required')
    .max(20, 'Type name must be at most 20 characters')
    .regex(
      /^[a-z][a-z0-9_]*$/,
      'Type name must be lowercase alphanumeric with underscores, starting with a letter'
    ),
  displayName: z.string().min(1, 'Display name is required').max(50, 'Display name too long'),
  description: z.string().max(200, 'Description too long').optional(),
});

type FormData = z.infer<typeof keyTypeSchema>;

interface KeyTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyType?: KeyType | null;
  onSuccess: () => void;
}

export function KeyTypeDialog({ open, onOpenChange, keyType, onSuccess }: KeyTypeDialogProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!keyType;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(keyTypeSchema),
    defaultValues: {
      typeName: '',
      displayName: '',
      description: '',
    },
  });

  useEffect(() => {
    if (open && keyType) {
      // Editing mode - populate form
      setValue('typeName', keyType.typeName);
      setValue('displayName', keyType.displayName || '');
      setValue('description', keyType.description || '');
    } else if (open && !keyType) {
      // Creating mode - reset form
      reset();
    }
  }, [open, keyType, setValue, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);

      if (isEditing) {
        // Update existing key type
        const updateData: UpdateKeyTypeDto = {
          displayName: data.displayName,
          description: data.description || undefined,
        };
        await updateKeyType(keyType.typeName, updateData);
        toast.success('Key type updated successfully');
      } else {
        // Create new key type
        const createData: CreateKeyTypeDto = {
          typeName: data.typeName,
          displayName: data.displayName,
          description: data.description || undefined,
        };
        await createKeyType(createData);
        toast.success('Key type created successfully');
      }

      onSuccess();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err) || 'Failed to save key type');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Key Type' : 'Create Key Type'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the display name and description of this key type.'
              : 'Add a new key type that can be used for segment configuration keys.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Type Name */}
          <div className="space-y-2">
            <Label htmlFor="typeName">
              Type Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="typeName"
              {...register('typeName')}
              placeholder="e.g., string, number, boolean"
              disabled={isEditing || loading}
              className={errors.typeName ? 'border-destructive' : ''}
            />
            {errors.typeName && (
              <p className="text-sm text-destructive">{errors.typeName.message}</p>
            )}
            {!isEditing && (
              <p className="text-sm text-muted-foreground">
                Must be lowercase_snake_case. Cannot be changed after creation.
              </p>
            )}
            {isEditing && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Type name cannot be changed after creation to maintain data integrity.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">
              Display Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="displayName"
              {...register('displayName')}
              placeholder="e.g., String, Number, Boolean"
              disabled={loading}
              className={errors.displayName ? 'border-destructive' : ''}
            />
            {errors.displayName && (
              <p className="text-sm text-destructive">{errors.displayName.message}</p>
            )}
            <p className="text-sm text-muted-foreground">Human-readable name shown in the UI</p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Brief description of this data type"
              rows={3}
              disabled={loading}
              className={errors.description ? 'border-destructive' : ''}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Optional description to help users understand this data type
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

