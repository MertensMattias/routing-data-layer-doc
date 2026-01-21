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
import { Plus, Pencil, Trash2, BarChart3, Search, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { MessageType } from '@/api/types';
import {
  listMessageTypes,
  deleteMessageType,
} from '@/services/configuration';
import { getApiErrorMessage } from '@/api/client';
import { MessageTypeDialog } from './MessageTypeDialog';
import { MessageTypeImpactDialog } from './MessageTypeImpactDialog';

export function MessageTypeTab() {
  const [types, setTypes] = useState<MessageType[]>([]);
  const [filteredTypes, setFilteredTypes] = useState<MessageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<MessageType | null>(null);
  const [impactDialogOpen, setImpactDialogOpen] = useState(false);
  const [impactTypeCode, setImpactTypeCode] = useState<string | null>(null);

  // Apply filters
  const applyFilters = useCallback((typeList: MessageType[]) => {
    let filtered = [...typeList];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (type) =>
          type.code.toLowerCase().includes(term) ||
          type.displayName.toLowerCase().includes(term) ||
          (type.description && type.description.toLowerCase().includes(term))
      );
    }

    setFilteredTypes(filtered);
  }, [searchTerm]);

  // Load types
  const loadTypes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listMessageTypes(showInactive);
      setTypes(data);
      applyFilters(data);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err) || 'Failed to load message types');
      toast.error('Failed to load message types');
    } finally {
      setLoading(false);
    }
  }, [showInactive, applyFilters]);

  useEffect(() => {
    loadTypes();
  }, [loadTypes]);

  useEffect(() => {
    applyFilters(types);
  }, [applyFilters, types]);

  const handleCreate = () => {
    setEditingType(null);
    setDialogOpen(true);
  };

  const handleEdit = (type: MessageType) => {
    setEditingType(type);
    setDialogOpen(true);
  };

  const handleDelete = async (code: string) => {
    setImpactTypeCode(code);
    setImpactDialogOpen(true);
  };

  const handleDeleteConfirm = async (code: string) => {
    try {
      await deleteMessageType(code);
      toast.success('Message type deactivated successfully');
      loadTypes();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err) || 'Failed to delete type');
    }
  };

  const handleViewImpact = (code: string) => {
    setImpactTypeCode(code);
    setImpactDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    setDialogOpen(false);
    setEditingType(null);
    loadTypes();
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
          <CardTitle>Message Type Management</CardTitle>
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
          <CardTitle>Message Type Management</CardTitle>
          <CardDescription>
            Manage message types with settings schemas and default configurations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters Toolbar */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

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
              <Plus className="mr-2 h-4 w-4" />
              Add Type
            </Button>
          </div>

          {/* Types Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Sort Order</TableHead>
                  <TableHead className="text-center">Has Schema</TableHead>
                  <TableHead className="text-center">Has Defaults</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTypes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No types found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTypes.map((type) => (
                    <TableRow
                      key={type.messageTypeId}
                      onDoubleClick={() => handleEdit(type)}
                      className="cursor-pointer"
                    >
                      <TableCell className="text-sm font-medium text-gray-900">{type.code}</TableCell>
                      <TableCell className="text-sm font-medium text-gray-900">{type.displayName}</TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-gray-600">
                        {type.description || '-'}
                      </TableCell>
                      <TableCell className="text-center text-sm text-gray-600">{type.sortOrder}</TableCell>
                      <TableCell className="text-center">
                        {type.settingsSchema ? (
                          <Badge variant="outline">Yes</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {type.defaultSettings ? (
                          <Badge variant="outline">Yes</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {type.isActive ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(type)}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewImpact(type.code)}
                            title="View Impact"
                          >
                            <BarChart3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(type.code)}
                            title="Delete"
                            disabled={!type.isActive}
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
        </CardContent>
      </Card>

      {/* Dialogs */}
      <MessageTypeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        messageType={editingType}
        onSuccess={handleDialogSuccess}
      />

      {impactTypeCode && (
        <MessageTypeImpactDialog
          open={impactDialogOpen}
          onOpenChange={setImpactDialogOpen}
          typeCode={impactTypeCode}
          onDelete={handleDeleteConfirm}
        />
      )}
    </>
  );
}

