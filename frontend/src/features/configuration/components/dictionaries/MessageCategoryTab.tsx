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
import type { MessageCategory } from '@/api/types';
import {
  listMessageCategories,
  deleteMessageCategory,
} from '@/services/configuration';
import { getApiErrorMessage } from '@/api/client';
import { MessageCategoryDialog } from './MessageCategoryDialog';
import { MessageCategoryImpactDialog } from './MessageCategoryImpactDialog';

// Helper function to normalize icon display
// Converts text-based icon names to emojis and ensures consistent rendering
const normalizeIcon = (icon: string | undefined | null): string | null => {
  if (!icon) return null;

  // Map common text-based icon names to emojis
  const iconMap: Record<string, string> = {
    // Communication
    'hand-wave': '👋',
    'phone': '📞',
    'email': '✉️',
    'bell': '🔔',
    'warning': '⚠️',
    'check': '✅',
    'cross': '❌',
    'clipboard': '📋',
    'chat': '💬',
    'target': '🎯',
    'star': '⭐',
    'fire': '🔥',
    'lightbulb': '💡',
    'pin': '📌',
    'tag': '🏷️',
    'chart': '📊',
    // Voice & TTS
    'voice': '🗣️',
    'tts': '🎤',
    'microphone': '🎙️',
    'speaker': '🔊',
    'sound': '🔉',
    'audio': '🎵',
    'volume': '🔊',
    'speech': '🗣️',
    // Phone & IVR
    'ivr': '📱',
    'mobile': '📱',
    'telephone': '☎️',
    'call': '📞',
    'incoming': '📲',
    'outgoing': '📞',
    // Services
    'service': '🛎️',
    'support': '🛎️',
    'office': '🏢',
    'building': '🏛️',
    'store': '🏪',
    'hospital': '🏥',
    // Disconnect & End
    'disconnect': '📴',
    'end': '🔚',
    'stop': '⏹️',
    'pause': '⏸️',
    'block': '🚫',
    'forbidden': '⛔',
    'hangup': '📴',
    // Routing
    'route': '🧭',
    'navigation': '🗺️',
    'redirect': '↪️',
    'transfer': '🔄',
  };

  // Check if it's a text-based icon name
  const normalized = iconMap[icon.toLowerCase()];
  if (normalized) {
    return normalized;
  }

  // Return as-is if it's already an emoji or custom icon
  return icon;
};

export function MessageCategoryTab() {
  const [categories, setCategories] = useState<MessageCategory[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<MessageCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MessageCategory | null>(null);
  const [impactDialogOpen, setImpactDialogOpen] = useState(false);
  const [impactCategoryCode, setImpactCategoryCode] = useState<string | null>(null);

  // Apply filters
  const applyFilters = useCallback((categoryList: MessageCategory[]) => {
    let filtered = [...categoryList];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (cat) =>
          cat.code.toLowerCase().includes(term) ||
          cat.displayName.toLowerCase().includes(term) ||
          (cat.description && cat.description.toLowerCase().includes(term))
      );
    }

    setFilteredCategories(filtered);
  }, [searchTerm]);

  // Load categories
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listMessageCategories(showInactive);
      setCategories(data);
      applyFilters(data);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err) || 'Failed to load message categories');
      toast.error('Failed to load message categories');
    } finally {
      setLoading(false);
    }
  }, [showInactive, applyFilters]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    applyFilters(categories);
  }, [applyFilters, categories]);

  const handleCreate = () => {
    setEditingCategory(null);
    setDialogOpen(true);
  };

  const handleEdit = (category: MessageCategory) => {
    setEditingCategory(category);
    setDialogOpen(true);
  };

  const handleDelete = async (code: string) => {
    setImpactCategoryCode(code);
    setImpactDialogOpen(true);
  };

  const handleDeleteConfirm = async (code: string) => {
    try {
      await deleteMessageCategory(code);
      toast.success('Message category deactivated successfully');
      loadCategories();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err) || 'Failed to delete category');
    }
  };

  const handleViewImpact = (code: string) => {
    setImpactCategoryCode(code);
    setImpactDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    setDialogOpen(false);
    setEditingCategory(null);
    loadCategories();
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
          <CardTitle>Message Category Management</CardTitle>
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
          <CardTitle>Message Category Management</CardTitle>
          <CardDescription>
            Manage message categories. Categories are used to organize messages in the message store.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters Toolbar */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
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
              Add Category
            </Button>
          </div>

          {/* Categories Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Icon</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead className="text-center">Sort Order</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No categories found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map((category) => (
                    <TableRow
                      key={category.categoryId}
                      onDoubleClick={() => handleEdit(category)}
                      className="cursor-pointer"
                    >
                      <TableCell className="text-sm font-medium text-gray-900">{category.code}</TableCell>
                      <TableCell className="text-sm font-medium text-gray-900">{category.displayName}</TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-gray-600">
                        {category.description || '-'}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const normalizedIcon = normalizeIcon(category.icon);
                          return normalizedIcon ? (
                            <span
                              className="text-base inline-flex items-center justify-center w-5 h-5"
                              title={category.icon}
                            >
                              {normalizedIcon}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        {category.color ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded border border-gray-300"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="text-xs font-mono text-gray-600">{category.color}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center text-sm text-gray-600">{category.sortOrder}</TableCell>
                      <TableCell className="text-center">
                        {category.isActive ? (
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
                            onClick={() => handleEdit(category)}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewImpact(category.code)}
                            title="View Impact"
                          >
                            <BarChart3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(category.code)}
                            title="Delete"
                            disabled={!category.isActive}
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
      <MessageCategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editingCategory}
        onSuccess={handleDialogSuccess}
      />

      {impactCategoryCode && (
        <MessageCategoryImpactDialog
          open={impactDialogOpen}
          onOpenChange={setImpactDialogOpen}
          categoryCode={impactCategoryCode}
          onDelete={handleDeleteConfirm}
        />
      )}
    </>
  );
}

