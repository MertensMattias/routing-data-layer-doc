import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2, BarChart3, Search, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { KeyType } from '@/api/types';
import { listKeyTypes, deleteKeyType } from '@/services/configuration';
import { getApiErrorMessage } from '@/api/client';
import { KeyTypeDialog } from './KeyTypeDialog';
import { KeyTypeImpactDialog } from './KeyTypeImpactDialog';

export function KeyTypeTab() {
  const [keyTypes, setKeyTypes] = useState<KeyType[]>([]);
  const [filteredTypes, setFilteredTypes] = useState<KeyType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<KeyType | null>(null);
  const [impactDialogOpen, setImpactDialogOpen] = useState(false);
  const [impactTypeName, setImpactTypeName] = useState<string | null>(null);

  // Apply search filter
  const applyFilters = useCallback((typeList: KeyType[]) => {
    let filtered = [...typeList];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (kt) =>
          kt.typeName.toLowerCase().includes(term) ||
          (kt.displayName && kt.displayName.toLowerCase().includes(term)) ||
          (kt.description && kt.description.toLowerCase().includes(term))
      );
    }

    setFilteredTypes(filtered);
  }, [searchTerm]);

  // Load key types
  const loadKeyTypes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listKeyTypes();
      setKeyTypes(data);
      applyFilters(data);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err) || 'Failed to load key types');
      toast.error('Failed to load key types');
    } finally {
      setLoading(false);
    }
  }, [applyFilters]);

  useEffect(() => {
    loadKeyTypes();
  }, [loadKeyTypes]);

  useEffect(() => {
    applyFilters(keyTypes);
  }, [applyFilters, keyTypes]);

  const handleCreate = () => {
    setEditingType(null);
    setDialogOpen(true);
  };

  const handleEdit = (keyType: KeyType) => {
    setEditingType(keyType);
    setDialogOpen(true);
  };

  const handleDelete = (typeName: string) => {
    setImpactTypeName(typeName);
    setImpactDialogOpen(true);
  };

  const handleDeleteConfirm = async (typeName: string) => {
    try {
      await deleteKeyType(typeName);
      toast.success('Key type deleted successfully');
      loadKeyTypes();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err) || 'Failed to delete key type');
    }
  };

  const handleViewImpact = (typeName: string) => {
    setImpactTypeName(typeName);
    setImpactDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    setDialogOpen(false);
    setEditingType(null);
    loadKeyTypes();
  };

  if (loading) {
    return (
      <>
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

        {/* Dialogs */}
        <KeyTypeDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          keyType={editingType}
          onSuccess={handleDialogSuccess}
        />

        {impactTypeName && (
          <KeyTypeImpactDialog
            open={impactDialogOpen}
            onOpenChange={setImpactDialogOpen}
            typeName={impactTypeName}
            onDeleteConfirm={handleDeleteConfirm}
          />
        )}
      </>
    );
  }
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Key Type Management</CardTitle>
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
          <CardTitle>Key Type Management</CardTitle>
          <CardDescription>
            Manage key types that define the data types for segment configuration keys.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Info Banner */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Key types define the data types (string, number, boolean, etc.) that can be used for
              segment configuration keys.
            </AlertDescription>
          </Alert>
          {/* Toolbar */}
          <div className="flex items-center gap-4">
            {/* Search Filter */}
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search key types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Add Button */}
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Key Type
            </Button>
          </div>

        {/* Key Types Table */}
        <div className="rounded-md border">
          <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type Name</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {filteredTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No key types found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTypes.map((keyType) => (
                  <TableRow key={keyType.dicTypeId}>
                    <TableCell className="font-mono text-sm">{keyType.typeName}</TableCell>
                      <TableCell className="font-medium">
                        {keyType.displayName || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {keyType.description || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewImpact(keyType.typeName)}
                            title="View impact"
                          >
                            <BarChart3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(keyType)}
                            title="Edit key type"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(keyType.typeName)}
                            title="Delete key type"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
          Showing {filteredTypes.length} of {keyTypes.length} key types
        </div>
      </CardContent>
    </Card>

    {/* Dialogs */}
    <KeyTypeDialog
      open={dialogOpen}
      onOpenChange={setDialogOpen}
      keyType={editingType}
      onSuccess={handleDialogSuccess}
    />

    {impactTypeName && (
      <KeyTypeImpactDialog
        open={impactDialogOpen}
        onOpenChange={setImpactDialogOpen}
        typeName={impactTypeName}
        onDeleteConfirm={handleDeleteConfirm}
      />
    )}
  </>
  );
}

