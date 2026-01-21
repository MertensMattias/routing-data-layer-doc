import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { MessageKeyAuditResponseDto } from '@/services/messages/message-keys.service';
import { LoadingSpinner, EmptyState } from '@/components/common';
import { useEffect } from 'react';

interface AuditSidePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  auditHistory: MessageKeyAuditResponseDto[];
  loading: boolean;
}

export function AuditSidePanel({ open, onOpenChange, auditHistory, loading }: AuditSidePanelProps) {
  // Keyboard navigation: Escape key to close
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Side Panel */}
      <div
        className="fixed right-0 top-0 bottom-0 w-[400px] bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="audit-panel-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 id="audit-panel-title" className="text-lg font-semibold">Audit History</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 p-0"
            aria-label="Close audit history panel"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <LoadingSpinner size="medium" message="Loading audit history..." />
          ) : auditHistory.length === 0 ? (
            <EmptyState
              title="No audit records found"
              description="Audit history will appear here when changes are made to this message"
            />
          ) : (
            <div className="space-y-4" role="list" aria-label="Audit history entries">
              {auditHistory.map((audit) => (
                <div
                  key={audit.auditId}
                  className="border rounded-lg p-4 hover:bg-slate-50 transition-colors"
                  role="listitem"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Badge
                      className={
                        audit.action === 'published'
                          ? 'bg-green-100 text-green-700'
                          : audit.action === 'rollback'
                            ? 'bg-orange-100 text-orange-700'
                            : audit.action === 'deleted'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-indigo-100 text-indigo-700'
                      }
                      aria-label={`Action: ${audit.action}`}
                    >
                      {audit.action.toUpperCase()}
                    </Badge>
                    <time className="text-xs text-slate-600" dateTime={audit.dateAction.toString()}>
                      {new Date(audit.dateAction).toLocaleString()}
                    </time>
                  </div>
                  <p className="text-sm">
                    <span className="font-medium">By:</span> {audit.actionBy}
                  </p>
                  {audit.actionReason && (
                    <p className="text-sm mt-1">
                      <span className="font-medium">Reason:</span> {audit.actionReason}
                    </p>
                  )}
                  {audit.messageKeyVersionId && (
                    <p className="text-xs text-slate-500 mt-2 font-mono">
                      Version: {audit.messageKeyVersionId.substring(0, 8)}...
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

