import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Pencil, Trash2, BarChart3, Search, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { Language } from '@/api/types';
import { listLanguages, deleteLanguage } from '@/services/configuration';
import { getApiErrorMessage } from '@/api/client';
import { LanguageDialog } from './LanguageDialog';
import { ImpactAnalysisDialog } from '../segment-types/ImpactAnalysisDialog';
import { LoadingSkeleton, ErrorState, EmptyState } from '@/components/common';

export function LanguageTab() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);
  const [impactDialogOpen, setImpactDialogOpen] = useState(false);
  const [impactLanguageCode, setImpactLanguageCode] = useState<string | null>(null);

  // Load languages using TanStack Query
  const {
    data: languages = [],
    isLoading,
    error,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ['languages', showInactive],
    queryFn: () => listLanguages(showInactive),
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  // Delete mutation with cache invalidation
  const deleteMutation = useMutation({
    mutationFn: (code: string) => deleteLanguage(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['languages'] });
      toast.success('Language deactivated successfully');
    },
    onError: (error: unknown) => {
      toast.error('Failed to delete language: ' + getApiErrorMessage(error));
    },
  });

  // Filter languages based on search term (client-side)
  const filteredLanguages = useMemo(() => {
    if (!searchTerm.trim()) {
      return languages;
    }

    const term = searchTerm.toLowerCase();
    return languages.filter(
      (lang) =>
        lang.languageCode.toLowerCase().includes(term) ||
        lang.displayName.toLowerCase().includes(term) ||
        lang.nativeName?.toLowerCase().includes(term)
    );
  }, [searchTerm, languages]);

  const handleManualRefresh = () => {
    refetch();
    toast.info('Refreshing languages...');
  };

  // Handle create new language
  const handleCreate = () => {
    setEditingLanguage(null);
    setDialogOpen(true);
  };

  // Handle edit language
  const handleEdit = (language: Language) => {
    setEditingLanguage(language);
    setDialogOpen(true);
  };

  // Handle delete language
  const handleDelete = async (code: string) => {
    // Show impact analysis first
    setImpactLanguageCode(code);
    setImpactDialogOpen(true);
  };

  // Handle delete confirmation from impact dialog
  const handleDeleteConfirm = (code: string) => {
    deleteMutation.mutate(code);
  };

  // Handle view impact analysis
  const handleViewImpact = (code: string) => {
    setImpactLanguageCode(code);
    setImpactDialogOpen(true);
  };

  // Handle dialog success
  const handleDialogSuccess = () => {
    setDialogOpen(false);
    setEditingLanguage(null);
    queryClient.invalidateQueries({ queryKey: ['languages'] });
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Language Management</CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorState error={error} onRetry={() => refetch()} />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Language Management</CardTitle>
              <CardDescription>
                Manage system languages. Languages are used in voices, message stores, and routing
                configurations.
              </CardDescription>
            </div>
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
                disabled={isLoading}
                aria-label="Refresh languages"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search languages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInactive(!showInactive)}
              >
                {showInactive ? 'Hide Inactive' : 'Show Inactive'}
              </Button>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Language
            </Button>
          </div>

          {/* Languages Table */}
          {filteredLanguages.length === 0 ? (
            <EmptyState
              title={
                searchTerm
                  ? 'No languages match your search.'
                  : 'No languages configured yet.'
              }
              action={
                !searchTerm
                  ? {
                      label: 'Add First Language',
                      onClick: handleCreate,
                    }
                  : undefined
              }
            />
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Language Code</TableHead>
                    <TableHead>Display Name</TableHead>
                    <TableHead>Native Name</TableHead>
                    <TableHead className="text-center">Sort Order</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLanguages.map((language) => (
                    <TableRow
                      key={language.languageCode}
                      onDoubleClick={() => handleEdit(language)}
                      className="cursor-pointer"
                    >
                      <TableCell className="font-mono">{language.languageCode}</TableCell>
                      <TableCell className="font-medium">{language.displayName}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {language.nativeName || '—'}
                      </TableCell>
                      <TableCell className="text-center">{language.sortOrder}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={language.isActive ? 'default' : 'secondary'}>
                          {language.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewImpact(language.languageCode)}
                            title="View impact analysis"
                          >
                            <BarChart3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(language)}
                            title="Edit language"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(language.languageCode)}
                            title="Delete language"
                            disabled={!language.isActive}
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
          )}

          {/* Results count */}
          <p className="text-sm text-muted-foreground">
            Showing {filteredLanguages.length} of {languages.length} language(s)
          </p>
        </CardContent>
      </Card>

      {/* Language Create/Edit Dialog */}
      <LanguageDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        language={editingLanguage}
        onSuccess={handleDialogSuccess}
      />

      {/* Impact Analysis Dialog */}
      {impactLanguageCode && (
        <ImpactAnalysisDialog
          open={impactDialogOpen}
          onOpenChange={setImpactDialogOpen}
          languageCode={impactLanguageCode}
          onDeleteConfirm={handleDeleteConfirm}
        />
      )}
    </>
  );
}

