import { lazy } from 'react';

// Lazy load heavy components
export const FlowDesignerPage = lazy(() =>
  import('./pages/FlowDesignerPage').then((m) => ({ default: m.FlowDesignerPage })),
);

export const ImportDialog = lazy(() =>
  import('./components/import-export/ImportDialog').then((m) => ({ default: m.ImportDialog })),
);

export const ExportDialog = lazy(() =>
  import('./components/import-export/ExportDialog').then((m) => ({ default: m.ExportDialog })),
);

// Export types from flow and graph types
export * from './types/flow.types';
export * from './types/graph.types';

// Export hooks
export * from './hooks/useFlowQuery';
export * from './hooks/useKeyboardShortcuts';
export * from './hooks/useUnsavedChangesWarning';

// Export stores
export * from './stores/flow-store';

// Export utilities
export * from './utils/errorTracking';
export * from './utils/performance';
export * from './utils/viewport';
