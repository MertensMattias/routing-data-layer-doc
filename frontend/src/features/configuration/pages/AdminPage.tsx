import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Database, FileText, Download, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import * as auditService from '@/services/audit';
import { getApiErrorMessage } from '@/api/client';
import type { AuditLog } from '@/services/audit';
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/common';

export function AdminPage() {
  const [auditPage, setAuditPage] = useState(0);
  const [auditFilters, setAuditFilters] = useState({
    entityType: 'none',
    userId: '',
  });
  const AUDIT_PAGE_SIZE = 20;

  // Load audit logs using TanStack Query
  const {
    data: auditLogs = [],
    isLoading: auditLoading,
    error: auditError,
    refetch: refetchAuditLogs,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ['audit-logs', auditPage, auditFilters],
    queryFn: async () => {
      return await auditService.queryAuditLogs({
        limit: AUDIT_PAGE_SIZE,
        offset: auditPage * AUDIT_PAGE_SIZE,
        entityType: auditFilters.entityType !== 'none' ? auditFilters.entityType : undefined,
        userId: auditFilters.userId || undefined,
      });
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  const handleManualRefresh = () => {
    refetchAuditLogs();
    toast.info('Refreshing audit logs...');
  };

  const handleFilterChange = (newFilters: typeof auditFilters) => {
    setAuditFilters(newFilters);
    setAuditPage(0); // Reset to first page when filters change
  };

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: async () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1); // Last month
      return await auditService.exportAuditLogs(startDate, endDate, 'csv');
    },
    onSuccess: (blob) => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-logs-${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Audit logs exported successfully');
    },
    onError: (error: unknown) => {
      toast.error('Failed to export audit logs: ' + getApiErrorMessage(error));
    },
  });

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatAction = (action: string) => {
    // Convert "POST /api/v1/company-projects" to "Create Project"
    const method = action.split(' ')[0];
    const path = action.split(' ')[1];

    if (path?.includes('company-projects')) {
      if (method === 'POST') return 'Create Project';
      if (method === 'PUT') return 'Update Project';
      if (method === 'DELETE') return 'Delete Project';
    }
    if (path?.includes('routing')) {
      if (method === 'POST') return 'Create Routing';
      if (method === 'PUT') return 'Update Routing';
      if (method === 'DELETE') return 'Delete Routing';
    }
    if (path?.includes('segments')) {
      if (method === 'POST') return 'Create Segment';
      if (method === 'PUT') return 'Update Segment';
      if (method === 'DELETE') return 'Delete Segment';
    }
    if (path?.includes('messages')) {
      if (method === 'POST') return 'Create Message';
      if (method === 'PUT') return 'Update Message';
      if (method === 'DELETE') return 'Delete Message';
    }
    return action; // Fallback to raw action
  };

  const getStatusBadge = (status: 'success' | 'error') => {
    if (status === 'success') {
      return <span className="px-2 py-1 text-xs rounded bg-emerald-100 text-emerald-700">Success</span>;
    }
    return <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-700">Error</span>;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl text-slate-900 mb-2">Administration</h1>
        <p className="text-sm sm:text-base text-slate-600">System configuration and audit management</p>
      </div>

      <Tabs defaultValue="environment" className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="environment">Environment</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        {/* Environment Settings */}
        <TabsContent value="environment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-600">Version</p>
                  <p className="mt-1 font-medium text-slate-900">1.0.0</p>
                </div>
                <div>
                  <p className="text-slate-600">Environment</p>
                  <p className="mt-1 font-medium text-slate-900">{import.meta.env.MODE}</p>
                </div>
                <div>
                  <p className="text-slate-600">API URL</p>
                  <p className="mt-1 font-mono text-xs text-slate-900">{import.meta.env.VITE_API_URL || '/api/v1'}</p>
                </div>
                <div>
                  <p className="text-slate-600">Auth Mode</p>
                  <p className="mt-1 font-medium text-slate-900">{import.meta.env.VITE_AUTH_MODE || 'development'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <Label>Audit Logging</Label>
                    <p className="text-sm text-slate-600">Log all configuration changes</p>
                  </div>
                  <Switch defaultChecked disabled />
                </div>
                <p className="text-sm text-slate-500">
                  Audit logging is always enabled and cannot be disabled. All administrative actions are logged.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Log */}
        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Audit Log
                </CardTitle>
                <div className="flex items-center gap-2">
                  {dataUpdatedAt && (
                    <span className="text-xs text-slate-500">
                      Last updated: {new Date(dataUpdatedAt).toLocaleTimeString()}
                    </span>
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleManualRefresh}
                    disabled={auditLoading}
                    aria-label="Refresh audit logs"
                  >
                    <RefreshCw className={`h-4 w-4 ${auditLoading ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportMutation.mutate()}
                    disabled={auditLogs.length === 0 || exportMutation.isPending}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {exportMutation.isPending ? 'Exporting...' : 'Export CSV'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="mb-6 flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="filter-entityType" className="text-sm">Entity Type</Label>
                  <Select
                    value={auditFilters.entityType}
                    onValueChange={(value) => handleFilterChange({ ...auditFilters, entityType: value })}
                  >
                    <SelectTrigger id="filter-entityType" className="mt-1" aria-label="Filter audit logs by entity type">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">All Types</SelectItem>
                      <SelectItem value="CompanyProject">Company Project</SelectItem>
                      <SelectItem value="RoutingTable">Routing Table</SelectItem>
                      <SelectItem value="Segment">Segment</SelectItem>
                      <SelectItem value="Message">Message</SelectItem>
                      <SelectItem value="ChangeSet">Change Set</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label htmlFor="filter-userId" className="text-sm">User ID</Label>
                  <Input
                    id="filter-userId"
                    className="mt-1"
                    placeholder="Filter by user ID"
                    value={auditFilters.userId}
                    onChange={(e) => handleFilterChange({ ...auditFilters, userId: e.target.value })}
                  />
                </div>
              </div>

              {auditLoading ? (
                <LoadingSpinner />
              ) : auditError ? (
                <ErrorState error={auditError} onRetry={() => refetchAuditLogs()} />
              ) : auditLogs.length === 0 ? (
                <EmptyState title="No audit logs found. Actions will be logged here." />
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Entity</TableHead>
                        <TableHead>Entity ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>IP Address</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.map((log) => (
                        <TableRow key={log.auditId}>
                          <TableCell className="font-mono text-sm">
                            {formatTimestamp(log.timestamp)}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="text-sm font-medium text-slate-900">{log.userEmail}</div>
                              <div className="text-xs text-slate-500">{log.userId}</div>
                            </div>
                          </TableCell>
                          <TableCell>{formatAction(log.action)}</TableCell>
                          <TableCell>
                            <span className="px-2 py-1 text-xs rounded bg-indigo-100 text-indigo-700">
                              {log.entityType}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{log.entityId || '-'}</TableCell>
                          <TableCell>{getStatusBadge(log.responseStatus)}</TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {log.duration ? `${log.duration}ms` : '-'}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-600">
                            {log.ipAddress || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="mt-4 flex justify-between items-center">
                    <p className="text-sm text-slate-600">
                      Showing {auditPage * AUDIT_PAGE_SIZE + 1} - {auditPage * AUDIT_PAGE_SIZE + auditLogs.length}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAuditPage(auditPage - 1)}
                        disabled={auditPage === 0}
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAuditPage(auditPage + 1)}
                        disabled={auditLogs.length < AUDIT_PAGE_SIZE}
                      >
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

