'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ExportImportService } from '@/services/shared';
import { FileHandlerService } from '@/services/shared';
import { Download, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { LoadingSpinner } from '@/components/common';
import { getApiErrorMessage } from '@/api/client';
import { listMessageStores, type MessageStoreResponseDto } from '@/services/messages/message-stores.service';
import { listMessageTypes, type MessageTypeResponseDto } from '@/services/messages/message-stores.service';
import { listLanguages } from '@/services/configuration';
import type { Language } from '@/api/types';

interface MessageExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStoreId?: number;
}

export function MessageExportDialog({
  open,
  onOpenChange,
  defaultStoreId,
}: MessageExportDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // Data
  const [messageStores, setMessageStores] = useState<MessageStoreResponseDto[]>([]);
  const [messageTypes, setMessageTypes] = useState<MessageTypeResponseDto[]>([]);
  const [allLanguages, setAllLanguages] = useState<Language[]>([]);

  // Form state
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);

  // Track if we've initialized to prevent re-initialization loops
  const initializedRef = useRef(false);
  // Capture defaultStoreId when dialog opens to prevent re-initialization when prop changes
  const capturedDefaultStoreIdRef = useRef<number | undefined>(undefined);
  const [messageKeys, setMessageKeys] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [includeContent, setIncludeContent] = useState(false);
  const [includeHistory, setIncludeHistory] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Errors
  const [messageKeysError, setMessageKeysError] = useState<string | null>(null);

  const service = new ExportImportService();

  const resetForm = useCallback(() => {
    setMessageKeys('');
    setSelectedTypes([]);
    setSelectedLanguages([]);
    setIncludeContent(false);
    setIncludeHistory(false);
    setShowFilters(false);
    setMessageKeysError(null);
  }, []);

  // Track the last open state to detect when dialog transitions from closed to open
  const prevOpenRef = useRef(false);

  // Load initial data when dialog opens
  useEffect(() => {
    const wasOpen = prevOpenRef.current;
    prevOpenRef.current = open;

    if (!open) {
      // Reset state when dialog closes
      if (wasOpen) {
        // Only reset if we were previously open (avoid resetting on initial mount)
        resetForm();
        setSelectedStoreId(null);
        initializedRef.current = false;
        capturedDefaultStoreIdRef.current = undefined;
      }
      return;
    }

    // Only initialize when transitioning from closed to open
    if (!wasOpen && open) {
      // Dialog just opened - initialize
      if (initializedRef.current) {
        // This shouldn't happen, but guard against it
        console.warn('[MessageExportDialog] Already initialized when opening');
        return;
      }

      // Capture the defaultStoreId value when dialog first opens
      capturedDefaultStoreIdRef.current = defaultStoreId;
      initializedRef.current = true;

      // Load data when dialog opens
      let cancelled = false;
      const loadData = async () => {
        try {
          setLoadingData(true);
          const capturedDefaultStoreId = capturedDefaultStoreIdRef.current;
          console.log('[MessageExportDialog] Loading initial data...');
          console.log('[MessageExportDialog] capturedDefaultStoreId:', capturedDefaultStoreId);

          const [stores, types, languages] = await Promise.all([
            listMessageStores(),
            listMessageTypes(),
            listLanguages(),
          ]);

          if (cancelled) return;

          console.log('[MessageExportDialog] Loaded:', {
            stores: stores.length,
            types: types.length,
            languages: languages.length,
          });

          setMessageStores(stores);
          setMessageTypes(types);
          setAllLanguages(languages);

          // Set selected store: prefer captured defaultStoreId, then first store
          if (capturedDefaultStoreId && stores.some(s => s.messageStoreId === capturedDefaultStoreId)) {
            console.log('[MessageExportDialog] Setting capturedDefaultStoreId:', capturedDefaultStoreId);
            setSelectedStoreId(capturedDefaultStoreId);
          } else if (stores.length > 0) {
            console.log('[MessageExportDialog] Setting first store:', stores[0].messageStoreId);
            setSelectedStoreId(stores[0].messageStoreId);
          } else {
            console.log('[MessageExportDialog] No stores available');
          }
        } catch (error: unknown) {
          if (cancelled) return;
          toast.error('Failed to load export options', {
            description: getApiErrorMessage(error) || 'Failed to load data',
          });
          console.error('[MessageExportDialog] Error loading initial data:', error);
        } finally {
          if (!cancelled) {
            setLoadingData(false);
          }
        }
      };

      loadData();

      return () => {
        cancelled = true;
      };
    }

    // Dialog is open but was already open - do nothing
    // This prevents re-initialization when props change while dialog is open
  }, [open, resetForm]);

  const validateMessageKeys = (keys: string): boolean => {
    if (!keys.trim()) {
      setMessageKeysError(null);
      return true;
    }

    const keyArray = keys
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    // Validate UPPER_SNAKE_CASE format
    const validFormat = /^[A-Z][A-Z0-9_]*$/;
    const invalidKeys = keyArray.filter((k) => !validFormat.test(k));

    if (invalidKeys.length > 0) {
      setMessageKeysError(
        `Invalid format: ${invalidKeys.join(', ')}. Use UPPER_SNAKE_CASE (e.g., WELCOME_MESSAGE)`
      );
      return false;
    }

    setMessageKeysError(null);
    return true;
  };

  const handleMessageKeysChange = (value: string) => {
    setMessageKeys(value);
    validateMessageKeys(value);
  };

  const toggleType = (code: string) => {
    setSelectedTypes((prev) =>
      prev.includes(code)
        ? prev.filter((t) => t !== code)
        : [...prev, code]
    );
  };

  const toggleLanguage = (langCode: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(langCode)
        ? prev.filter((l) => l !== langCode)
        : [...prev, langCode]
    );
  };

  const handleExport = async () => {
    if (!selectedStoreId) {
      toast.error('Please select a message store');
      return;
    }

    if (!validateMessageKeys(messageKeys)) {
      return;
    }

    try {
      setIsLoading(true);

      // Build filters
      const filters: Record<string, string[]> = {
        messageStoreId: [selectedStoreId.toString()],
      };

      if (messageKeys.trim()) {
        const keyArray = messageKeys
          .split(',')
          .map((k) => k.trim())
          .filter((k) => k.length > 0);
        filters.messageKeys = keyArray;
      }

      if (selectedTypes.length > 0) {
        filters.typeCodes = selectedTypes;
      }

      if (selectedLanguages.length > 0) {
        filters.languages = selectedLanguages;
      }

      const blob = await service.exportData({
        moduleType: 'messages',
        filters,
        includeContent,
        includeHistory,
      });

      const filename = FileHandlerService.generateExportFilename('messages');
      FileHandlerService.downloadFile(blob, filename);

      toast.success('Export Successful', {
        description: `Messages exported to ${filename}`,
      });

      onOpenChange(false);
      resetForm();
    } catch (error: unknown) {
      const errorMessage = getApiErrorMessage(error) || 'Failed to export messages';
      toast.error('Export Failed', {
        description: errorMessage,
      });
      console.error('Export error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedStore = messageStores.find((s) => s.messageStoreId === selectedStoreId);
  const availableLanguages = selectedStore
    ? allLanguages.filter((lang) => selectedStore.allowedLanguages.includes(lang.languageCode))
    : [];

  // Debug logging (removed to prevent excessive logging and potential re-render issues)
  // Uncomment only for debugging purposes
  // useEffect(() => {
  //   if (!loadingData) {
  //     console.log('[MessageExportDialog] Current state:', {
  //       selectedStoreId,
  //       messageStoresCount: messageStores.length,
  //       messageTypesCount: messageTypes.length,
  //       allLanguagesCount: allLanguages.length,
  //       availableLanguagesCount: availableLanguages.length,
  //       selectedStore: selectedStore?.name,
  //     });
  //   }
  // }, [selectedStoreId, messageStores, messageTypes, allLanguages, loadingData, availableLanguages.length, selectedStore?.name]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export Messages</DialogTitle>
          <DialogDescription>
            Export messages with comprehensive filtering options
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="py-8">
            <LoadingSpinner size="medium" message="Loading export options..." />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Message Store Selection */}
            <div className="space-y-2">
              <Label htmlFor="store">Message Store *</Label>
              <Select
                value={selectedStoreId?.toString() || 'none'}
                onValueChange={(value) =>
                  setSelectedStoreId(value !== 'none' ? parseInt(value, 10) : null)
                }
              >
                <SelectTrigger id="store">
                  <SelectValue placeholder="Select a message store" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select a message store</SelectItem>
                  {messageStores.map((store) => (
                    <SelectItem key={store.messageStoreId} value={store.messageStoreId.toString()}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filters Section (Collapsible) */}
            <div className="border rounded-lg">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                aria-expanded={showFilters}
                aria-controls="advanced-filters-content"
              >
                <span className="font-medium text-sm">Advanced Filters (Optional)</span>
                {showFilters ? (
                  <ChevronUp className="h-4 w-4 text-slate-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                )}
              </button>

              {showFilters && (
                <div id="advanced-filters-content" className="p-4 space-y-4 border-t">
                  {/* Message Keys Filter */}
                  <div className="space-y-2">
                    <Label htmlFor="messageKeys">
                      Message Keys
                      <span className="ml-2 text-xs text-slate-500 font-normal">
                        (comma-separated, e.g., WELCOME_MESSAGE, GOODBYE_MESSAGE)
                      </span>
                    </Label>
                    <Input
                      id="messageKeys"
                      value={messageKeys}
                      onChange={(e) => handleMessageKeysChange(e.target.value)}
                      placeholder="WELCOME_MESSAGE, GOODBYE_MESSAGE"
                      className={messageKeysError ? 'border-red-500' : ''}
                    />
                    {messageKeysError && (
                      <p className="text-xs text-red-600">{messageKeysError}</p>
                    )}
                  </div>

                  {/* Message Types Filter */}
                  <div className="space-y-2">
                    <Label>Message Types</Label>
                    <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                      {messageTypes.length === 0 ? (
                        <p className="text-sm text-slate-500">No message types available</p>
                      ) : (
                        messageTypes.map((type) => (
                          <div key={type.messageTypeId} className="flex items-center space-x-2">
                            <Checkbox
                              id={`type-${type.code}`}
                              checked={selectedTypes.includes(type.code)}
                              onCheckedChange={() => toggleType(type.code)}
                            />
                            <Label
                              htmlFor={`type-${type.code}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {type.displayName} ({type.code})
                            </Label>
                          </div>
                        ))
                      )}
                    </div>
                    {selectedTypes.length > 0 && (
                      <p className="text-xs text-slate-600">{selectedTypes.length} type(s) selected</p>
                    )}
                  </div>

                  {/* Languages Filter */}
                  <div className="space-y-2">
                    <Label>
                      Languages
                      {selectedStore && (
                        <span className="ml-2 text-xs text-slate-500 font-normal">
                          (from store: {selectedStore.name})
                        </span>
                      )}
                    </Label>
                    <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                      {availableLanguages.length === 0 ? (
                        <p className="text-sm text-slate-500">
                          {selectedStore
                            ? 'No languages configured for this store'
                            : 'Select a store to see available languages'}
                        </p>
                      ) : (
                        availableLanguages.map((lang) => (
                          <div key={lang.languageCode} className="flex items-center space-x-2">
                            <Checkbox
                              id={`lang-${lang.languageCode}`}
                              checked={selectedLanguages.includes(lang.languageCode)}
                              onCheckedChange={() => toggleLanguage(lang.languageCode)}
                            />
                            <Label
                              htmlFor={`lang-${lang.languageCode}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {lang.displayName} ({lang.languageCode})
                            </Label>
                          </div>
                        ))
                      )}
                    </div>
                    {selectedLanguages.length > 0 && (
                      <p className="text-xs text-slate-600">
                        {selectedLanguages.length} language(s) selected
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Export Options */}
            <div className="space-y-3">
              <Label>Export Options</Label>
              <div className="space-y-3 border rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="includeContent"
                    checked={includeContent}
                    onCheckedChange={(checked) => setIncludeContent(checked === true)}
                  />
                  <div className="flex-1">
                    <Label htmlFor="includeContent" className="font-normal cursor-pointer">
                      Include full content
                    </Label>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Export complete message content (increases file size)
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="includeHistory"
                    checked={includeHistory}
                    onCheckedChange={(checked) => setIncludeHistory(checked === true)}
                  />
                  <div className="flex-1">
                    <Label htmlFor="includeHistory" className="font-normal cursor-pointer">
                      Include version history
                    </Label>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Include all versions, not just published versions
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Export Summary */}
            <div className="bg-indigo-50 border border-indigo-200 p-3 rounded text-sm">
              <p className="font-medium text-indigo-900 mb-1">Export Summary</p>
              <ul className="text-indigo-800 space-y-1">
                <li>
                  Store:{' '}
                  <span className="font-medium">
                    {selectedStore?.name || 'None selected'}
                  </span>
                </li>
                {messageKeys.trim() && (
                  <li>
                    Message Keys:{' '}
                    <span className="font-medium">
                      {messageKeys.split(',').filter((k) => k.trim()).length} key(s)
                    </span>
                  </li>
                )}
                {selectedTypes.length > 0 && (
                  <li>
                    Types: <span className="font-medium">{selectedTypes.length} selected</span>
                  </li>
                )}
                {selectedLanguages.length > 0 && (
                  <li>
                    Languages:{' '}
                    <span className="font-medium">{selectedLanguages.length} selected</span>
                  </li>
                )}
                <li>
                  Options:{' '}
                  <span className="font-medium">
                    {includeContent ? 'Full content' : 'Metadata only'}
                    {includeHistory && ', with history'}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="transition-colors"
            aria-label="Cancel export"
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isLoading || !selectedStoreId || loadingData}
            className="transition-colors"
            aria-label="Export messages"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" aria-hidden="true" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


