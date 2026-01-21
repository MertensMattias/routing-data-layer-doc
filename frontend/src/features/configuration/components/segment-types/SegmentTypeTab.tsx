import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Trash2, BarChart3, Search, AlertCircle, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import type { SegmentType } from '@/api/types';
import { SegmentCategory } from '@/api/types';
import {
  listSegmentTypes,
  deleteSegmentType,
} from '@/services/configuration';
import { getApiErrorMessage } from '@/api/client';
import { SegmentTypeWizard } from './SegmentTypeWizard';
import { SegmentTypeEditor } from './SegmentTypeEditor';
import { SegmentTypeImpactDialog } from './SegmentTypeImpactDialog';

export function SegmentTypeTab() {
  const [segmentTypes, setSegmentTypes] = useState<SegmentType[]>([]);
  const [filteredTypes, setFilteredTypes] = useState<SegmentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [terminalFilter, setTerminalFilter] = useState<string>('all');

  // Dialog states
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingType, setEditingType] = useState<SegmentType | null>(null);
  const [impactDialogOpen, setImpactDialogOpen] = useState(false);
  const [impactTypeName, setImpactTypeName] = useState<string | null>(null);

  // Apply filters function
  const applyFilters = useCallback((typeList: SegmentType[]) => {
    let filtered = [...typeList];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (type) =>
          type.segmentTypeName.toLowerCase().includes(term) ||
          (type.displayName && type.displayName.toLowerCase().includes(term)) ||
          (type.description && type.description.toLowerCase().includes(term))
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((type) => type.category === categoryFilter);
    }

    // Terminal filter
    if (terminalFilter === 'terminal') {
      filtered = filtered.filter((type) => type.isTerminal);
    } else if (terminalFilter === 'non-terminal') {
      filtered = filtered.filter((type) => !type.isTerminal);
    }

    setFilteredTypes(filtered);
  }, [searchTerm, categoryFilter, terminalFilter]);

  // Load segment types
  const loadSegmentTypes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listSegmentTypes(showInactive);
      setSegmentTypes(data);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err) || 'Failed to load segment types');
      toast.error('Failed to load segment types');
    } finally {
      setLoading(false);
    }
  }, [showInactive]);

  // Load segment types when showInactive changes
  useEffect(() => {
    loadSegmentTypes();
  }, [loadSegmentTypes]);

  // Apply filters whenever segmentTypes or any filter state changes
  useEffect(() => {
    applyFilters(segmentTypes);
  }, [segmentTypes, searchTerm, categoryFilter, terminalFilter, applyFilters]);

  const handleCreate = () => {
    setWizardOpen(true);
  };

  const handleEdit = (type: SegmentType) => {
    setEditingType(type);
    setEditorOpen(true);
  };

  const handleDelete = async (segmentTypeName: string) => {
    setImpactTypeName(segmentTypeName);
    setImpactDialogOpen(true);
  };

  const handleDeleteConfirm = async (segmentTypeName: string) => {
    try {
      await deleteSegmentType(segmentTypeName);
      toast.success('Segment type deactivated successfully');
      loadSegmentTypes();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err) || 'Failed to delete segment type');
    }
  };

  const handleViewImpact = (segmentTypeName: string) => {
    setImpactTypeName(segmentTypeName);
    setImpactDialogOpen(true);
  };

  const handleWizardSuccess = () => {
    setWizardOpen(false);
    loadSegmentTypes();
  };

  const handleEditorSuccess = () => {
    setEditorOpen(false);
    setEditingType(null);
    loadSegmentTypes();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Segment Type Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Segment Type Management</CardTitle>
          <CardDescription>
            Manage segment types with keys. Use the wizard to create new segment types with
            configuration keys.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters Toolbar */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search segment types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                <SelectItem value={SegmentCategory.SYSTEM}>System</SelectItem>
                <SelectItem value={SegmentCategory.INTERACTIVE}>Interactive</SelectItem>
                <SelectItem value={SegmentCategory.API}>API</SelectItem>
                <SelectItem value={SegmentCategory.TERMINAL}>Terminal</SelectItem>
                <SelectItem value={SegmentCategory.NAVIGATION}>Navigation</SelectItem>
              </SelectContent>
            </Select>

            {/* Terminal Filter */}
            <Select value={terminalFilter} onValueChange={setTerminalFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="terminal">Terminal only</SelectItem>
                <SelectItem value="non-terminal">Non-terminal only</SelectItem>
              </SelectContent>
            </Select>

            {/* Show Inactive Toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                id="show-inactive"
                checked={showInactive}
                onCheckedChange={setShowInactive}
              />
              <Label htmlFor="show-inactive">Show inactive</Label>
            </div>

            {/* Add Button */}
            <Button onClick={handleCreate} className="ml-auto">
              <Wand2 className="mr-2 h-4 w-4" />
              Create with Wizard
            </Button>
          </div>

          {/* Segment Types Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">Keys</TableHead>
                  <TableHead className="text-center">Terminal</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTypes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No segment types found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTypes.map((segmentType) => (
                    <TableRow key={segmentType.dicSegmentTypeId}>
                      <TableCell className="font-mono text-sm">
                        {segmentType.segmentTypeName}
                      </TableCell>
                      <TableCell className="font-medium">
                        {segmentType.displayName || '-'}
                      </TableCell>
                      <TableCell>
                        {segmentType.category ? (
                          <Badge variant="outline" className="capitalize">
                            {segmentType.category}
                          </Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          {segmentType.keys?.length || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {segmentType.isTerminal ? (
                          <Badge variant="default">Terminal</Badge>
                        ) : (
                          <Badge variant="outline">Flow</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={segmentType.isActive ? 'default' : 'secondary'}>
                          {segmentType.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewImpact(segmentType.segmentTypeName)}
                            title="View impact"
                          >
                            <BarChart3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(segmentType)}
                            title="Edit segment type"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {segmentType.isActive && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(segmentType.segmentTypeName)}
                              title="Deactivate segment type"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Summary */}
          <div className="text-sm text-muted-foreground">
            Showing {filteredTypes.length} of {segmentTypes.length} segment types
          </div>
        </CardContent>
      </Card>

      {/* Wizards and Dialogs */}
      <SegmentTypeWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onSuccess={handleWizardSuccess}
      />

      {editingType && (
        <SegmentTypeEditor
          open={editorOpen}
          onOpenChange={setEditorOpen}
          segmentType={editingType}
          onSuccess={handleEditorSuccess}
        />
      )}

      {impactTypeName && (
        <SegmentTypeImpactDialog
          open={impactDialogOpen}
          onOpenChange={setImpactDialogOpen}
          segmentTypeName={impactTypeName}
          onDeleteConfirm={handleDeleteConfirm}
        />
      )}
    </>
  );
}

