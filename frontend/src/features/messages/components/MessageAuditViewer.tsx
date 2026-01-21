'use client';

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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { History, Loader2, ChevronLeft, ChevronRight, Filter, X, FileText } from 'lucide-react';
import {
  getAuditHistory,
  type MessageKeyAuditResponseDto,
  type MessageKeyAuditQueryDto,
  type MessageKeyAuditListResponseDto,
} from '@/services/messages/message-keys.service';
import { getApiErrorMessage } from '@/api/client';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/common';

interface MessageAuditViewerProps {
  storeId: number;
  messageKey: string;
  trigger?: React.ReactNode;
}

const ACTION_COLORS: Record<string, string> = {
  created: 'bg-indigo-100 text-indigo-700',
  edited: 'bg-yellow-100 text-yellow-700',
  published: 'bg-green-100 text-green-700',
  rollback: 'bg-orange-100 text-orange-700',
  deleted: 'bg-red-100 text-red-700',
  language_added: 'bg-purple-100 text-purple-700',
  imported: 'bg-indigo-100 text-indigo-700',
};

export function MessageAuditViewer({
  storeId,
  messageKey,
  trigger,
}: MessageAuditViewerProps) {
  const [open, setOpen] = useState(false);
  const [auditData, setAuditData] = useState<MessageKeyAuditListResponseDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<MessageKeyAuditQueryDto>({
    page: 1,
    pageSize: 50,
  });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      loadAuditHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, filters]);

  const loadAuditHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAuditHistory(storeId, messageKey, filters);
      setAuditData(data);
    } catch (err: unknown) {
      const errorMessage = getApiErrorMessage(err) || 'Failed to load audit history';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error loading audit history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof MessageKeyAuditQueryDto, value: string | number | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filters change
    }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      pageSize: 50,
    });
  };

  const toggleRowExpansion = (auditId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(auditId)) {
        newSet.delete(auditId);
      } else {
        newSet.add(auditId);
      }
      return newSet;
    });
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString();
  };

  const hasActiveFilters = Boolean(
    filters.action || filters.actionBy || filters.startDate || filters.endDate
  );

  const totalPages = auditData ? Math.ceil(auditData.total / auditData.pageSize) : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <History className="w-4 h-4 mr-2" />
            Audit History
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Audit History</DialogTitle>
          <DialogDescription>
            {messageKey} - Complete audit trail of all changes
          </DialogDescription>
        </DialogHeader>

        {/* Filters */}
        <div className="space-y-4 border-b pb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </h3>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="action-filter" className="text-xs">
                Action
              </Label>
              <Select
                value={filters.action || 'all'}
                onValueChange={(value) =>
                  handleFilterChange('action', value === 'all' ? undefined : value)
                }
              >
                <SelectTrigger id="action-filter" className="h-9">
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="edited">Edited</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="rollback">Rollback</SelectItem>
                  <SelectItem value="deleted">Deleted</SelectItem>
                  <SelectItem value="language_added">Language Added</SelectItem>
                  <SelectItem value="imported">Imported</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="action-by-filter" className="text-xs">
                User
              </Label>
              <Input
                id="action-by-filter"
                placeholder="Filter by user..."
                value={filters.actionBy || ''}
                onChange={(e) => handleFilterChange('actionBy', e.target.value || undefined)}
                className="h-9"
              />
            </div>

            <div>
              <Label htmlFor="start-date-filter" className="text-xs">
                From Date
              </Label>
              <Input
                id="start-date-filter"
                type="datetime-local"
                value={filters.startDate ? new Date(filters.startDate).toISOString().slice(0, 16) : ''}
                onChange={(e) =>
                  handleFilterChange(
                    'startDate',
                    e.target.value ? new Date(e.target.value).toISOString() : undefined
                  )
                }
                className="h-9"
              />
            </div>

            <div>
              <Label htmlFor="end-date-filter" className="text-xs">
                To Date
              </Label>
              <Input
                id="end-date-filter"
                type="datetime-local"
                value={filters.endDate ? new Date(filters.endDate).toISOString().slice(0, 16) : ''}
                onChange={(e) =>
                  handleFilterChange(
                    'endDate',
                    e.target.value ? new Date(e.target.value).toISOString() : undefined
                  )
                }
                className="h-9"
              />
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <ErrorState
            title="Failed to load audit history"
            message={error}
            onRetry={loadAuditHistory}
            className="mb-4"
          />
        )}

        {/* Loading State */}
        {loading && (
          <div className="py-8">
            <LoadingSpinner size="medium" message="Loading audit history..." />
          </div>
        )}

        {/* Audit Table */}
        {!loading && !error && auditData && (
          <div className="space-y-4">
            {auditData.data.length === 0 ? (
              <EmptyState
                title="No audit records found"
                description={
                  hasActiveFilters
                    ? 'Try adjusting your filters to see more results'
                    : 'No audit history available for this message'
                }
                icon={FileText}
              />
            ) : (
              <>
                <div className="text-sm text-slate-600">
                  Showing {auditData.data.length} of {auditData.total} records
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Date</TableHead>
                        <TableHead className="w-[120px]">Action</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditData.data.map((audit) => {
                        const isExpanded = expandedRows.has(audit.auditId);
                        const actionColor = ACTION_COLORS[audit.action] || 'bg-slate-100 text-slate-700';

                        return (
                          <Collapsible
                            key={audit.auditId}
                            open={isExpanded}
                            onOpenChange={() => toggleRowExpansion(audit.auditId)}
                          >
                            <TableRow>
                              <TableCell className="text-sm">
                                {formatDate(audit.dateAction)}
                              </TableCell>
                              <TableCell>
                                <Badge className={actionColor}>
                                  {audit.action}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm">{audit.actionBy}</TableCell>
                              <TableCell className="text-sm text-slate-600">
                                {audit.actionReason || '-'}
                              </TableCell>
                              <TableCell>
                                <CollapsibleTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    {isExpanded ? 'Hide' : 'Show'} Details
                                  </Button>
                                </CollapsibleTrigger>
                              </TableCell>
                            </TableRow>
                            <CollapsibleContent asChild>
                              <TableRow>
                                <TableCell colSpan={5} className="bg-slate-50">
                                  <div className="p-4 space-y-3">
                                    {audit.auditData && Object.keys(audit.auditData).length > 0 && (
                                      <div>
                                        <p className="text-xs font-medium text-slate-500 mb-2">
                                          Audit Data:
                                        </p>
                                        <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
                                          {JSON.stringify(audit.auditData, null, 2)}
                                        </pre>
                                      </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-4 text-xs text-slate-600">
                                      <div>
                                        <span className="font-medium">Audit ID:</span>{' '}
                                        {audit.auditId}
                                      </div>
                                      {audit.messageKeyVersionId && (
                                        <div>
                                          <span className="font-medium">Version ID:</span>{' '}
                                          {audit.messageKeyVersionId}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-600">
                      Page {auditData.page} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFilterChange('page', (filters.page || 1) - 1)}
                        disabled={auditData.page <= 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFilterChange('page', (filters.page || 1) + 1)}
                        disabled={auditData.page >= totalPages}
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
