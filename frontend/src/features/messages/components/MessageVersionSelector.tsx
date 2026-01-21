import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Check, FileText } from 'lucide-react';
import { listVersions, getVersion, publishVersion, type MessageKeyVersionResponseDto } from '@/services/messages/message-keys.service';
import { getApiErrorMessage } from '@/api/client';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner, EmptyState } from '@/components/common';

interface MessageVersionSelectorProps {
  storeId: number;
  messageKey: string;
  currentLanguage?: string; // Optional: for displaying content in specific language
  onVersionPublished?: () => void;
}

export function MessageVersionSelector({
  storeId,
  messageKey,
  currentLanguage,
  onVersionPublished,
}: MessageVersionSelectorProps) {
  const { user } = useAuth();
  const [versions, setVersions] = useState<MessageKeyVersionResponseDto[]>([]);
  const [selectedVersionNumber, setSelectedVersionNumber] = useState<number | null>(null);
  const [versionDetails, setVersionDetails] = useState<MessageKeyVersionResponseDto | null>(null);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Load versions on mount
  useEffect(() => {
    loadAllVersions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, messageKey]);

  // Load details when selected version changes
  useEffect(() => {
    if (selectedVersionNumber !== null) {
      loadVersionDetails(selectedVersionNumber);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVersionNumber]);

  const loadAllVersions = async () => {
    try {
      setLoadingVersions(true);
      const data = await listVersions(storeId, messageKey);
      setVersions(data);

      // Auto-select published version or latest
      if (data.length > 0) {
        const publishedVersion = data.find((v) => v.isPublished);
        const defaultVersion = publishedVersion || data[0];
        setSelectedVersionNumber(defaultVersion.version);
      }
    } catch (error: unknown) {
      console.error('Error loading versions:', error);
      toast.error(getApiErrorMessage(error) || 'Failed to load versions');
    } finally {
      setLoadingVersions(false);
    }
  };

  const loadVersionDetails = async (versionNumber: number) => {
    try {
      setLoadingDetails(true);
      const data = await getVersion(storeId, messageKey, versionNumber);
      setVersionDetails(data);
    } catch (error: unknown) {
      console.error('Error loading version details:', error);
      toast.error(getApiErrorMessage(error) || 'Failed to load version details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handlePublish = async () => {
    if (selectedVersionNumber === null) return;

    try {
      setPublishing(true);
      await publishVersion(storeId, messageKey, {
        version: selectedVersionNumber,
        publishedBy: user?.email || user?.username || undefined,
      });
      toast.success('Version published successfully');
      await loadAllVersions();
      onVersionPublished?.();
    } catch (error: unknown) {
      const message = getApiErrorMessage(error) ||
        'Failed to publish version';
      toast.error(message);
      console.error('Error publishing version:', error);
    } finally {
      setPublishing(false);
    }
  };

  const selectedVersion = versions.find((v) => v.version === selectedVersionNumber);
  const isPublished = selectedVersion?.isPublished || false;

  // Get content for current language (or first available language)
  const displayLanguage = currentLanguage || versionDetails?.languages[0]?.language;
  const languageContent = versionDetails?.languages.find((l) => l.language === displayLanguage);

  if (loadingVersions) {
    return (
      <Card>
        <CardContent className="py-8">
          <LoadingSpinner size="medium" message="Loading versions..." />
        </CardContent>
      </Card>
    );
  }

  if (versions.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState
            title="No versions available"
            description="Create a version by editing the message"
            icon={FileText}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Version Content</CardTitle>
          {!isPublished && selectedVersion && (
            <Button
              onClick={handlePublish}
              disabled={publishing}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 transition-colors"
              aria-label={`Publish version ${selectedVersion.version} of ${messageKey}`}
            >
              {publishing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                  Publishing...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" aria-hidden="true" />
                  Publish This Version
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Version Selector */}
        <div className="flex items-center gap-4">
          <Label htmlFor="version-select" className="text-sm font-medium whitespace-nowrap">
            Viewing Version:
          </Label>
          <Select
            value={selectedVersionNumber?.toString() || ''}
            onValueChange={(value) => setSelectedVersionNumber(parseInt(value, 10))}
            aria-label="Select version to view"
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select version">
                {selectedVersion
                  ? `v${selectedVersion.version}${selectedVersion.versionName ? ` - ${selectedVersion.versionName}` : ''}`
                  : 'Select version'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {versions.map((version) => (
                <SelectItem key={version.version} value={version.version.toString()}>
                  <div className="flex items-center gap-2">
                    <span>
                      v{version.version}
                      {version.versionName && ` - ${version.versionName}`}
                    </span>
                    {version.isPublished && (
                      <Badge className="bg-green-100 text-green-700 text-xs">Published</Badge>
                    )}
                    {!version.isPublished && (
                      <Badge variant="outline" className="text-xs">
                        Draft
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Content Display */}
        {loadingDetails ? (
          <div className="py-8">
            <LoadingSpinner size="small" message="Loading content..." />
          </div>
        ) : versionDetails && languageContent ? (
          <>
            {/* Language selector if multiple languages */}
            {versionDetails.languages.length > 1 && (
              <div>
                <Label className="text-sm font-medium text-slate-500 mb-2">
                  Language: {displayLanguage}
                </Label>
                <p className="text-xs text-slate-400">
                  This version contains {versionDetails.languages.length} languages
                </p>
              </div>
            )}

            {/* Content */}
            <div>
              <p className="text-sm font-medium text-slate-500 mb-2">Content ({displayLanguage})</p>
              <div className="bg-slate-50 p-4 rounded border">
                <p className="text-sm whitespace-pre-wrap">{languageContent.content}</p>
              </div>
            </div>

            {/* Type Settings */}
            {languageContent.typeSettings && Object.keys(languageContent.typeSettings).length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-500 mb-2">Type Settings</p>
                <div className="bg-slate-50 p-4 rounded border">
                  <pre className="text-xs">
                    {JSON.stringify(languageContent.typeSettings, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="pt-4 border-t text-xs text-slate-500 flex justify-between">
              <span>
                Created: {new Date(versionDetails.dateCreated).toLocaleString()}
                {versionDetails.createdBy && ` | By: ${versionDetails.createdBy}`}
              </span>
              {isPublished && (
                <Badge className="bg-green-100 text-green-700">Published</Badge>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <p>Select a version to view content</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


