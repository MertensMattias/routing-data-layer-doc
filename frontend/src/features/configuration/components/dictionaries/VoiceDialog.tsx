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
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Voice, CreateVoiceDto, UpdateVoiceDto, Language, VoiceEngine, VoiceGender } from '@/api/types';
import { createVoice, updateVoice, listLanguages } from '@/services/configuration';
import { getApiErrorMessage } from '@/api/client';

// Validation schema
const voiceSchema = z.object({
  code: z.string().min(1, 'Voice code is required').max(64, 'Max 64 characters'),
  engine: z.enum(['google', 'azure', 'amazon', 'elevenlabs'], {
    message: 'Please select an engine',
  }),
  language: z.string().min(1, 'Language is required'),
  displayName: z.string().min(1, 'Display name is required').max(128, 'Max 128 characters'),
  gender: z.enum(['female', 'male', 'neutral']).optional(),
  style: z.string().max(32, 'Max 32 characters').optional(),
  sampleUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

type VoiceFormData = z.infer<typeof voiceSchema>;

interface VoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  voice: Voice | null;
  onSuccess: () => void;
}

export function VoiceDialog({ open, onOpenChange, voice, onSuccess }: VoiceDialogProps) {
  const isEditMode = voice !== null;
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loadingLanguages, setLoadingLanguages] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<VoiceFormData>({
    resolver: zodResolver(voiceSchema),
    defaultValues: {
      code: '',
      engine: undefined,
      language: '',
      displayName: '',
      gender: undefined,
      style: '',
      sampleUrl: '',
      sortOrder: undefined,
      isActive: true,
    },
  });

  const isActive = watch('isActive');
  const selectedEngine = watch('engine');
  const selectedLanguage = watch('language');
  const selectedGender = watch('gender');

  // Load languages
  useEffect(() => {
    if (open) {
      loadLanguagesData();
    }
  }, [open]);

  const loadLanguagesData = async () => {
    try {
      setLoadingLanguages(true);
      const data = await listLanguages(false); // Only active languages
      setLanguages(data);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err) || 'Failed to load languages');
    } finally {
      setLoadingLanguages(false);
    }
  };

  // Reset form when dialog opens/closes or voice changes
  useEffect(() => {
    if (open && voice) {
      reset({
        code: voice.code,
        engine: voice.engine as VoiceEngine,
        language: voice.language,
        displayName: voice.displayName,
        gender: voice.gender as VoiceGender | undefined,
        style: voice.style || '',
        sampleUrl: voice.sampleUrl || '',
        sortOrder: voice.sortOrder,
        isActive: voice.isActive,
      });
    } else if (open && !voice) {
      reset({
        code: '',
        engine: undefined,
        language: '',
        displayName: '',
        gender: undefined,
        style: '',
        sampleUrl: '',
        sortOrder: undefined,
        isActive: true,
      });
    }
  }, [open, voice, reset]);

  const onSubmit = async (data: VoiceFormData) => {
    try {
      if (isEditMode) {
        const updateDto: UpdateVoiceDto = {
          engine: data.engine as VoiceEngine,
          language: data.language,
          displayName: data.displayName,
          gender: data.gender as VoiceGender | undefined,
          style: data.style || undefined,
          sampleUrl: data.sampleUrl || undefined,
          sortOrder: data.sortOrder,
          isActive: data.isActive,
        };
        await updateVoice(voice.code, updateDto);
        toast.success('Voice updated successfully');
      } else {
        const createDto: CreateVoiceDto = {
          code: data.code,
          engine: data.engine as VoiceEngine,
          language: data.language,
          displayName: data.displayName,
          gender: data.gender as VoiceGender | undefined,
          style: data.style || undefined,
          sampleUrl: data.sampleUrl || undefined,
          sortOrder: data.sortOrder,
          isActive: data.isActive,
        };
        await createVoice(createDto);
        toast.success('Voice created successfully');
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
          <DialogTitle>{isEditMode ? 'Edit Voice' : 'Add New Voice'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update voice details. Voice code cannot be changed.'
              : 'Add a new TTS voice to the system. Language must exist before creating voice.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Voice Code */}
          <div className="space-y-2">
            <Label htmlFor="code">
              Voice Code <span className="text-destructive">*</span>
            </Label>
            <Input
              id="code"
              placeholder="nl-BE-Neural2-C"
              {...register('code')}
              disabled={isEditMode}
              className={errors.code ? 'border-destructive' : ''}
            />
            {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
            {!isEditMode && (
              <p className="text-xs text-muted-foreground">
                Unique identifier for the voice (e.g., language-engine-variant)
              </p>
            )}
          </div>

          {/* Engine and Language Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Engine */}
            <div className="space-y-2">
              <Label htmlFor="engine">
                Engine <span className="text-destructive">*</span>
              </Label>
              <Select value={selectedEngine} onValueChange={(value) => setValue('engine', value as VoiceEngine)}>
                <SelectTrigger className={errors.engine ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select engine" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="azure">Azure</SelectItem>
                  <SelectItem value="amazon">Amazon</SelectItem>
                  <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                </SelectContent>
              </Select>
              {errors.engine && <p className="text-sm text-destructive">{errors.engine.message}</p>}
            </div>

            {/* Language */}
            <div className="space-y-2">
              <Label htmlFor="language">
                Language <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedLanguage}
                onValueChange={(value) => setValue('language', value)}
                disabled={loadingLanguages}
              >
                <SelectTrigger className={errors.language ? 'border-destructive' : ''}>
                  <SelectValue placeholder={loadingLanguages ? 'Loading...' : 'Select language'} />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.languageCode} value={lang.languageCode}>
                      {lang.displayName} ({lang.languageCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.language && <p className="text-sm text-destructive">{errors.language.message}</p>}
            </div>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">
              Display Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="displayName"
              placeholder="Dutch (Belgium) Neural Female"
              {...register('displayName')}
              className={errors.displayName ? 'border-destructive' : ''}
            />
            {errors.displayName && (
              <p className="text-sm text-destructive">{errors.displayName.message}</p>
            )}
          </div>

          {/* Gender and Style Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Gender */}
            <div className="space-y-2">
              <Label htmlFor="gender">Gender (Optional)</Label>
              <Select value={selectedGender || ''} onValueChange={(value) => setValue('gender', value as VoiceGender)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Style */}
            <div className="space-y-2">
              <Label htmlFor="style">Style (Optional)</Label>
              <Input
                id="style"
                placeholder="neural, standard, etc."
                {...register('style')}
                className={errors.style ? 'border-destructive' : ''}
              />
              {errors.style && <p className="text-sm text-destructive">{errors.style.message}</p>}
            </div>
          </div>

          {/* Sample URL */}
          <div className="space-y-2">
            <Label htmlFor="sampleUrl">Sample URL (Optional)</Label>
            <Input
              id="sampleUrl"
              type="url"
              placeholder="https://example.com/sample.mp3"
              {...register('sampleUrl')}
              className={errors.sampleUrl ? 'border-destructive' : ''}
            />
            {errors.sampleUrl && <p className="text-sm text-destructive">{errors.sampleUrl.message}</p>}
            <p className="text-xs text-muted-foreground">URL to audio sample for preview</p>
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
                Inactive voices are hidden from dropdowns
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
                Deactivating this voice will hide it from all dropdowns. Existing references will
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

