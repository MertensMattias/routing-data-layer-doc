import { useEffect, useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle, CheckCircle, Mic, MessageSquare, GitBranch, Loader2 } from 'lucide-react';
import type { LanguageImpact } from '@/api/types';
import { getLanguageImpact } from '@/services/configuration';
import { getApiErrorMessage } from '@/api/client';

interface ImpactAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  languageCode: string;
  onDeleteConfirm?: (code: string) => void;
}

export function ImpactAnalysisDialog({
  open,
  onOpenChange,
  languageCode,
  onDeleteConfirm,
}: ImpactAnalysisDialogProps) {
  const [impact, setImpact] = useState<LanguageImpact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadImpact = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getLanguageImpact(languageCode);
      setImpact(data);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err) || 'Failed to load impact analysis');
    } finally {
      setLoading(false);
    }
  }, [languageCode]);

  // Load impact analysis
  useEffect(() => {
    if (open && languageCode) {
      loadImpact();
    }
  }, [open, languageCode, loadImpact]);

  const handleDelete = async () => {
    if (!onDeleteConfirm || !impact) return;

    setDeleting(true);
    try {
      await onDeleteConfirm(impact.languageCode);
      onOpenChange(false);
    } catch {
      // Error handling is done in parent component
    } finally {
      setDeleting(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }

    if (!impact) return null;

    return (
      <div className="space-y-4">
        {/* Summary */}
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">{impact.displayName}</h3>
            <Badge variant={impact.hasBlockingIssues ? 'destructive' : 'default'}>
              {impact.hasBlockingIssues ? 'Blocked' : 'Safe'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">Code: {impact.languageCode}</p>
        </div>

        {/* Usage Statistics */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Usage Statistics</h4>

          <div className="space-y-2">
            {/* Voices */}
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900">
                  <Mic className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium">Voices</p>
                  <p className="text-sm text-muted-foreground">
                    TTS voices configured with this language
                  </p>
                </div>
              </div>
              <Badge variant={impact.voiceCount > 0 ? 'secondary' : 'outline'}>
                {impact.voiceCount}
              </Badge>
            </div>

            {/* Message Stores */}
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-green-100 dark:bg-green-900">
                  <MessageSquare className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium">Message Stores</p>
                  <p className="text-sm text-muted-foreground">Message stores using this language</p>
                </div>
              </div>
              <Badge variant={impact.messageStoreCount > 0 ? 'secondary' : 'outline'}>
                {impact.messageStoreCount}
              </Badge>
            </div>

            {/* Routing Tables */}
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-purple-100 dark:bg-purple-900">
                  <GitBranch className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium">Routing Tables</p>
                  <p className="text-sm text-muted-foreground">
                    Routing configurations referencing this language
                  </p>
                </div>
              </div>
              <Badge variant={impact.routingTableCount > 0 ? 'secondary' : 'outline'}>
                {impact.routingTableCount}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <span className="font-medium">Total Usage</span>
            <Badge variant={impact.totalUsage > 0 ? 'default' : 'outline'}>
              {impact.totalUsage} reference{impact.totalUsage !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        {/* Blocking Issues */}
        {impact.hasBlockingIssues && impact.blockingReasons.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold mb-2">Cannot Delete - Blocking Issues:</p>
              <ul className="list-disc list-inside space-y-1">
                {impact.blockingReasons.map((reason, index) => (
                  <li key={index} className="text-sm">
                    {reason}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Recommendation */}
        {impact.recommendation && (
          <Alert variant={impact.hasBlockingIssues ? 'default' : 'default'}>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold">Recommendation:</p>
              <p className="text-sm mt-1">{impact.recommendation}</p>
            </AlertDescription>
          </Alert>
        )}

        {/* Safe to delete message */}
        {!impact.hasBlockingIssues && impact.totalUsage === 0 && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              This language has no dependencies and can be safely deactivated.
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Impact Analysis</DialogTitle>
          <DialogDescription>
            Review what would be affected if this language were deactivated.
          </DialogDescription>
        </DialogHeader>

        {renderContent()}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleting}>
            {onDeleteConfirm ? 'Cancel' : 'Close'}
          </Button>
          {onDeleteConfirm && impact && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={impact.hasBlockingIssues || deleting}
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Deactivate Language
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

