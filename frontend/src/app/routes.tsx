import { Navigate, type RouteObject } from 'react-router-dom';
import { AppLayout } from '@/components/layout';

// Feature pages
import { RoutingPage } from '@/features/routing';
import { SegmentsPage, SegmentSettingsPage } from '@/features/segments';
import { MessagesPage, MessageDetailPage, MessageSettingsPage } from '@/features/messages';
import { AdminPage, ConfigurationPage } from '@/features/configuration';
import { FlowDesignerPage } from '@/features/flow-designer/pages/FlowDesignerPage';

// Standalone pages (app-specific, not part of feature modules)
import { HomePage } from './pages/HomePage';
import { DemoPage } from './pages/DemoPage';
import { CustomNodesDemoPage } from './pages/CustomNodesDemoPage';
import FlowEditorPage from './pages/FlowEditorPage';

// Route configuration for data router
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/home" replace /> },
      { path: 'home', element: <HomePage /> },
      { path: 'routing', element: <RoutingPage /> },
      {
        path: 'segments',
        children: [
          { index: true, element: <SegmentsPage /> },
          { path: 'settings', element: <SegmentSettingsPage /> },
        ],
      },
      {
        path: 'messages',
        children: [
          { index: true, element: <MessagesPage /> },
          { path: 'stores/:storeId/messages/:messageKey', element: <MessageDetailPage /> },
          { path: 'settings', element: <MessageSettingsPage /> },
        ],
      },
      { path: 'flows/:routingId', element: <FlowEditorPage /> },
      { path: 'designer/:routingId', element: <FlowDesignerPage /> },
      { path: 'designer/:routingId/drafts/:changeSetId', element: <FlowDesignerPage /> },
      { path: 'demo', element: <DemoPage /> },
      { path: 'demo/custom-nodes', element: <CustomNodesDemoPage /> },
      { path: 'demo/*', element: <DemoPage /> },
      { path: 'admin', element: <AdminPage /> },
      { path: 'config', element: <ConfigurationPage /> },
    ],
  },
];
