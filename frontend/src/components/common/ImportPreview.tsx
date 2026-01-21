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
import { ImportPreviewService, type ImportChangesSummary } from '@/services/shared';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Type for unified import report (matches backend UnifiedImportReportDto)
interface UnifiedImportReport {
  isValid: boolean;
  validatedAt: string;
  summary?: {
    flows?: { willCreate: number; willUpdate: number; willSkip: number };
    messages?: { willCreate: number; willUpdate: number; willSkip: number };
    routing?: { willCreate: number; willUpdate: number; willSkip: number };
  };
  conflicts: Array<{
    entityType: 'flow' | 'message' | 'routing';
    entityId: string;
    currentVersion: number;
    importVersion: number;
    currentModified: string;
    importModified: string;
    suggestedAction: 'create' | 'update' | 'skip';
    details?: Record<string, unknown>;
  }>;
  errors?: string[];
  warnings?: string[];
  previewChanges?: {
    affectedFlows?: string[];
    affectedMessages?: string[];
    affectedRoutingEntries?: string[];
  };
}

interface ImportPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preview: UnifiedImportReport | Record<string, unknown> | null;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ImportPreview({
  open,
  onOpenChange,
  preview,
  onConfirm,
  onCancel,
  isLoading = false,
}: ImportPreviewProps) {
  const processed = preview && 'isValid' in preview && typeof (preview as UnifiedImportReport).isValid === 'boolean'
    ? ImportPreviewService.processPreview(preview as UnifiedImportReport)
    : null;
  const [hasReviewedConflicts, setHasReviewedConflicts] = useState(false);

  // Don't render if no preview data
  if (!preview || !processed) {
    return null;
  }

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Import Preview
            <Badge variant={getRiskBadgeColor(processed.riskLevel)}>
              {processed.riskLevel.toUpperCase()} RISK
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Total Changes</p>
              <p className="text-2xl font-bold">{processed.totalChanges}</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Est. Duration</p>
              <p className="text-lg font-semibold">{processed.estimatedDuration}</p>
            </div>
          </div>

          {/* Changes by Type */}
          <Tabs defaultValue="changes">
            <TabsList>
              <TabsTrigger value="changes">Changes</TabsTrigger>
              <TabsTrigger value="conflicts">
                Conflicts ({processed.criticalConflicts.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="changes" className="space-y-3">
              {Object.entries(processed.changesByType).map(([type, changes]: [string, ImportChangesSummary]) => (
                <div key={type} className="border rounded-lg p-3 space-y-2">
                  <p className="font-semibold capitalize">{type}</p>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-green-600 dark:text-green-400">
                      Create: <span className="font-bold">{changes.create}</span>
                    </div>
                    <div className="text-blue-600 dark:text-blue-400">
                      Update: <span className="font-bold">{changes.update}</span>
                    </div>
                    <div className="text-muted-foreground">
                      Skip: <span className="font-bold">{changes.skip}</span>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="conflicts" className="space-y-3">
              {processed.criticalConflicts.length === 0 ? (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>No conflicts detected</AlertDescription>
                </Alert>
              ) : (
                processed.criticalConflicts.map((conflict, idx: number) => (
                  <div
                    key={idx}
                    className="border-l-4 border-destructive rounded-lg p-3 bg-destructive/10"
                  >
                    <p className="font-semibold text-sm">{conflict.entityId}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Current: v{String(conflict.currentVersion)} | Import: v{String(conflict.importVersion)}
                    </p>
                    <p className="text-xs text-muted-foreground">Action: {String(conflict.suggestedAction)}</p>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>

          {/* Recommendation */}
          <Alert className={processed.riskLevel === 'high' ? 'border-destructive' : ''}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{processed.recommendedAction}</AlertDescription>
          </Alert>

          {/* Conflict Review Checkbox */}
          {processed.criticalConflicts.length > 0 && (
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
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={
              isLoading ||
              !processed.isValid ||
              (processed.criticalConflicts.length > 0 && !hasReviewedConflicts)
            }
          >
            {isLoading ? 'Importing...' : 'Confirm Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
