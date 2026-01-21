import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Box, MessageSquare, Loader2, Workflow, Pencil, RefreshCw, Copy, Check, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CreateRoutingDialog, EditRoutingEntryDialog, RoutingEntryImpactDialog } from '@/features/routing/components';
import { useCompanyProjectContext } from '@/contexts/CompanyProjectContext';
import { listRoutingEntries, deleteRoutingEntry, type RoutingEntryResponseDto } from '@/services/routing';
import { getApiErrorMessage } from '@/api/client';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useDomainPermissions } from '@/hooks/useDomainPermissions';
import { useAuth } from '@/hooks/useAuth';
import { Domain } from '@shared/types/roles';
import { ExportDialog } from '@/components/common/ExportDialog';
import { Download } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export function RoutingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { selectedCompanyProjectId } = useCompanyProjectContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingEntry, setEditingEntry] = useState<RoutingEntryResponseDto | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<RoutingEntryResponseDto | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Advanced filters
  const [filters, setFilters] = useState({
    routingId: '',
    language: '',
    status: '',
    initSegment: '',
  });
  
  // Get user permissions
  const { user } = useAuth();
  const permissions = useDomainPermissions({
    roles: user?.roles,
    domain: Domain.ROUTING_TABLE,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteRoutingEntry,
    onSuccess: () => {
      toast.success('Routing entry deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['routing-entries'] });
      setDeletingEntry(null);
    },
    onError: (error: unknown) => {
      const errorMsg = getApiErrorMessage(error);
      toast.error(errorMsg || 'Failed to delete routing entry');
    },
  });

  const handleDeleteConfirm = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const handleCopyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      toast.success('ID copied to clipboard');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast.error('Failed to copy ID');
    }
  };

  // Load routing entries using React Query
  const {
    data: routingData = [],
    isLoading: loading,
    error,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ['routing-entries', selectedCompanyProjectId],
    queryFn: async () => {
      const projectId = selectedCompanyProjectId ?? undefined;
      return await listRoutingEntries(undefined, projectId);
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    // Optional: Background polling at 5 minute interval for external changes
    refetchInterval: 300000, // 5 minutes
    refetchIntervalInBackground: false,
  });

  const handleManualRefresh = () => {
    refetch();
    toast.info('Refreshing routing entries...');
  };

  // Get unique values for filter dropdowns
  const uniqueRoutingIds = Array.from(new Set(routingData.map((r) => r.routingId).filter(Boolean))).sort() as string[];
  const uniqueLanguages = Array.from(new Set(routingData.map((r) => r.languageCode).filter((lang): lang is string => Boolean(lang)))).sort();
  const uniqueInitSegments = Array.from(new Set(routingData.map((r) => r.initSegment).filter(Boolean))).sort() as string[];

  const filteredData = routingData.filter((route) => {
    // Text search filter
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      const matchesSearch =
        route.sourceId?.toLowerCase().includes(query) ||
        route.routingTableId?.toLowerCase().includes(query) ||
        route.routingId?.toLowerCase().includes(query) ||
        route.initSegment?.toLowerCase().includes(query) ||
        route.languageCode?.toLowerCase().includes(query) ||
        route.messageStoreId?.toString().includes(query) ||
        route.companyProjectId?.toString().includes(query);
      if (!matchesSearch) return false;
    }

    // Column filters
    if (filters.routingId && route.routingId !== filters.routingId) return false;
    if (filters.language && route.languageCode !== filters.language) return false;
    if (filters.status) {
      if (filters.status === 'active' && !route.isActive) return false;
      if (filters.status === 'inactive' && route.isActive) return false;
    }
    if (filters.initSegment && route.initSegment !== filters.initSegment) return false;

    return true;
  });

  const activeFilterCount = Object.values(filters).filter((v) => v !== '').length;

  const clearFilters = () => {
    setFilters({
      routingId: '',
      language: '',
      status: '',
      initSegment: '',
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl text-slate-900 mb-2">Routing Management</h1>
        <p className="text-sm sm:text-base text-slate-600">Search and manage IVR routing configurations</p>
      </div>

      {/* Advanced Search */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Search Routing Configuration</CardTitle>
            {dataUpdatedAt && (
              <span className="text-xs text-slate-500">
                Last updated: {new Date(dataUpdatedAt).toLocaleTimeString()}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search by routing ID, source ID, language, message store, init segment..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleManualRefresh}
                  title="Refresh"
                  aria-label="Refresh routing entries"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span className="sr-only">Refresh routing entries</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setExportDialogOpen(true)}
                  aria-label="Export routing entries"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                {permissions.canCreate && <CreateRoutingDialog />}
              </div>
            </div>

            {/* Advanced Filters (Collapsible) */}
            <Collapsible open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
              <div className="border border-slate-200 rounded-lg">
                <CollapsibleTrigger className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-slate-900">Advanced Filters</span>
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </div>
                  {showAdvancedFilters ? (
                    <ChevronUp className="h-4 w-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  )}
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="p-4 space-y-4 border-t border-slate-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Routing ID Filter */}
                      <div className="space-y-2">
                        <Label htmlFor="filter-routing-id" className="text-sm font-medium text-slate-700">
                          Routing ID
                        </Label>
                        <Select
                          value={filters.routingId || 'all'}
                          onValueChange={(value) => setFilters({ ...filters, routingId: value === 'all' ? '' : value })}
                        >
                          <SelectTrigger id="filter-routing-id" className="border-slate-200">
                            <SelectValue placeholder="All" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            {uniqueRoutingIds.map((id) => (
                              <SelectItem key={id} value={id}>
                                {id}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Initial Segment Filter */}
                      <div className="space-y-2">
                        <Label htmlFor="filter-init-segment" className="text-sm font-medium text-slate-700">
                          Initial Segment
                        </Label>
                        <Select
                          value={filters.initSegment || 'all'}
                          onValueChange={(value) => setFilters({ ...filters, initSegment: value === 'all' ? '' : value })}
                        >
                          <SelectTrigger id="filter-init-segment" className="border-slate-200">
                            <SelectValue placeholder="All" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            {uniqueInitSegments.map((segment) => (
                              <SelectItem key={segment} value={segment}>
                                {segment}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Language Filter */}
                      <div className="space-y-2">
                        <Label htmlFor="filter-language" className="text-sm font-medium text-slate-700">
                          Language
                        </Label>
                        <Select
                          value={filters.language || 'all'}
                          onValueChange={(value) => setFilters({ ...filters, language: value === 'all' ? '' : value })}
                        >
                          <SelectTrigger id="filter-language" className="border-slate-200">
                            <SelectValue placeholder="All" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            {uniqueLanguages.map((lang) => (
                              <SelectItem key={lang} value={lang || ''}>
                                {lang}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Status Filter */}
                      <div className="space-y-2">
                        <Label htmlFor="filter-status" className="text-sm font-medium text-slate-700">
                          Status
                        </Label>
                        <Select
                          value={filters.status || 'all'}
                          onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? '' : value })}
                        >
                          <SelectTrigger id="filter-status" className="border-slate-200">
                            <SelectValue placeholder="All" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Clear Filters Button */}
                    {activeFilterCount > 0 && (
                      <div className="flex justify-end pt-2 border-t border-slate-200">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearFilters}
                          className="text-slate-600 hover:text-slate-900"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Clear All Filters
                        </Button>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-4 rounded">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Failed to load routing entries</p>
              <p className="text-xs mt-1">{getApiErrorMessage(error)}</p>
              <p className="text-xs mt-1 text-slate-600">
                {error instanceof Error && error.message.includes('Network')
                  ? 'Backend may be offline. Retrying automatically...'
                  : 'Click retry to try again.'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mx-auto" />
          <p className="mt-4 text-slate-600">Loading routing entries...</p>
        </div>
      )}

      {/* Routing Table */}
      {!loading && (
        <Card>
          <CardHeader>
            <CardTitle>Routing Configurations ({filteredData.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredData.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                {routingData.length === 0 ? 'No routing entries found' : 'No routing entries match your search'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px]">
                        <span className="font-semibold text-slate-900">Source ID</span>
                      </TableHead>
                      <TableHead className="min-w-[200px]">
                        <span className="font-semibold text-slate-900">Routing ID</span>
                      </TableHead>
                      <TableHead className="hidden sm:table-cell min-w-[180px]">
                        <span className="font-semibold text-slate-900">Initial Segment</span>
                      </TableHead>
                      <TableHead className="hidden md:table-cell min-w-[120px]">
                        <span className="font-semibold text-slate-900">Language</span>
                      </TableHead>
                      <TableHead className="hidden lg:table-cell min-w-[140px]">
                        <span className="font-semibold text-slate-900">Message Store</span>
                      </TableHead>
                      <TableHead className="min-w-[120px]">
                        <span className="font-semibold text-slate-900">Status</span>
                      </TableHead>
                      <TableHead className="min-w-[200px]">
                        <span className="font-semibold text-slate-900">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((route) => (
                      <TableRow key={route.routingTableId}>
                        <TableCell className="font-mono text-sm max-w-[200px] truncate" title={route.sourceId}>
                          {route.sourceId}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="font-medium cursor-help">{route.routingId}</span>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-xs">
                                <div className="space-y-2">
                                  <div>
                                    <p className="text-xs font-semibold mb-1">Routing Table ID:</p>
                                    <div className="flex items-center gap-2">
                                      <code className="text-xs font-mono break-all">{route.routingTableId}</code>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCopyId(route.routingTableId);
                                        }}
                                        aria-label="Copy routing table ID"
                                      >
                                        {copiedId === route.routingTableId ? (
                                          <Check className="h-3 w-3 text-emerald-600" />
                                        ) : (
                                          <Copy className="h-3 w-3" />
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                  {route.languageCode && (
                                    <div>
                                      <p className="text-xs font-semibold mb-1">Language:</p>
                                      <p className="text-xs">{route.languageCode}</p>
                                    </div>
                                  )}
                                  {route.schedulerId && (
                                    <div>
                                      <p className="text-xs font-semibold mb-1">Scheduler ID:</p>
                                      <p className="text-xs">{route.schedulerId}</p>
                                    </div>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <code className="text-xs bg-slate-50 px-2 py-1 rounded">{route.initSegment}</code>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {route.languageCode ? (
                            <Badge variant="outline" className="text-xs">
                              {route.languageCode}
                            </Badge>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {route.messageStoreId ? (
                            <Badge
                              variant="secondary"
                              className="cursor-pointer hover:bg-indigo-100"
                              onClick={() => navigate(`/messages?messageStoreId=${route.messageStoreId}`)}
                              title={`Open message store ${route.messageStoreId}`}
                            >
                              <MessageSquare className="h-3 w-3 mr-1" />
                              {route.messageStoreId}
                            </Badge>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={route.isActive ? 'default' : 'secondary'}
                            className={
                              route.isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }
                          >
                            {route.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 sm:gap-2">
                            {route.messageStoreId && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                    aria-label={`Open message store ${route.messageStoreId}`}
                                    onClick={() => {
                                      navigate(`/messages?messageStoreId=${route.messageStoreId}`);
                                    }}
                                  >
                                    <MessageSquare className="h-4 w-4" />
                                    <span className="sr-only">Open message store {route.messageStoreId}</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Open Message Store</TooltipContent>
                              </Tooltip>
                            )}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  aria-label={`View segments for routing ${route.routingId}`}
                                  onClick={() => {
                                    navigate(`/segments?routingId=${route.routingId}`);
                                  }}
                                >
                                  <Box className="h-4 w-4" />
                                  <span className="sr-only">View segments for {route.routingId}</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View Segments</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  aria-label={`Edit routing entry ${route.routingId}`}
                                  onClick={() => {
                                    setEditingEntry(route);
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                  <span className="sr-only">Edit routing entry {route.routingId}</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit Entry</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="h-8 w-8 p-0"
                                  aria-label={`Open flow designer for ${route.routingId}`}
                                  onClick={() => {
                                    const params = new URLSearchParams();
                                    if (route.sourceId) {
                                      params.set('sourceId', route.sourceId);
                                    }
                                    if (route.companyProjectId) {
                                      params.set('companyProjectId', route.companyProjectId.toString());
                                    }
                                    const queryString = params.toString();
                                    const url = `/designer/${route.routingId}${queryString ? `?${queryString}` : ''}`;
                                    navigate(url);
                                  }}
                                >
                                  <Workflow className="h-4 w-4" />
                                  <span className="sr-only">Open flow designer for {route.routingId}</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Open Flow Designer</TooltipContent>
                            </Tooltip>
                            {permissions.canDelete && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    aria-label={`Delete routing entry ${route.routingId}`}
                                    onClick={() => {
                                      setDeletingEntry(route);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Delete routing entry {route.routingId}</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete Entry</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl text-slate-900">{routingData.length}</div>
              <p className="text-sm text-slate-600 mt-1">Total Routing Entries</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl text-slate-900">
                {routingData.filter((r) => r.isActive).length}
              </div>
              <p className="text-sm text-slate-600 mt-1">Active Routes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl text-slate-900">
                {routingData.filter((r) => r.messageStoreId).length}
              </div>
              <p className="text-sm text-slate-600 mt-1">With Message Store</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Routing Entry Dialog */}
      {editingEntry && (
        <EditRoutingEntryDialog
          routingEntry={editingEntry}
          open={!!editingEntry}
          onOpenChange={(open) => {
            if (!open) setEditingEntry(null);
          }}
          onSuccess={() => {
            // Invalidate and refetch routing entries
            queryClient.invalidateQueries({ queryKey: ['routing-entries'] });
          }}
        />
      )}

      {/* Delete Routing Entry Impact Dialog */}
      {deletingEntry && (
        <RoutingEntryImpactDialog
          open={!!deletingEntry}
          onOpenChange={(open) => {
            if (!open) setDeletingEntry(null);
          }}
          routingTableId={deletingEntry.routingTableId}
          sourceId={deletingEntry.sourceId}
          routingId={deletingEntry.routingId}
          onDeleteConfirm={handleDeleteConfirm}
        />
      )}

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        moduleType="routing"
        title="Routing Entries"
      />
    </div>
  );
}

