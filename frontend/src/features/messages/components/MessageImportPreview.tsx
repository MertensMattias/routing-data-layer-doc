'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface MessageImportPreviewData {
  isValid: boolean;
  willCreate: number;
  willUpdate: number;
  willSkip: number;
  conflicts: Array<{
    messageKey: string;
    language: string;
    current?: Record<string, unknown>;
    imported?: Record<string, unknown>;
    action: 'create' | 'update' | 'skip';
  }>;
  errors?: string[];
  warnings?: string[];
}

interface MessageImportPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preview: MessageImportPreviewData | null;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function MessageImportPreview({
  open,
  onOpenChange,
  preview,
  onConfirm,
  onCancel,
  isLoading = false,
}: MessageImportPreviewProps) {
  const [hasReviewedConflicts, setHasReviewedConflicts] = useState(false);

  if (!preview) {
    return null;
  }

  const hasConflicts = preview.conflicts && preview.conflicts.length > 0;
  const totalChanges = preview.willCreate + preview.willUpdate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Import Preview
            <Badge variant={preview.isValid ? 'default' : 'destructive'}>
              {preview.isValid ? 'VALID' : 'INVALID'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Will Create</p>
              <p className="text-2xl font-bold text-green-600">{preview.willCreate}</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Will Update</p>
              <p className="text-2xl font-bold text-indigo-600">{preview.willUpdate}</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Will Skip</p>
              <p className="text-2xl font-bold text-muted-foreground">{preview.willSkip}</p>
            </div>
          </div>

          {/* Tabs for Conflicts and Errors */}
          <Tabs defaultValue={hasConflicts ? 'conflicts' : 'summary'}>
            <TabsList>
              <TabsTrigger value="summary">Summary</TabsTrigger>
              {hasConflicts && (
                <TabsTrigger value="conflicts">
                  Conflicts ({preview.conflicts.length})
                </TabsTrigger>
              )}
              {preview.errors && preview.errors.length > 0 && (
                <TabsTrigger value="errors">
                  Errors ({preview.errors.length})
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="summary" className="space-y-3">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  {totalChanges} message{totalChanges !== 1 ? 's' : ''} will be{' '}
                  {preview.willCreate > 0 && `${preview.willCreate} created`}
                  {preview.willCreate > 0 && preview.willUpdate > 0 && ' and '}
                  {preview.willUpdate > 0 && `${preview.willUpdate} updated`}
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="conflicts" className="space-y-3">
              {preview.conflicts.map((conflict, idx) => (
                <div
                  key={idx}
                  className="border-l-4 border-destructive rounded-lg p-3 bg-destructive/10"
                >
                  <p className="font-semibold text-sm">
                    {conflict.messageKey} ({conflict.language})
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Action: {conflict.action}
                  </p>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="errors" className="space-y-3">
              {preview.errors?.map((error, idx) => (
                <Alert key={idx} variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ))}
            </TabsContent>
          </Tabs>

          {/* Conflict Review Checkbox */}
          {hasConflicts && (
            <label className="flex items-center space-x-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={hasReviewedConflicts}
                onChange={(e) => setHasReviewedConflicts(e.target.checked)}
                className="rounded"
              />
              <span>I have reviewed the conflicts and want to proceed</span>
            </label>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="transition-colors"
            aria-label="Cancel import"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={
              isLoading ||
              !preview.isValid ||
              (hasConflicts && !hasReviewedConflicts)
            }
            className="transition-colors"
            aria-label="Confirm and import messages"
          >
            {isLoading ? 'Importing...' : 'Confirm Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
