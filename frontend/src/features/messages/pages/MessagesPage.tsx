import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Settings, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDomainPermissions } from '@/hooks/useDomainPermissions';
import { Domain } from '@shared/types/roles';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CreateMessageDialog } from '@/features/messages/components/CreateMessageDialog';
import { MessageStoreSelector } from '@/features/messages/components/MessageStoreSelector';
import { MessageStoreList } from '@/features/messages/components/MessageStoreList';
import { MessageExportDialog } from '@/features/messages/components/MessageExportDialog';
import { MessageKeyRow } from '@/features/messages/components/MessageKeyRow';
import { ImportDialog, ErrorState, EmptyState, LoadingSkeleton } from '@/components/common';
import { MessageImportPreview, type MessageImportPreviewData } from '@/features/messages/components/MessageImportPreview';
import { UnifiedEditDialog } from '@/features/messages/components/UnifiedEditDialog';
import { useCompanyProjectContext } from '@/contexts/CompanyProjectContext';
import { Inbox } from 'lucide-react';
import { ExportImportService } from '@/services/shared';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/api/client';
import { listMessageStores, getMessageStore } from '@/services/messages/message-stores.service';
import { listMessageKeys } from '@/services/messages/message-keys.service';
import { convertMessageKeysToGroups, filterMessageKeyGroups } from '../utils/message-grouping';


