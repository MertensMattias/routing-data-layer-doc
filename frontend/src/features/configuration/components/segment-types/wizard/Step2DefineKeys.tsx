import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Pencil, Trash2, Info, AlertCircle } from 'lucide-react';
import { AddKeyDialog } from './AddKeyDialog';
import type { KeyConfig, KeyType } from '@/api/types';
import type { WizardFormData } from '../SegmentTypeWizard';
import { listKeyTypes } from '@/services/configuration';

interface Step2DefineKeysProps {
  formData: WizardFormData;
  onNext: (keys: KeyConfig[]) => void;
  onBack: () => void;
}

export function Step2DefineKeys({ formData, onNext, onBack }: Step2DefineKeysProps) {
  const [keys, setKeys] = useState<KeyConfig[]>(formData.keys);
  const [keyTypes, setKeyTypes] = useState<KeyType[]>([]);
  const [loadingKeyTypes, setLoadingKeyTypes] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<KeyConfig | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    loadKeyTypes();
  }, []);

  const loadKeyTypes = async () => {
    try {
      const data = await listKeyTypes();
      setKeyTypes(data);
    } catch (err) {
      console.error('Failed to load key types:', err);
    } finally {
      setLoadingKeyTypes(false);
    }
  };

  const handleAddKey = (key: KeyConfig) => {
    if (editingIndex !== null) {
      // Update existing key
      const updatedKeys = [...keys];
      updatedKeys[editingIndex] = key;
      setKeys(updatedKeys);
      setEditingIndex(null);
    } else {
      // Add new key
      setKeys([...keys, key]);
    }
    setEditingKey(null);
    setAddDialogOpen(false);
  };

  const handleEditKey = (index: number) => {
    setEditingKey(keys[index]);
    setEditingIndex(index);
    setAddDialogOpen(true);
  };

  const handleDeleteKey = (index: number) => {
    setKeys(keys.filter((_, i) => i !== index));
  };

  const handleOpenAddDialog = () => {
    setEditingKey(null);
    setEditingIndex(null);
    setAddDialogOpen(true);
  };

  const handleNext = () => {
    onNext(keys);
  };

  const getKeyTypeName = (dicTypeId: number): string => {
    return keyTypes.find((kt) => kt.dicTypeId === dicTypeId)?.typeName || 'Unknown';
  };

  return (
    <div className="space-y-6">
      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Define configuration keys for segments of this type. Keys determine what data can be
          stored with each segment instance.
        </AlertDescription>
      </Alert>

      {/* Add Key Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Keys ({keys.length})</h3>
          <p className="text-sm text-muted-foreground">
            Add at least one key to configure segment behavior
          </p>
        </div>
        <Button onClick={handleOpenAddDialog} disabled={loadingKeyTypes}>
          <Plus className="mr-2 h-4 w-4" />
          Add Key
        </Button>
      </div>

      {/* Keys Table */}
      {keys.length > 0 ? (
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((key, index) => (
                <TableRow key={index}>
                  <TableCell className="font-mono text-sm">{key.keyName}</TableCell>
                  <TableCell>{key.displayName || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{getKeyTypeName(key.dicTypeId)}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {key.isRequired ? (
                      <Badge variant="default">Required</Badge>
                    ) : (
                      <Badge variant="outline">Optional</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {key.isDisplayed !== false ? '✓' : '✗'}
                  </TableCell>
                  <TableCell className="text-center">
                    {key.isEditable !== false ? '✓' : '✗'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditKey(index)}
                        title="Edit key"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteKey(index)}
                        title="Remove key"
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
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No keys defined yet. Click "Add Key" to create configuration keys for this segment type.
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleNext} disabled={keys.length === 0}>
          Next: Review
        </Button>
      </div>

      {/* Add/Edit Key Dialog */}
      <AddKeyDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        keyTypes={keyTypes}
        existingKey={editingKey}
        existingKeyNames={keys.map((k) => k.keyName).filter((_, i) => i !== editingIndex)}
        onSave={handleAddKey}
      />
    </div>
  );
}
