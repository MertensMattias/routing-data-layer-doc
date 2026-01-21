import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { History, Loader2, Eye, Check } from 'lucide-react';
import { listVersions, publishVersion, type MessageKeyVersionResponseDto } from '@/services/messages/message-keys.service';
import { MessageVersionDetailsDialog } from './MessageVersionDetailsDialog';
import { getApiErrorMessage } from '@/api/client';
import { useAuth } from '@/hooks/useAuth';

interface MessageVersionsDialogProps {
  storeId: number;
  messageKey: string;
  currentPublishedVersion?: number;
  onVersionPublished?: () => void;
}

export function MessageVersionsDialog({
  storeId,
  messageKey,
  currentPublishedVersion,
  onVersionPublished,
}: MessageVersionsDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [versions, setVersions] = useState<MessageKeyVersionResponseDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<number | null>(null);
  const [versionDetailsOpen, setVersionDetailsOpen] = useState(false);
  const [selectedVersionNumber, setSelectedVersionNumber] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      loadVersions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, storeId, messageKey]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listVersions(storeId, messageKey);
      // Sort by version number descending
      setVersions(data.sort((a, b) => b.version - a.version));
    } catch (err: unknown) {
      setError(getApiErrorMessage(err) || 'Failed to load versions');
      console.error('Error loading versions:', err);
      toast.error(getApiErrorMessage(err) || 'Failed to load versions');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (version: MessageKeyVersionResponseDto) => {
    if (!version.isPublished && version.version) {
      try {
        setPublishing(version.version);
        await publishVersion(storeId, messageKey, {
          version: version.version,
          publishedBy: user?.email || user?.username || undefined,
        });
        toast.success(`Version ${version.version} published successfully`);
        await loadVersions();
        onVersionPublished?.();
      } catch (err: unknown) {
        const message = getApiErrorMessage(err) ||
          'Failed to publish version';
        toast.error(message);
        console.error('Error publishing version:', err);
      } finally {
        setPublishing(null);
      }
    }
  };

  const handleViewVersion = async (version: MessageKeyVersionResponseDto) => {
    setSelectedVersionNumber(version.version);
    setVersionDetailsOpen(true);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <History className="w-4 h-4 mr-2" />
          Version History
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
          <DialogDescription>
            {messageKey} - Manage message versions (all languages)
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mx-auto" />
            <p className="mt-2 text-sm text-slate-600">Loading versions...</p>
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-4">
            {versions.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p>No versions found</p>
                <p className="text-sm mt-2">Create a version by updating the message content</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Version</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {versions.map((version) => {
                      const isPublished = version.version === currentPublishedVersion;
                      const isPublishing = publishing === version.version;

                      return (
                        <TableRow key={version.version}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                v{version.version}
                                {version.versionName && ` - ${version.versionName}`}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {version.languages.length} {version.languages.length === 1 ? 'language' : 'languages'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {isPublished ? (
                                <Badge className="bg-green-100 text-green-700">
                                  <Check className="w-3 h-3 mr-1" />
                                  Published
                                </Badge>
                              ) : (
                                <Badge variant="outline">Draft</Badge>
                              )}
                              {!version.isPublished && (
                                <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                                  Inactive
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{formatDate(version.dateCreated)}</TableCell>
                          <TableCell className="text-sm">
                            {version.createdBy || <span className="text-slate-400">-</span>}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewVersion(version)}
                                title="View version"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {!isPublished && version.version && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handlePublish(version)}
                                  disabled={isPublishing}
                                  title="Publish this version (all languages)"
                                >
                                  {isPublishing ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    'Publish'
                                  )}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </>
            )}
          </div>
        )}
      </DialogContent>
      {selectedVersionNumber !== null && (
        <MessageVersionDetailsDialog
          open={versionDetailsOpen}
          onOpenChange={setVersionDetailsOpen}
          storeId={storeId}
          messageKey={messageKey}
          version={selectedVersionNumber}
        />
      )}
    </Dialog>
  );
}


