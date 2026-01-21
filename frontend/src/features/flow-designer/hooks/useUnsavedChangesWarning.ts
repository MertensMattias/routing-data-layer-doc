import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';
import { useFlowStore } from '@/features/flow-designer/stores/flow-store';

/**
 * Warn user before leaving page or navigating away with unsaved changes.
 * Handles both browser navigation (back/forward/close/refresh) and React Router navigation.
 * 
 * Usage: Call this hook in the Flow Designer page component.
 */
export function useUnsavedChangesWarning() {
  const hasUnsavedChanges = useFlowStore((state) => state.hasUnsavedChanges);

  // Block browser navigation (back/forward/close/refresh)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // Block React Router navigation (sidebar, menu, programmatic)
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges() && currentLocation.pathname !== nextLocation.pathname
  );

  // Handle blocked navigation with a confirmation dialog
  useEffect(() => {
    if (blocker.state === 'blocked') {
      // Using window.confirm for simplicity and consistency with browser's beforeunload
      // Could be replaced with a custom AlertDialog for more consistent UX
      const shouldProceed = window.confirm(
        'You have unsaved changes. Do you want to leave without saving?'
      );
      if (shouldProceed) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker]);
}
