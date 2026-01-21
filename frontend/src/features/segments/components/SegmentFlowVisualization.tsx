import { useCallback } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ConnectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const initialNodes: Node[] = [
  {
    id: 'start',
    type: 'input',
    data: { label: 'Incoming Call' },
    position: { x: 250, y: 0 },
    style: { background: '#3b82f6', color: 'white', border: '1px solid #2563eb' },
  },
  {
    id: 'menu-1',
    data: { label: 'Main Menu\n(Press 1-Sales, 2-Support, 3-Billing)' },
    position: { x: 200, y: 100 },
    style: { background: '#8b5cf6', color: 'white', border: '1px solid #7c3aed' },
  },
  {
    id: 'check-hours',
    data: { label: 'Business Hours Check' },
    position: { x: 200, y: 200 },
    style: { background: '#f59e0b', color: 'white', border: '1px solid #d97706' },
  },
  {
    id: 'sales-queue',
    data: { label: 'Sales Queue' },
    position: { x: 50, y: 320 },
    style: { background: '#10b981', color: 'white', border: '1px solid #059669' },
  },
  {
    id: 'support-queue',
    data: { label: 'Support Queue' },
    position: { x: 200, y: 320 },
    style: { background: '#10b981', color: 'white', border: '1px solid #059669' },
  },
  {
    id: 'billing-queue',
    data: { label: 'Billing Queue' },
    position: { x: 350, y: 320 },
    style: { background: '#10b981', color: 'white', border: '1px solid #059669' },
  },
  {
    id: 'voicemail',
    data: { label: 'After Hours\nVoicemail' },
    position: { x: 450, y: 200 },
    style: { background: '#ef4444', color: 'white', border: '1px solid #dc2626' },
  },
  {
    id: 'end',
    type: 'output',
    data: { label: 'End Call' },
    position: { x: 250, y: 450 },
    style: { background: '#6b7280', color: 'white', border: '1px solid #4b5563' },
  },
];

const initialEdges: Edge[] = [
  { id: 'e-start-menu', source: 'start', target: 'menu-1', animated: true },
  { id: 'e-menu-check', source: 'menu-1', target: 'check-hours', label: 'Route Selected' },
  { id: 'e-check-sales', source: 'check-hours', target: 'sales-queue', label: 'Press 1 (Open)' },
  { id: 'e-check-support', source: 'check-hours', target: 'support-queue', label: 'Press 2 (Open)' },
  { id: 'e-check-billing', source: 'check-hours', target: 'billing-queue', label: 'Press 3 (Open)' },
  { id: 'e-check-voicemail', source: 'check-hours', target: 'voicemail', label: 'After Hours', style: { stroke: '#ef4444' } },
  { id: 'e-sales-end', source: 'sales-queue', target: 'end' },
  { id: 'e-support-end', source: 'support-queue', target: 'end' },
  { id: 'e-billing-end', source: 'billing-queue', target: 'end' },
  { id: 'e-voicemail-end', source: 'voicemail', target: 'end' },
];

export function SegmentFlowVisualization() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="h-full w-full bg-gray-50 rounded-lg border border-gray-200">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        connectionMode={ConnectionMode.Loose}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            return node.style?.background as string || '#6b7280';
          }}
          className="bg-white border border-gray-200"
        />
      </ReactFlow>
    </div>
  );
}