export function MessagesPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const permissions = useDomainPermissions({
    roles: user?.roles,
    domain: Domain.MESSAGE_STORE,
  });
  const { selectedCompanyProjectId } = useCompanyProjectContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importPreviewOpen, setImportPreviewOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<MessageImportPreviewData | null>(null);
  const [selectedImportFile, setSelectedImportFile] = useState<File | null>(null);
  const [importOverwrite, setImportOverwrite] = useState(false);
  const [importing, setImporting] = useState(false);
  const [multiLanguageEditOpen, setMultiLanguageEditOpen] = useState(false);
  const [selectedMessageKey, setSelectedMessageKey] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');

  // Get selected store details for default language
  const { data: selectedStore } = useQuery({
    queryKey: ['message-store-details', selectedStoreId],
    queryFn: async () => {
      if (!selectedStoreId) return null;
      return await getMessageStore(selectedStoreId);
    },
    enabled: !!selectedStoreId,
  });

  // Load message stores using TanStack Query
  const {
    data: stores = [],
    isLoading: loadingStores,
    error: storesError,
    refetch: refetchStores,
  } = useQuery({
    queryKey: ['message-stores', selectedCompanyProjectId],
    queryFn: async () => {
      const companyProjectId =
        typeof selectedCompanyProjectId === 'number' && selectedCompanyProjectId > 0
          ? selectedCompanyProjectId
          : undefined;
      return await listMessageStores(undefined, companyProjectId);
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false, // Disable aggressive refetching for better performance
    refetchOnReconnect: true, // Keep reconnect refetch for network recovery
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
  });

  // Reset selected store and invalidate queries when project changes
  useEffect(() => {
    // Clear selected store when project changes to avoid showing messages from wrong project
    setSelectedStoreId(null);
    setSearchQuery('');

    // Invalidate message-keys queries to force refetch with new project scope
    queryClient.invalidateQueries({ queryKey: ['message-keys'] });
  }, [selectedCompanyProjectId, queryClient]);

  // Handle URL parameter for auto-selecting store
  useEffect(() => {
    const urlStoreId = searchParams.get('messageStoreId');

    if (urlStoreId && stores.length > 0) {
      const storeIdNum = parseInt(urlStoreId, 10);
      const storeExists = stores.find((s) => s.messageStoreId === storeIdNum);
      if (storeExists) {
        setSelectedStoreId(storeIdNum);
        setSearchParams({});
      } else {
        toast.error(`Message store ${urlStoreId} not found`);
        const firstActiveStore = stores.find((s) => s.isActive !== false);
        setSelectedStoreId(firstActiveStore ? firstActiveStore.messageStoreId : stores[0]?.messageStoreId || null);
      }
    } else if (stores.length > 0 && selectedStoreId === null) {
      const firstActiveStore = stores.find((s) => s.isActive !== false);
      setSelectedStoreId(firstActiveStore ? firstActiveStore.messageStoreId : stores[0].messageStoreId);
    } else if (stores.length === 0) {
      setSelectedStoreId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stores.length, searchParams, setSearchParams]); // Removed selectedStoreId to prevent loop

  // Load messageKeys using TanStack Query (new v5.0.0 API)
  const {
    data: messageKeys = [],
    isLoading: loadingMessages,
    error: messagesError,
    refetch: refetchMessages,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ['message-keys', selectedStoreId, selectedCompanyProjectId],
    queryFn: async () => {
      if (!selectedStoreId) return [];
      try {
        return await listMessageKeys(selectedStoreId);
      } catch (error) {
        // Log detailed error information for debugging
        console.error('Error fetching message keys:', {
          storeId: selectedStoreId,
          error,
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          errorMessage: error instanceof Error ? error.message : String(error),
          axiosError: error && typeof error === 'object' && 'isAxiosError' in error ? {
            status: (error as any).response?.status,
            statusText: (error as any).response?.statusText,
            data: (error as any).response?.data,
            url: (error as any).config?.url,
            method: (error as any).config?.method,
          } : undefined,
        });
        throw error;
      }
    },
    enabled: !!selectedStoreId,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false, // Disable aggressive refetching for better performance
    refetchOnReconnect: true, // Keep reconnect refetch for network recovery
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
  });

  const loading = loadingStores || loadingMessages;
  const error = storesError ? getApiErrorMessage(storesError) : messagesError ? getApiErrorMessage(messagesError) : null;

  // Convert messageKeys to groups for UI
  const messageGroups = useMemo(() => {
    return convertMessageKeysToGroups(messageKeys);
  }, [messageKeys]);

  // Filter groups by search query
  const filteredGroups = useMemo(() => {
    return filterMessageKeyGroups(messageGroups, searchQuery);
  }, [messageGroups, searchQuery]);

  // Memoize expensive statistics computations
  const stats = useMemo(() => {
    const totalTranslations = messageKeys.reduce((sum, k) => sum + k.languages.length, 0);
    const publishedCount = messageKeys.filter((k) => k.publishedVersion !== undefined && k.publishedVersion !== null).length;
    return {
      totalTranslations,
      publishedCount,
    };
  }, [messageKeys]);

  const handleMessageCreated = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['message-keys', selectedStoreId] });
  }, [queryClient, selectedStoreId]);

  const handleManualRefresh = useCallback(() => {
    if (selectedStoreId) {
      refetchMessages();
      toast.info('Refreshing messages...');
    }
  }, [selectedStoreId, refetchMessages]);

  const handleEditAllLanguages = useCallback((messageKey: string) => {
    setSelectedMessageKey(messageKey);
    setSelectedLanguage('');
    setMultiLanguageEditOpen(true);
  }, []);

  const handleEditSingleLanguage = useCallback((messageKey: string, language: string) => {
    setSelectedMessageKey(messageKey);
    setSelectedLanguage(language);
    setMultiLanguageEditOpen(true);
  }, []);

  const handleNavigateToDetail = useCallback((messageKey: string, language: string) => {
    if (selectedStoreId) {
      navigate(`/messages/stores/${selectedStoreId}/messages/${messageKey}?lang=${language}`);
    }
  }, [selectedStoreId, navigate]);

  const handleImportFileSelected = useCallback(async (file: File, overwrite: boolean) => {
    try {
      setSelectedImportFile(file);
      setImportOverwrite(overwrite);

      const service = new ExportImportService();
      const apiPreview = await service.previewImport('messages', file, overwrite);

      // Transform API response to MessageImportPreviewData format
      const preview: MessageImportPreviewData = {
        isValid: apiPreview.isValid,
        willCreate: apiPreview.summary?.messages?.willCreate ?? 0,
        willUpdate: apiPreview.summary?.messages?.willUpdate ?? 0,
        willSkip: apiPreview.summary?.messages?.willSkip ?? 0,
        conflicts: apiPreview.conflicts?.map(conflict => ({
          messageKey: (conflict.messageKey as string) || '',
          language: (conflict.language as string) || '',
          current: conflict.current as Record<string, unknown> | undefined,
          imported: conflict.imported as Record<string, unknown> | undefined,
          action: (conflict.suggestedAction === 'skip' ? 'skip' : 'update') as 'create' | 'update' | 'skip',
        })) ?? [],
        errors: 'errors' in apiPreview ? (apiPreview.errors as string[]) : undefined,
        warnings: 'warnings' in apiPreview ? (apiPreview.warnings as string[]) : undefined,
      };

      setImportPreview(preview);
      setImportDialogOpen(false);
      setImportPreviewOpen(true);
    } catch (error: unknown) {
      toast.error('Import Preview Failed', {
        description: getApiErrorMessage(error) || 'Failed to preview import',
      });
      console.error('Error previewing import:', error);
    }
  }, []);

  const handleImportConfirm = useCallback(async () => {
    if (!selectedImportFile) return;
    try {
      setImporting(true);
      const service = new ExportImportService();
      await service.importData('messages', selectedImportFile, {
        overwrite: importOverwrite,
      });
      toast.success('Import completed successfully');
      setImportPreviewOpen(false);
      setSelectedImportFile(null);
      // Refresh messages list
      queryClient.invalidateQueries({ queryKey: ['message-keys', selectedStoreId] });
    } catch (error: unknown) {
      toast.error('Import Failed', {
        description: getApiErrorMessage(error) || 'Failed to import',
      });
    } finally {
      setImporting(false);
    }
  }, [selectedImportFile, importOverwrite, queryClient, selectedStoreId]);

  const handleImportCancel = useCallback(() => {
    setImportPreviewOpen(false);
    setSelectedImportFile(null);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K: Focus search (if not in input)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        const searchInput = document.getElementById('message-search-input') as HTMLInputElement;
        searchInput?.focus();
      }
      // F5: Refresh messages
      if (e.key === 'F5') {
        e.preventDefault();
        handleManualRefresh();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [permissions.canCreate]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl text-slate-900 mb-2">Messages</h1>
          <p className="text-sm sm:text-base text-slate-600">Manage audio files and text-to-speech messages</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {permissions.canView && (
            <>
              <Button
                variant="outline"
                onClick={() => setExportDialogOpen(true)}
                className="hidden sm:inline-flex transition-colors"
                aria-label="Export messages"
              >
                Export
              </Button>
              <Button
                variant="outline"
                onClick={() => setImportDialogOpen(true)}
                className="hidden sm:inline-flex transition-colors"
                aria-label="Import messages"
              >
                Import
              </Button>
            </>
          )}
          <Link to="/messages/settings">
            <Button variant="outline" className="hidden md:inline-flex transition-colors" aria-label="Open message settings">
              <Settings className="w-4 h-4 mr-2" aria-hidden="true" />
              Message Settings
            </Button>
          </Link>
          {permissions.canCreate && (
            <CreateMessageDialog onSuccess={handleMessageCreated} selectedStoreId={selectedStoreId} />
          )}
        </div>

      {/* Export Dialog */}
      <MessageExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        defaultStoreId={selectedStoreId || undefined}
      />

      {/* Import Dialog */}
      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        title="Messages"
        onFileSelected={handleImportFileSelected}
      />

      {/* Import Preview Dialog */}
      <MessageImportPreview
        open={importPreviewOpen}
        onOpenChange={setImportPreviewOpen}
        preview={importPreview}
        onConfirm={handleImportConfirm}
        onCancel={handleImportCancel}
        isLoading={importing}
      />

      {/* Unified Edit Dialog */}
      {selectedStoreId && selectedMessageKey && (
        <UnifiedEditDialog
          messageStoreId={selectedStoreId}
          messageKey={selectedMessageKey}
          initialLanguage={selectedLanguage}
          open={multiLanguageEditOpen}
          onOpenChange={setMultiLanguageEditOpen}
          onSuccess={handleMessageCreated}
        />
      )}
      </div>

      {/* Message Store Selector */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <label className="text-sm font-medium text-slate-700">Message Store:</label>
            <MessageStoreSelector
              value={selectedStoreId}
              onChange={setSelectedStoreId}
              stores={stores}
            />
            <MessageStoreList
              onStoreSelected={setSelectedStoreId}
              onStoreCreated={async (storeId) => {
                // Refresh stores list and auto-select the newly created store
                await refetchStores();
                setSelectedStoreId(storeId);
              }}
              onStoreDeleted={async (storeId) => {
                // If the deleted store is currently selected, clear selection
                if (selectedStoreId === storeId) {
                  setSelectedStoreId(null);
                }
                await refetchStores();
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Search Messages</CardTitle>
            {dataUpdatedAt && (
              <span className="text-xs text-slate-500">
                Last updated: {new Date(dataUpdatedAt).toLocaleTimeString()}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" aria-hidden="true" />
              <Input
                id="message-search-input"
                aria-label="Search messages by key"
                type="text"
                placeholder="Search messages by key... (Ctrl+K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 transition-all focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleManualRefresh}
              disabled={!selectedStoreId || loading}
              title="Refresh"
              aria-label="Refresh messages"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="sr-only">Refresh messages</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <ErrorState
          title="Failed to load messages"
          message={error}
          onRetry={() => {
            if (selectedStoreId) {
              refetchMessages();
            } else {
              refetchStores();
            }
          }}
          className="mb-6"
        />
      )}

      {/* No Message Stores Empty State */}
      {!loading && !error && selectedCompanyProjectId && stores.length === 0 && (
        <EmptyState
          title="No message stores found"
          description="Create a message store to start managing messages for this project."
          icon={Inbox}
          action={
            permissions.canCreate
              ? {
                  label: 'Create Message Store',
                  onClick: () => {
                    // Trigger MessageStoreList dialog to create a store
                    const manageButton = document.querySelector('[aria-label="Manage Stores"]') as HTMLButtonElement;
                    if (manageButton) {
                      manageButton.click();
                    }
                  },
                }
              : undefined
          }
          className="mb-6"
        />
      )}

      {/* Messages Table - Grouped by Message Key */}
      {selectedStoreId && (
        <Card>
          <CardHeader>
            <CardTitle>
              Message Library ({filteredGroups.length} message{filteredGroups.length !== 1 ? 's' : ''}, {stats.totalTranslations} translation{stats.totalTranslations !== 1 ? 's' : ''})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <LoadingSkeleton rows={5} columns={5} showHeader={true} />
            ) : filteredGroups.length === 0 ? (
              <EmptyState
                title={messageKeys.length === 0 ? 'No messages in this store' : 'No messages match your search'}
                description={
                  messageKeys.length === 0
                    ? 'Create your first message to get started.'
                    : 'Try adjusting your search query or filters.'
                }
                icon={Inbox}
                action={
                  messageKeys.length === 0 && permissions.canCreate
                    ? {
                        label: 'Create Message',
                        onClick: () => {
                          // The CreateMessageDialog is already in the header
                        },
                      }
                    : undefined
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8" aria-label="Expand row"></TableHead>
                      <TableHead>Message Key</TableHead>
                      <TableHead className="hidden md:table-cell">Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>
                        Actions
                        <span className="sr-only">Available actions for message</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGroups.map((group) => (
                      <MessageKeyRow
                        key={group.messageKey}
                        group={group}
                        storeId={selectedStoreId}
                        defaultLanguage={selectedStore?.defaultLanguage}
                        onEditAllLanguages={handleEditAllLanguages}
                        onEditSingleLanguage={handleEditSingleLanguage}
                        onNavigateToDetail={handleNavigateToDetail}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Message Stats */}
      {!loading && selectedStoreId && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl text-slate-900">{messageKeys.length}</div>
              <p className="text-sm text-slate-600 mt-1">Message Keys</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl text-slate-900">
                {stats.totalTranslations}
              </div>
              <p className="text-sm text-slate-600 mt-1">Total Translations</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl text-slate-900">
                {stats.publishedCount}
              </div>
              <p className="text-sm text-slate-600 mt-1">Published</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

