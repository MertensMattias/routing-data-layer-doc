import { useEffect } from 'react';
import { toast } from 'sonner';
import { useFlowStore } from '@/features/flow-designer/stores/flow-store';

/**
 * Keyboard shortcuts for flow actions
 * - Ctrl/Cmd + S: Save
 * - Ctrl/Cmd + Shift + V: Validate
 * - Escape: Clear selection
 */
export function useKeyboardShortcuts() {
  const { isDirty, saveFlow, validateFlow, setSelectedSegment } = useFlowStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip shortcuts when typing in input fields
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Escape: Clear selection
      if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedSegment(null);
        toast.info('Selection cleared');
        return;
      }

      // Ctrl/Cmd + S: Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (isDirty) {
          saveFlow()
            .then(() => {
              toast.success('Flow saved');
            })
            .catch(() => {
              // Error already handled by saveFlow
            });
        } else {
          toast.info('No changes to save');
        }
      }

      // Ctrl/Cmd + Shift + V: Validate
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'v') {
        e.preventDefault();
        validateFlow()
          .then(() => {
            toast.success('Validation complete');
          })
          .catch(() => {
            // Error already handled by validateFlow
          });
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDirty, saveFlow, validateFlow, setSelectedSegment]);
}
