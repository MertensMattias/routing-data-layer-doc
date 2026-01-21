import { useEffect, useRef } from 'react';
import { useFlowStore } from '@/features/flow-designer/stores/flow-store';

/**
 * Manage focus when selecting segments
 */
export function useFocusManagement() {
  const { selectedSegmentId } = useFlowStore();
  const previousSelection = useRef<string | null>(null);

  useEffect(() => {
    if (selectedSegmentId && selectedSegmentId !== previousSelection.current) {
      // Focus on properties panel when segment selected
      const propertiesPanel = document.querySelector('[role="complementary"]');
      if (propertiesPanel instanceof HTMLElement) {
        // Focus on first focusable element in properties panel
        const firstFocusable = propertiesPanel.querySelector<HTMLElement>(
          'input, textarea, select, button, [tabindex]:not([tabindex="-1"])'
        );

        if (firstFocusable) {
          firstFocusable.focus();
        } else {
          // If no focusable element, focus on the panel itself
          propertiesPanel.setAttribute('tabindex', '-1');
          propertiesPanel.focus();
        }
      }

      previousSelection.current = selectedSegmentId;
    } else if (!selectedSegmentId && previousSelection.current) {
      // When deselecting, focus back on the canvas
      const canvas = document.querySelector('[data-testid="flow-canvas"]');
      if (canvas instanceof HTMLElement) {
        canvas.focus();
      }

      previousSelection.current = null;
    }
  }, [selectedSegmentId]);
}

/**
 * Manage focus trap within a modal or dialog
 */
export function useFocusTrap(
  ref: React.RefObject<HTMLElement>,
  isActive: boolean
) {
  useEffect(() => {
    if (!isActive || !ref.current) return;

    const element = ref.current;
    const focusableElements = element.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element on mount
    firstElement?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    element.addEventListener('keydown', handleKeyDown);

    return () => {
      element.removeEventListener('keydown', handleKeyDown);
    };
  }, [ref, isActive]);
}

/**
 * Restore focus when a component unmounts
 */
export function useRestoreFocus(isActive: boolean) {
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isActive) {
      // Save currently focused element
      previousActiveElement.current = document.activeElement as HTMLElement;
    }

    return () => {
      // Restore focus when unmounting
      if (previousActiveElement.current && typeof previousActiveElement.current.focus === 'function') {
        previousActiveElement.current.focus();
      }
    };
  }, [isActive]);
}
