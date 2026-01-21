import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TypeSettingsEditor } from './messages/TypeSettingsEditor';
import { LoadingSpinner } from '@/components/common';
import {
  getVersion,
  createVersion,
  type MessageKeyResponseDto,
} from '@/services/messages/message-keys.service';
import { listMessageTypes, type MessageTypeResponseDto } from '@/services/messages/message-stores.service';
import { useAuth } from '@/hooks/useAuth';
import { getApiErrorMessage } from '@/api/client';

interface EditMessageDialogProps {
  message: MessageKeyResponseDto;
  language: string; // Language being edited
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditMessageDialog({
  message,
  language,
  open,
  onOpenChange,
  onSuccess,
}: EditMessageDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [messageTypes, setMessageTypes] = useState<MessageTypeResponseDto[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);

  // Form state - initialize with current published version or empty
  const [content, setContent] = useState('');
  const [typeSettings, setTypeSettings] = useState<Record<string, unknown>>({});

  // Load message types and initialize form when dialog opens
  useEffect(() => {
    if (open) {
      loadMessageTypes();
      loadPublishedVersionContent();
    }
  }, [open, message, language]);

  const loadPublishedVersionContent = async () => {
    if (!message.publishedVersion) {
      setContent('');
      setTypeSettings({});
      return;
    }

    try {
      setLoadingContent(true);
      const version = await getVersion(message.messageStoreId, message.messageKey, message.publishedVersion);
      const langContent = version.languages.find((l) => l.language === language);
      if (langContent) {
        setContent(langContent.content);
        setTypeSettings(langContent.typeSettings || {});
      } else {
        setContent('');
        setTypeSettings({});
      }
    } catch (error: unknown) {
      console.error('Error loading published version content:', error);
      setContent('');
      setTypeSettings({});
    } finally {
      setLoadingContent(false);
    }
  };

  const loadMessageTypes = async () => {
    try {
      setLoadingTypes(true);
      const types = await listMessageTypes();
      setMessageTypes(types);
    } catch (error: unknown) {
      console.error('Error loading message types:', error);
      toast.error(getApiErrorMessage(error) || 'Failed to load message types');
    } finally {
      setLoadingTypes(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error('Content is required');
      return;
    }

    try {
      setSubmitting(true);

      // Get current published version to copy all languages
      let baseVersion = message.publishedVersion || message.latestVersion;
      if (!baseVersion) {
        throw new Error('No base version available');
      }

      const currentVersion = await getVersion(message.messageStoreId, message.messageKey, baseVersion);

      // Create language updates: update the edited language, keep others unchanged
      const languageUpdates = currentVersion.languages.map((lang) => {
        if (lang.language === language) {
          return {
            language: lang.language,
            content,
            typeSettings: Object.keys(typeSettings).length > 0 ? typeSettings : undefined,
          };
        }
        return {
          language: lang.language,
          content: lang.content,
          typeSettings: lang.typeSettings,
        };
      });

      // If language doesn't exist in current version, add it
      if (!currentVersion.languages.find((l) => l.language === language)) {
        languageUpdates.push({
          language,
          content,
          typeSettings: Object.keys(typeSettings).length > 0 ? typeSettings : undefined,
        });
      }

      await createVersion(message.messageStoreId, message.messageKey, {
        baseVersion,
        languageUpdates,
        createdBy: user?.email || user?.username || undefined,
      });

      // Invalidate caches to refresh data
      queryClient.invalidateQueries({ queryKey: ['message-keys'] });
      queryClient.invalidateQueries({ queryKey: ['message-stores'] });

      toast.success('New version created', {
        description: 'The new version is saved as a draft. Publish it to make it live.',
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error) || 'Failed to update message');
      console.error('Error updating message:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const currentMessageType = messageTypes.find((t) => t.messageTypeId === message.messageTypeId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Message</DialogTitle>
          <DialogDescription>
            Create a new version of {message.messageKey} ({language}). This will create a
            draft version that must be published to go live.
          </DialogDescription>
        </DialogHeader>

        {loadingTypes || loadingContent ? (
          <div className="py-8">
            <LoadingSpinner size="medium" message="Loading message data..." />
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-6 py-4">
              {/* Message Info (Read-only) */}
              <div className="bg-slate-50 p-4 rounded border space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-slate-500">Message Key:</span>
                    <span className="ml-2 font-mono">{message.messageKey}</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-500">Language:</span>
                    <span className="ml-2">{language}</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-500">Type:</span>
                    <span className="ml-2">{currentMessageType?.displayName || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-500">Current Version:</span>
                    <span className="ml-2">
                      {message.publishedVersion
                        ? `v${message.publishedVersion}`
                        : 'No published version'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content">
                  Content *
                  {message.publishedVersion && (
                    <span className="ml-2 text-xs text-slate-500 font-normal">
                      (Editing from v{message.publishedVersion})
                    </span>
                  )}
                </Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter the message content..."
                  rows={8}
                  required
                />
              </div>

              {/* Type Settings */}
              {currentMessageType && currentMessageType.settingsSchema && (
                <TypeSettingsEditor
                  schema={currentMessageType.settingsSchema}
                  value={typeSettings}
                  onChange={setTypeSettings}
                />
              )}

              <div className="bg-indigo-50 border border-indigo-200 p-3 rounded text-sm" role="status" aria-live="polite">
                <p className="font-medium text-indigo-900 mb-1">What happens next?</p>
                <ul className="text-indigo-800 space-y-1 ml-4 list-disc">
                  <li>A new version will be created (not published yet)</li>
                  <li>The current published version remains live</li>
                  <li>You can publish the new version from the Version History dialog</li>
                </ul>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
                className="border-slate-300 hover:bg-slate-50 min-h-[44px] transition-colors"
                aria-label="Cancel editing message"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-indigo-600 hover:bg-indigo-700 min-h-[44px] transition-colors"
                aria-label="Save new version of message"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                    Saving...
                  </>
                ) : (
                  'Save New Version'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

