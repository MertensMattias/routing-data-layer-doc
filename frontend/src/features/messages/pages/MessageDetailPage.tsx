import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, FileText, Languages } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDomainPermissions } from '@/hooks/useDomainPermissions';
import { Domain } from '@shared/types/roles';
import { EditMessageDialog } from '@/features/messages/components/EditMessageDialog';
import { MultiLanguageEditDialog } from '@/features/messages/components/MultiLanguageEditDialog';
import { MessageVersionSelector } from '@/features/messages/components/MessageVersionSelector';
import { AuditSidePanel, LoadingSpinner, ErrorState } from '@/components/common';
import {
  getMessageKey,
  type MessageKeyResponseDto,
  getAuditHistory,
  type MessageKeyAuditResponseDto,
} from '@/services/messages/message-keys.service';
import {
  getMessageStore,
} from '@/services/messages/message-stores.service';
import {
  listMessageTypes,
  listMessageCategories,
} from '@/services/configuration';
import type { MessageType, MessageCategory } from '@/api/types';
import { getApiErrorMessage } from '@/api/client';

export function MessageDetailPage() {
  const { storeId, messageKey } = useParams<{ storeId: string; messageKey: string }>();
  const { user } = useAuth();
  const permissions = useDomainPermissions({
    roles: user?.roles,
    domain: Domain.MESSAGE_STORE,
  });
  const [searchParams] = useSearchParams();
  const [defaultLang, setDefaultLang] = useState<string>('nl-BE');
  const lang = searchParams.get('lang') || defaultLang;

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [multiLanguageEditOpen, setMultiLanguageEditOpen] = useState(false);
  const [auditPanelOpen, setAuditPanelOpen] = useState(false);
  const [auditHistory, setAuditHistory] = useState<MessageKeyAuditResponseDto[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [messageTypes, setMessageTypes] = useState<MessageType[]>([]);
  const [messageCategories, setMessageCategories] = useState<MessageCategory[]>([]);

  // Load message using TanStack Query
  const {
    data: message,
    isLoading: loading,
    error: messageError,
    refetch: refetchMessage,
  } = useQuery({
    queryKey: ['message-key', storeId, messageKey],
    queryFn: async () => {
      if (!storeId || !messageKey) return null;
      return await getMessageKey(parseInt(storeId, 10), messageKey);
    },
    enabled: !!storeId && !!messageKey,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const error = messageError ? getApiErrorMessage(messageError) : null;

  const loadStoreDefaultLanguage = useCallback(async () => {
    if (!storeId) return;
    try {
      const store = await getMessageStore(parseInt(storeId, 10));
      setDefaultLang(store.defaultLanguage || store.allowedLanguages[0] || 'nl-BE');
    } catch (err: unknown) {
      console.error('Error loading store default language:', getApiErrorMessage(err) || 'Unknown error', err);
      // Keep default 'nl-BE' if store load fails
    }
  }, [storeId]);

  const loadMessageTypesAndCategories = useCallback(async () => {
    try {
      const [types, categories] = await Promise.all([
        listMessageTypes(),
        listMessageCategories(),
      ]);
      setMessageTypes(types);
      setMessageCategories(categories);
    } catch (err: unknown) {
      console.error('Error loading message types and categories:', getApiErrorMessage(err) || 'Unknown error', err);
      // Continue without types/categories - will show IDs as fallback
    }
  }, []);

  useEffect(() => {
    if (storeId) {
      loadStoreDefaultLanguage();
    }
    // Load message types and categories on mount
    loadMessageTypesAndCategories();
  }, [storeId, loadStoreDefaultLanguage, loadMessageTypesAndCategories]);

  // Refetch message handler for error retry
  const loadMessage = useCallback(() => {
    refetchMessage();
  }, [refetchMessage]);

  const loadAuditHistory = async () => {
    if (!storeId || !messageKey) return;
    try {
      setLoadingAudit(true);
      const auditResponse = await getAuditHistory(parseInt(storeId, 10), messageKey);
      setAuditHistory(auditResponse.data);
    } catch (err: unknown) {
      console.error('Error loading audit history:', err);
      toast.error(getApiErrorMessage(err) || 'Failed to load audit history');
    } finally {
      setLoadingAudit(false);
    }
  };

  const navigate = useNavigate();

  // Keyboard navigation: Escape key to go back
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !editDialogOpen && !multiLanguageEditOpen && !auditPanelOpen) {
        navigate('/messages');
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [navigate, editDialogOpen, multiLanguageEditOpen, auditPanelOpen]);

  const handleAuditClick = () => {
    setAuditPanelOpen(true);
    if (auditHistory.length === 0) {
      loadAuditHistory();
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <LoadingSpinner size="large" message="Loading message..." />
      </div>
    );
  }

  if (error || !message) {
    return (
      <div className="p-8">
        <Link to="/messages">
          <Button variant="outline" className="mb-4" aria-label="Back to messages list">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Messages
          </Button>
        </Link>
        <ErrorState
          title="Failed to load message"
          message={error || 'Message not found'}
          onRetry={() => refetchMessage()}
        />
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <Link to="/messages">
          <Button variant="outline" className="mb-4" aria-label="Back to messages list">
            <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
            Back to Messages
          </Button>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {message.messageKey}
              {lang && (
                <Badge className="ml-3 text-sm" aria-label={`Language: ${lang}`}>{lang}</Badge>
              )}
            </h1>
            {message.displayName && (
              <p className="text-slate-600">{message.displayName}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Message actions">
            {permissions.canEdit && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setEditDialogOpen(true)}
                  aria-label={`Edit ${message.messageKey} in ${lang}`}
                >
                  <Edit className="w-4 h-4 mr-2" aria-hidden="true" />
                  Edit This Language
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setMultiLanguageEditOpen(true)}
                  aria-label={`Edit all languages for ${message.messageKey}`}
                >
                  <Languages className="w-4 h-4 mr-2" aria-hidden="true" />
                  Edit All Languages
                </Button>
              </>
            )}
            {permissions.canView && (
              <Button
                variant="outline"
                onClick={handleAuditClick}
                aria-label="View audit history"
              >
                <FileText className="w-4 h-4 mr-2" aria-hidden="true" />
                Audit
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content - Single Scrollable Page */}
      <div className="space-y-6">
          {/* Message Information */}
          <Card>
            <CardHeader>
              <CardTitle>Message Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Message Key</p>
                  <p className="mt-1 font-mono text-sm">{message.messageKey}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Languages</p>
                  <p className="mt-1">{message.languages.join(', ')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Message Type</p>
                  <p className="mt-1">
                    {messageTypes.find((t) => t.messageTypeId === message.messageTypeId)?.displayName ||
                      message.messageTypeId}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Category</p>
                  <p className="mt-1">
                    {messageCategories.find((c) => c.categoryId === message.categoryId)?.displayName ||
                      message.categoryId}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Status</p>
                  <Badge
                    className={
                      message.publishedVersion
                        ? 'bg-green-100 text-green-700'
                        : 'bg-indigo-100 text-indigo-700'
                    }
                  >
                    {message.publishedVersion ? `Published (v${message.publishedVersion})` : 'Draft'}
                  </Badge>
                </div>
                {message.publishedVersion && (
                  <div>
                    <p className="text-sm font-medium text-slate-500">Published Version</p>
                    <p className="mt-1">v{message.publishedVersion}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-slate-500">Latest Version</p>
                  <p className="mt-1">v{message.latestVersion}</p>
                </div>
              </div>

              {message.description && (
                <div>
                  <p className="text-sm font-medium text-slate-500">Description</p>
                  <p className="mt-1 text-sm">{message.description}</p>
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4 text-xs text-slate-500">
                  <div>
                    <p>Created: {new Date(message.dateCreated).toLocaleString()}</p>
                    {message.createdBy && <p>By: {message.createdBy}</p>}
                  </div>
                  <div>
                    <p>Updated: {new Date(message.dateUpdated).toLocaleString()}</p>
                    {message.updatedBy && <p>By: {message.updatedBy}</p>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        {/* Version Selector */}
        <MessageVersionSelector
          storeId={parseInt(storeId!, 10)}
          messageKey={messageKey!}
          currentLanguage={lang}
          onVersionPublished={() => refetchMessage()}
        />
      </div>

      {/* Edit Dialog */}
      <EditMessageDialog
        message={message}
        language={lang}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={() => refetchMessage()}
      />

      {/* Multi-Language Edit Dialog */}
      <MultiLanguageEditDialog
        messageStoreId={parseInt(storeId!, 10)}
        messageKey={messageKey!}
        initialLanguage={lang}
        open={multiLanguageEditOpen}
        onOpenChange={setMultiLanguageEditOpen}
        onSuccess={() => refetchMessage()}
      />

      {/* Audit Side Panel */}
      <AuditSidePanel
        open={auditPanelOpen}
        onOpenChange={setAuditPanelOpen}
        auditHistory={auditHistory}
        loading={loadingAudit}
      />
    </div>
  );
}

