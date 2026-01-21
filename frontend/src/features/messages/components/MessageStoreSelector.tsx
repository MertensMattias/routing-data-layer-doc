import { useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { MessageStoreResponseDto } from '@/services/messages/types';

interface MessageStoreSelectorProps {
  value: number | null;
  onChange: (storeId: number) => void;
  stores: MessageStoreResponseDto[];
  className?: string;
}

const STORAGE_KEY = 'selectedMessageStoreId';

export function MessageStoreSelector({
  value,
  onChange,
  stores,
  className = 'w-64',
}: MessageStoreSelectorProps) {
  // Auto-select first active store or restore from localStorage
  useEffect(() => {
    if (stores.length === 0) return;

    if (value === null) {
      // Try to restore from localStorage
      const savedStoreId = localStorage.getItem(STORAGE_KEY);
      if (savedStoreId) {
        const storeId = parseInt(savedStoreId, 10);
        if (stores.some((s) => s.messageStoreId === storeId)) {
          onChange(storeId);
          return;
        }
      }

      // Otherwise, select first active store, or first store if none are active
      const firstActiveStore = stores.find((s) => s.isActive !== false);
      if (firstActiveStore) {
        onChange(firstActiveStore.messageStoreId);
      } else {
        onChange(stores[0].messageStoreId);
      }
    }
  }, [stores, value, onChange]);

  // Save to localStorage when selection changes
  const handleChange = (newValue: string) => {
    const storeId = parseInt(newValue, 10);
    localStorage.setItem(STORAGE_KEY, newValue);
    onChange(storeId);
  };

  if (stores.length === 0) {
    return (
      <Select disabled>
        <SelectTrigger className={className}>
          <SelectValue placeholder="No message stores available" />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value?.toString()} onValueChange={handleChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select message store" />
      </SelectTrigger>
      <SelectContent>
        {stores.map((store) => (
          <SelectItem key={store.messageStoreId} value={store.messageStoreId.toString()}>
            <div className="flex items-center gap-2">
              <span className={store.isActive === false ? 'text-slate-400' : ''}>{store.name}</span>
              {store.isActive === false && (
                <span className="text-xs text-slate-400 italic">(Deactivated)</span>
              )}
              {store.defaultLanguage && (
                <span className="text-xs text-slate-500 ml-2">({store.defaultLanguage})</span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
