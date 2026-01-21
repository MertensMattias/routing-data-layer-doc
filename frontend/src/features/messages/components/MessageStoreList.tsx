import React, { useState } from 'react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Settings, Edit, Loader2, Trash2, Power, RotateCcw, Store } from 'lucide-react';
import { MessageStoreDialog } from './MessageStoreDialog';
import {
  listMessageStores,
  deleteMessageStore,
  hardDeleteMessageStore,
  reactivateMessageStore,
  type MessageStoreResponseDto,
} from '@/services/messages/message-stores.service';
import { useAuth } from '@/hooks/useAuth';
import { getApiErrorMessage } from '@/api/client';
import { usePermissions } from '@/hooks/usePermissions';
import { useCompanyProjectContext } from '@/contexts/CompanyProjectContext';
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/common';

interface MessageStoreListProps {
  onStoreSelected?: (storeId: number) => void;
  onStoreCreated?: (storeId: number) => void;
  onStoreDeleted?: (storeId: number) => void;
}

export function MessageStoreList({ onStoreSelected, onStoreCreated, onStoreDeleted }: MessageStoreListProps) {
  const [open, setOpen] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [processingAction, setProcessingAction] = useState<'soft' | 'hard' | 'reactivate' | null>(null);
  const { user } = useAuth();
  const permissions = usePermissions({ roles: user?.roles });
  const queryClient = useQueryClient();
  const { selectedCompanyProjectId } = useCompanyProjectContext();

  // Load message stores using TanStack Query
  const {
    data: stores = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ['message-stores', selectedCompanyProjectId],
    queryFn: async () => {
      const companyProjectId =
        typeof selectedCompanyProjectId === 'number' && selectedCompanyProjectId > 0
          ? selectedCompanyProjectId
          : undefined;
      return await listMessageStores(undefined, companyProjectId);
    },
    enabled: open, // Only fetch when dialog is open
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
  });

  // Mutation for deactivating store
  const deactivateMutation = useMutation({
    mutationFn: deleteMessageStore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-stores'] });
      toast.success('Message store deactivated');
      setProcessingId(null);
      setProcessingAction(null);
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err) || 'Failed to deactivate store');
      setProcessingId(null);
      setProcessingAction(null);
    },
  });

  // Mutation for reactivating store
  const reactivateMutation = useMutation({
    mutationFn: reactivateMessageStore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-stores'] });
      toast.success('Message store reactivated');
      setProcessingId(null);
      setProcessingAction(null);
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err) || 'Failed to reactivate store');
      setProcessingId(null);
      setProcessingAction(null);
    },
  });

  // Mutation for hard deleting store
  const hardDeleteMutation = useMutation({
    mutationFn: hardDeleteMessageStore,
    onSuccess: (_, storeId) => {
      queryClient.invalidateQueries({ queryKey: ['message-stores'] });
      toast.success('Message store deleted permanently');
      onStoreDeleted?.(storeId);
      setProcessingId(null);
      setProcessingAction(null);
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err) || 'Failed to delete store. Ensure no routing entries reference this store.');
      setProcessingId(null);
      setProcessingAction(null);
    },
  });

  const handleStoreCreated = (createdStore?: MessageStoreResponseDto) => {
    // Invalidate cache to refresh stores list
    queryClient.invalidateQueries({ queryKey: ['message-stores'] });
    // If a store was created, notify parent to refresh and auto-select it
    if (createdStore) {
      onStoreCreated?.(createdStore.messageStoreId);
    }
  };

  const handleStoreClick = (storeId: number, e: React.MouseEvent) => {
    // Prevent row click if clicking on interactive elements (buttons, badges, etc.)
    const target = e.target as HTMLElement;
    // Check if click originated from an interactive element
    // This handles all badges, buttons, and other clickable elements without needing stopPropagation on each
    if (
      target.closest('button') ||
      target.closest('[role="button"]') ||
      target.closest('[data-slot="badge"]') || // Badge components
      target.closest('[data-slot="collapsible-trigger"]') ||
      target.closest('[data-radix-collection-item]') || // Radix UI components (Select, etc.)
      target.closest('a') ||
      target.tagName === 'BUTTON' ||
      target.tagName === 'A' ||
      target.tagName === 'INPUT' ||
      target.tagName === 'SELECT' ||
      target.tagName === 'TEXTAREA'
    ) {
      return;
    }
    onStoreSelected?.(storeId);
    setOpen(false);
  };

  const handleDeactivate = async (e: React.MouseEvent, store: MessageStoreResponseDto) => {
    e.stopPropagation();
    if (!permissions.canDelete) return;
    const confirmed = window.confirm(`Deactivate store "${store.name}"? Users cannot use this store until reactivated.`);
    if (!confirmed) return;
    setProcessingId(store.messageStoreId);
    setProcessingAction('soft');
    deactivateMutation.mutate(store.messageStoreId);
  };

  const handleReactivate = async (e: React.MouseEvent, store: MessageStoreResponseDto) => {
    e.stopPropagation();
    if (!permissions.canEdit) return;
    const confirmed = window.confirm(`Reactivate store "${store.name}"?`);
    if (!confirmed) return;
    setProcessingId(store.messageStoreId);
    setProcessingAction('reactivate');
    reactivateMutation.mutate(store.messageStoreId);
  };

  const handleHardDelete = async (e: React.MouseEvent, store: MessageStoreResponseDto) => {
    e.stopPropagation();
    if (!permissions.canDelete) return;
    // Double confirmation with name prompt
    const confirm1 = window.confirm(
      `Permanently delete store "${store.name}"? This cannot be undone and will remove all messages and versions.`
    );
    if (!confirm1) return;
    const typed = window.prompt('Type DELETE to confirm permanent deletion');
    if (typed !== 'DELETE') return;
    setProcessingId(store.messageStoreId);
    setProcessingAction('hard');
    hardDeleteMutation.mutate(store.messageStoreId);
  };

  const error = queryError ? getApiErrorMessage(queryError) : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings className="w-4 h-4 mr-2" />
          Manage Stores
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto"
        onPointerDownOutside={(e) => {
          // Prevent outer dialog from closing when a nested dialog is open
          // Check if there are multiple dialog portals (indicating a nested dialog)
          const allDialogPortals = document.querySelectorAll('[data-slot="dialog-portal"]');
          if (allDialogPortals.length > 1) {
            // There's a nested dialog - prevent outer dialog from closing
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          // Also prevent for other interaction types (touch, etc.)
          const allDialogPortals = document.querySelectorAll('[data-slot="dialog-portal"]');
          if (allDialogPortals.length > 1) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Message Stores</DialogTitle>
              <DialogDescription>
                Manage message stores for organizing your messages.
              </DialogDescription>
            </div>
            <MessageStoreDialog onSuccess={handleStoreCreated} />
          </div>
        </DialogHeader>

        {loading && (
          <div className="py-8">
            <LoadingSpinner size="medium" message="Loading stores..." />
          </div>
        )}

        {error && (
          <ErrorState
            title="Failed to load message stores"
            message={error}
            onRetry={() => refetch()}
            className="mb-4"
          />
        )}

        {!loading && !error && (
          <div className="space-y-4">
            {stores.length === 0 ? (
              <EmptyState
                title="No message stores found"
                description="Create your first message store to get started."
                icon={Store}
                action={
                  permissions.canCreate
                    ? {
                        label: 'Create Message Store',
                        onClick: () => {
                          // MessageStoreDialog is already in the header
                        },
                      }
                    : undefined
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Languages</TableHead>
                    <TableHead>Default</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stores.map((store) => (
                    <TableRow
                      key={store.messageStoreId}
                      className={`cursor-pointer hover:bg-slate-50 ${store.isActive === false ? 'opacity-60' : ''}`}
                      onClick={(e) => handleStoreClick(store.messageStoreId, e)}
                    >
                      <TableCell>
                        <div>
                          <p className={`font-medium ${store.isActive === false ? 'text-slate-400' : ''}`}>
                            {store.name}
                          </p>
                          {store.description && (
                            <p className="text-xs text-slate-500 mt-1">{store.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {store.allowedLanguages.slice(0, 3).map((lang) => (
                            <Badge key={lang} variant="secondary" className="text-xs">
                              {lang}
                            </Badge>
                          ))}
                          {store.allowedLanguages.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{store.allowedLanguages.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {store.defaultLanguage && (
                          <Badge className="text-xs">{store.defaultLanguage}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={store.isActive ? 'default' : 'secondary'}
                          className={
                            store.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-slate-100 text-slate-700'
                          }
                        >
                          {store.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MessageStoreDialog
                            store={store}
                            onSuccess={handleStoreCreated}
                            trigger={
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 transition-colors hover:bg-slate-100"
                                onClick={(e) => e.stopPropagation()}
                                title="Edit"
                                aria-label={`Edit message store ${store.name}`}
                              >
                                <Edit className="h-4 w-4" aria-hidden="true" />
                              </Button>
                            }
                          />
                          {permissions.canDelete && store.isActive && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2 text-amber-700 border-amber-300 transition-colors hover:bg-amber-50"
                              disabled={processingId === store.messageStoreId}
                              onClick={(e) => handleDeactivate(e, store)}
                              title="Deactivate store"
                              aria-label={`Deactivate message store ${store.name}`}
                            >
                              {processingId === store.messageStoreId && processingAction === 'soft' ? (
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                              ) : (
                                <Power className="h-4 w-4" aria-hidden="true" />
                              )}
                            </Button>
                          )}
                          {permissions.canEdit && !store.isActive && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2 text-emerald-700 border-emerald-300 transition-colors hover:bg-emerald-50"
                              disabled={processingId === store.messageStoreId}
                              onClick={(e) => handleReactivate(e, store)}
                              title="Reactivate store"
                              aria-label={`Reactivate message store ${store.name}`}
                            >
                              {processingId === store.messageStoreId && processingAction === 'reactivate' ? (
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                              ) : (
                                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                              )}
                            </Button>
                          )}
                          {permissions.canDelete && !store.isActive && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2 text-red-700 border-red-300 transition-colors hover:bg-red-50"
                              disabled={processingId === store.messageStoreId}
                              onClick={(e) => handleHardDelete(e, store)}
                              title="Delete permanently"
                              aria-label={`Permanently delete message store ${store.name}`}
                            >
                              {processingId === store.messageStoreId && processingAction === 'hard' ? (
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                              ) : (
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}

        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-slate-500">
            Total stores: {stores.length} • Active: {stores.filter((s) => s.isActive).length}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}


