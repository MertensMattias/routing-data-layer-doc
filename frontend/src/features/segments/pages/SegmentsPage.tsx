import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Edit, Trash2, Eye, Settings, Loader2, RefreshCw } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreateSegmentDialog, ViewSegmentDialog, EditSegmentDialog } from '@/features/segments/components';
import { useCompanyProjectContext } from '@/contexts/CompanyProjectContext';
import { listRoutingEntries } from '@/services/routing';
import {
  listSegments,
  searchSegments,
  deleteSegment,
} from '@/services/segments/segments.service';
import apiClient from '@/api/client';
import type { Segment } from '@/api/types';
import { getApiErrorMessage } from '@/api/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function SegmentsPage() {
  const { selectedCompanyProjectId } = useCompanyProjectContext();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All Types');
  const [selectedRoutingId, setSelectedRoutingId] = useState<string | null>(null);
  const [viewSegmentId, setViewSegmentId] = useState<string | null>(null);
  const [editSegmentId, setEditSegmentId] = useState<string | null>(null);
  const [deleteSegmentId, setDeleteSegmentId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch segment types from Dic_SegmentType via API (same as SegmentTypeTab)
  const { data: segmentTypesData = [] } = useQuery({
    queryKey: ['segmentTypes'],
    queryFn: async () => {
      try {
        // Backend returns segmentTypeName
        const response = await apiClient.get<Array<{ segmentTypeName: string; isActive: boolean }>>('/segments/types/all');
        return response.data
          .filter((st) => st.isActive) // Only active types
          .map((st) => st.segmentTypeName)
          .sort();
      } catch (error) {
        console.error('Failed to load segment types:', error);
        return [];
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Load routing entries using TanStack Query
  const { data: routingEntries = [] } = useQuery({
    queryKey: ['routing-entries', selectedCompanyProjectId],
    queryFn: async () => {
      const projectId = selectedCompanyProjectId ?? undefined;
      return await listRoutingEntries(undefined, projectId);
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Reset selected routing and invalidate queries when project changes
  useEffect(() => {
    // Clear selected routing when project changes to avoid showing segments from wrong project
    setSelectedRoutingId(null);
    setSearchQuery('');
    setSelectedType('All Types');

    // Invalidate segments query to force refetch with new project scope
    queryClient.invalidateQueries({ queryKey: ['segments'] });
  }, [selectedCompanyProjectId, queryClient]);

  // Invalidate and refetch segments when routing changes
  useEffect(() => {
    if (selectedRoutingId) {
      // Invalidate segments query to force refetch with new routing
      queryClient.invalidateQueries({ queryKey: ['segments', selectedRoutingId] });
    }
  }, [selectedRoutingId, queryClient]);

  // Handle URL parameter for auto-selecting routing
  useEffect(() => {
    const urlRoutingId = searchParams.get('routingId');
    if (urlRoutingId && routingEntries.length > 0) {
      const routingExists = routingEntries.find((r) => r.routingId === urlRoutingId);
      if (routingExists) {
        setSelectedRoutingId(urlRoutingId);
        setSearchParams({});
      } else {
        toast.error(`Routing ${urlRoutingId} not found`);
      }
    }
  }, [routingEntries, searchParams, setSearchParams]);

  // Fetch segments based on selected routing
  const {
    data: segments = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Segment[]>({
    queryKey: ['segments', selectedRoutingId, selectedCompanyProjectId],
    queryFn: async () => {
      if (selectedRoutingId) {
        return listSegments(selectedRoutingId);
      } else {
        // Use search endpoint when no routing selected
        // Note: searchSegments respects customer scope but doesn't filter by project directly
        // The backend filters by customer scope from the user's Okta groups
        const result = await searchSegments({ routingId: undefined, q: searchQuery || undefined });
        return result.data || [];
      }
    },
    enabled: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    // Optional: Background polling at 5 minute interval
    refetchInterval: 300000,
    refetchIntervalInBackground: false,
  });

  const handleManualRefresh = () => {
    refetch();
    toast.info('Refreshing segments...');
  };

  // Build available segment types list (from API + loaded segments as fallback)
  const typesFromAPI = segmentTypesData || [];
  const typesFromSegments = segments
    .map((s) => s.segmentTypeName)
    .filter((name): name is string => !!name);
  const uniqueTypes = new Set([...typesFromAPI, ...typesFromSegments]);
  uniqueTypes.delete('All Types'); // Remove if exists, we'll add it explicitly
  const availableSegmentTypes = ['All Types', ...Array.from(uniqueTypes).sort()];

  const filteredData = segments.filter((segment) => {
    // Type filter
    const matchesType = selectedType === 'All Types' || segment.segmentTypeName === selectedType;

    // Search filter - search across multiple fields
    if (searchQuery === '') {
      return matchesType;
    }

    const query = searchQuery.toLowerCase();
    const searchableFields = [
      segment.segmentName?.toLowerCase() || '',
      segment.segmentId?.toLowerCase() || '',
      segment.segmentTypeName?.toLowerCase() || '',
      segment.displayName?.toLowerCase() || '',
      segment.routingId?.toLowerCase() || '',
      segment.createdBy?.toLowerCase() || '',
      segment.updatedBy?.toLowerCase() || '',
    ];

    const matchesSearch = searchableFields.some((field) => field.includes(query));

    return matchesType && matchesSearch;
  });

  const handleDelete = async () => {
    if (!deleteSegmentId) return;

    try {
      setIsDeleting(true);
      await deleteSegment(deleteSegmentId);
      toast.success('Segment deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['segments'] });
      setDeleteSegmentId(null);
    } catch (error: unknown) {
      toast.error('Failed to delete segment: ' + getApiErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl text-slate-900 mb-2">Segments</h1>
          <p className="text-sm sm:text-base text-slate-600">Manage IVR segments, types, and configurations</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to="/segments/settings">
            <Button variant="outline" className="hidden sm:inline-flex">
              <Settings className="w-4 h-4 mr-2" />
              Segment Settings
            </Button>
          </Link>
          <CreateSegmentDialog defaultRoutingId={selectedRoutingId} />
        </div>
      </div>

      {/* Routing Selection and Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="w-full sm:w-64">
              <Select
                value={selectedRoutingId || 'all'}
                onValueChange={(value) => setSelectedRoutingId(value === 'all' ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select routing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Routings</SelectItem>
                  {routingEntries.map((routing) => (
                    <SelectItem key={routing.routingTableId} value={routing.routingId}>
                      {routing.routingId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search segments by ID or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <div className="w-full sm:w-48">
                <Select
                  value={selectedType}
                  onValueChange={(value) => setSelectedType(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSegmentTypes
                      .filter((type): type is string => !!type && typeof type === 'string')
                      .map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleManualRefresh}
                title="Refresh"
                aria-label="Refresh segments"
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4" />
                <span className="sr-only">Refresh segments</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-4 rounded">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Failed to load segments</p>
              <p className="text-xs mt-1">{getApiErrorMessage(error)}</p>
              <p className="text-xs mt-1 text-slate-600">
                Backend may be offline. Retrying automatically...
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
      {isLoading && (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mx-auto" />
          <p className="text-slate-600 mt-2">Loading segments...</p>
        </div>
      )}

      {/* Segments Table */}
      {!isLoading && (
        <Card>
          <CardHeader>
            <CardTitle>Segment Configurations ({filteredData.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredData.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                {selectedRoutingId
                  ? 'No segments found for this routing.'
                  : 'No segments found. Select a routing or create a new segment.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="hidden sm:table-cell">routingId</TableHead>
                      <TableHead>segmentName</TableHead>
                      <TableHead className="hidden md:table-cell">Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>
                        Actions
                        <span className="sr-only">Available actions for segment</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((segment) => (
                      <TableRow key={segment.segmentId}>
                        <TableCell className="hidden sm:table-cell text-sm text-slate-600">
                          {segment.routingId}
                        </TableCell>
                        <TableCell className="font-medium">{segment.segmentName}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline">{segment.segmentTypeName || 'Unknown'}</Badge>
                        </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            segment.isActive
                              ? 'bg-emerald-50/50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {segment.isActive ? 'Active' : 'Inactive'}
                        </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 sm:gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        title="View Details"
                        aria-label={`View details for segment ${segment.segmentName}`}
                        onClick={() => setViewSegmentId(segment.segmentId)}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View details for {segment.segmentName}</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        title="Edit Segment"
                        aria-label={`Edit segment ${segment.segmentName}`}
                        onClick={() => setEditSegmentId(segment.segmentId)}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit segment {segment.segmentName}</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        title="Delete Segment"
                        aria-label={`Delete segment ${segment.segmentName}`}
                        onClick={() => setDeleteSegmentId(segment.segmentId)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete segment {segment.segmentName}</span>
                      </Button>
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

      {/* Segment Type Overview */}
      {!isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl text-slate-900">{segments.length}</div>
              <p className="text-sm text-slate-600 mt-1">Total Segments</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl text-slate-900">
                {segments.filter((s) => s.segmentTypeName === 'menu').length}
              </div>
              <p className="text-sm text-slate-600 mt-1">Menu Segments</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl text-slate-900">
                {segments.filter((s) => s.isActive).length}
              </div>
              <p className="text-sm text-slate-600 mt-1">Active Segments</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl text-slate-900">
                {segments.filter((s) => s.changeSetId !== null && s.changeSetId !== undefined).length}
              </div>
              <p className="text-sm text-slate-600 mt-1">Draft Segments</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Segment Dialog */}
      <ViewSegmentDialog
        segmentId={viewSegmentId}
        open={!!viewSegmentId}
        onOpenChange={(open) => !open && setViewSegmentId(null)}
      />

      {/* Edit Segment Dialog */}
      <EditSegmentDialog
        segmentId={editSegmentId}
        open={!!editSegmentId}
        onOpenChange={(open) => !open && setEditSegmentId(null)}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteSegmentId} onOpenChange={(open) => !open && setDeleteSegmentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Segment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this segment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

