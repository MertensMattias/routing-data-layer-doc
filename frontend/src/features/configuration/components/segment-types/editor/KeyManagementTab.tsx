import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Pencil, Trash2, Info } from 'lucide-react';
import { toast } from 'sonner';
import type { SegmentType, KeyResponse, KeyConfig, KeyType } from '@/api/types';
import {
  deleteSegmentTypeKey,
  listKeyTypes,
} from '@/services/configuration';
import { getApiErrorMessage } from '@/api/client';
import { AddKeyDialog } from '../wizard/AddKeyDialog';
import { KeyImpactDialog } from './KeyImpactDialog';

interface KeyManagementTabProps {
  segmentType: SegmentType;
  onSuccess: () => void;
  onClose: () => void;
}

export function KeyManagementTab({ segmentType, onSuccess, onClose }: KeyManagementTabProps) {
  const [keyTypes, setKeyTypes] = useState<KeyType[]>([]);
  const [loadingKeyTypes, setLoadingKeyTypes] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<KeyConfig | null>(null);
  const [impactDialogOpen, setImpactDialogOpen] = useState(false);
  const [impactKeyName, setImpactKeyName] = useState<string | null>(null);

  useEffect(() => {
    loadKeyTypes();
  }, []);

  const loadKeyTypes = async () => {
    try {
      const data = await listKeyTypes();
      setKeyTypes(data);
    } catch (err: unknown) {
      console.error('Failed to load key types:', getApiErrorMessage(err) || 'Unknown error', err);
    } finally {
      setLoadingKeyTypes(false);
    }
  };

  const handleAddKey = () => {
    setEditingKey(null);
    setAddDialogOpen(true);
  };

  const handleEditKey = (key: KeyResponse) => {
    // Convert KeyResponse to KeyConfig for editing
    const keyConfig: KeyConfig = {
      keyName: key.keyName,
      displayName: key.displayName,
      dicTypeId: key.dicTypeId,
      isRequired: key.isRequired,
      defaultValue: key.defaultValue,
      isDisplayed: key.isDisplayed,
      isEditable: key.isEditable,
      isActive: key.isActive,
    };
    setEditingKey(keyConfig);
    setAddDialogOpen(true);
  };

  const handleDeleteKey = (keyName: string) => {
    setImpactKeyName(keyName);
    setImpactDialogOpen(true);
  };

  const handleDeleteConfirm = async (keyName: string) => {
    try {
      await deleteSegmentTypeKey(segmentType.segmentTypeName, keyName);
      toast.success('Key deleted successfully');
      onSuccess();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err) || 'Failed to delete key');
    }
  };

  const handleDialogSuccess = () => {
    setAddDialogOpen(false);
    setEditingKey(null);
    onSuccess();
  };

  const getExistingKeyNames = (): string[] => {
    if (!segmentType.keys) return [];
    return segmentType.keys
      .filter((k) => !editingKey || k.keyName !== editingKey.keyName)
      .map((k) => k.keyName);
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Manage configuration keys for this segment type. Keys define what data can be stored
          with each segment instance.
        </AlertDescription>
      </Alert>

      {/* Add Key Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">
            Keys ({segmentType.keys?.length || 0})
          </h3>
          <p className="text-sm text-muted-foreground">
            Add, edit, or remove configuration keys
          </p>
        </div>
        <Button onClick={handleAddKey} disabled={loadingKeyTypes}>
          <Plus className="mr-2 h-4 w-4" />
          Add Key
        </Button>
      </div>

      {/* Keys Table */}
      {segmentType.keys && segmentType.keys.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key Name</TableHead>
                <TableHead>Display Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-center">Required</TableHead>
                <TableHead className="text-center">Displayed</TableHead>
                <TableHead className="text-center">Editable</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {segmentType.keys.map((key) => (
                <TableRow key={key.dicKeyId}>
                  <TableCell className="font-mono text-sm">{key.keyName}</TableCell>
                  <TableCell>{key.displayName || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {key.typeDisplayName || key.typeName}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {key.isRequired ? (
                      <Badge variant="default">Required</Badge>
                    ) : (
                      <Badge variant="outline">Optional</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {key.isDisplayed ? '✓' : '✗'}
                  </TableCell>
                  <TableCell className="text-center">
                    {key.isEditable ? '✓' : '✗'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={key.isActive ? 'default' : 'secondary'}>
                      {key.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditKey(key)}
                        title="Edit key"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteKey(key.keyName)}
                        title="Delete key"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            No keys defined yet. Click "Add Key" to create configuration keys for this segment type.
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex justify-end pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>

      {/* Add/Edit Key Dialog */}
      <AddKeyDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        keyTypes={keyTypes}
        existingKey={editingKey}
        existingKeyNames={getExistingKeyNames()}
        onSave={handleDialogSuccess}
        segmentTypeName={segmentType.segmentTypeName}
      />

      {/* Key Impact Dialog */}
      {impactKeyName && (
        <KeyImpactDialog
          open={impactDialogOpen}
          onOpenChange={setImpactDialogOpen}
          segmentTypeName={segmentType.segmentTypeName}
          keyName={impactKeyName}
          onDeleteConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}

