import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { getVersion, type MessageKeyVersionResponseDto } from '@/services/messages/message-keys.service';
import { Badge } from '@/components/ui/badge';
import { getApiErrorMessage } from '@/api/client';

interface MessageVersionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: number;
  messageKey: string;
  version: number;
  currentLanguage?: string; // Optional: for displaying content in specific language
}

export function MessageVersionDetailsDialog({
  open,
  onOpenChange,
  storeId,
  messageKey,
  version: versionNumber,
  currentLanguage,
}: MessageVersionDetailsDialogProps) {
  const [version, setVersion] = useState<MessageKeyVersionResponseDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && versionNumber) {
      loadVersion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, versionNumber]);

  const loadVersion = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getVersion(storeId, messageKey, versionNumber);
      setVersion(data);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err) || 'Failed to load version details');
      console.error('Error loading version:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get content for current language (or first available language)
  const displayLanguage = currentLanguage || version?.languages[0]?.language;
  const languageContent = version?.languages.find((l) => l.language === displayLanguage);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Version {version?.version} Details
            {version && (
              <div className="flex gap-2 mt-2">
                <Badge variant={version.isPublished ? 'default' : 'secondary'}>
                  {version.isPublished ? 'Published' : 'Draft'}
                </Badge>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mx-auto" />
            <p className="mt-2 text-sm text-slate-600">Loading version details...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {version && languageContent && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-slate-500">Version</p>
                <p className="mt-1">v{version.version}{version.versionName ? ` - ${version.versionName}` : ''}</p>
              </div>
              <div>
                <p className="font-medium text-slate-500">Created</p>
                <p className="mt-1">{new Date(version.dateCreated).toLocaleString()}</p>
              </div>
              {version.createdBy && (
                <div>
                  <p className="font-medium text-slate-500">Created By</p>
                  <p className="mt-1">{version.createdBy}</p>
                </div>
              )}
              <div>
                <p className="font-medium text-slate-500">Languages</p>
                <p className="mt-1">{version.languages.length} {version.languages.length === 1 ? 'language' : 'languages'}</p>
              </div>
            </div>

            {/* Language selector if multiple languages */}
            {version.languages.length > 1 && (
              <div>
                <p className="font-medium text-slate-500 mb-2">
                  Displaying: {displayLanguage}
                </p>
                <p className="text-xs text-slate-400">
                  Available languages: {version.languages.map((l) => l.language).join(', ')}
                </p>
              </div>
            )}

            <div>
              <p className="font-medium text-slate-500 mb-2">Content ({displayLanguage})</p>
              <div className="bg-slate-50 p-4 rounded border max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm">{languageContent.content}</pre>
              </div>
            </div>

            {languageContent.typeSettings && Object.keys(languageContent.typeSettings).length > 0 && (
              <div>
                <p className="font-medium text-slate-500 mb-2">Type Settings</p>
                <div className="bg-slate-50 p-4 rounded border">
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(languageContent.typeSettings, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


