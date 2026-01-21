/**
 * CUSTOM NODES DEMO PAGE
 *
 * Demonstrates the StartNode and SegmentNodeOption2 (Card/Box style)
 * with a simple call flow example.
 */

import { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { StartNode, StartNodeData } from '@/features/flow-designer/components/canvas/StartNode';
import { SegmentNodeOption2, SegmentNodeData } from '@/features/flow-designer/components/canvas/SegmentNodeStyleExamples';

type DemoNode = Node<SegmentNodeData, 'segment'> | Node<StartNodeData, 'startNode'>;

// Sample data for the demo
const SAMPLE_START_DATA: StartNodeData = {
  sourceId: '+3227805050',
  routingId: 'demo-routing-001',
  supportedLanguages: ['nl-BE', 'fr-BE', 'en-GB', 'de-BE'],
  defaultLanguage: 'nl-BE',
  schedulerId: 1,
  featureFlags: {
    enableVoicemail: true,
    enableCallback: false,
  },
  config: {
    maxWaitTime: 300,
    musicOnHold: 'classic.wav',
  },
};

const SAMPLE_SEGMENT_1: SegmentNodeData = {
  segmentName: 'get_language',
  displayName: 'Language Selection',
  segmentType: 'language',
  transitions: [
    { resultName: 'nl-BE', nextSegment: 'check_scheduler', isDefault: false },
    { resultName: 'fr-BE', nextSegment: 'check_scheduler', isDefault: false },
    { resultName: 'en-GB', nextSegment: 'check_scheduler', isDefault: false },
    { resultName: 'default', nextSegment: 'check_scheduler', isDefault: true },
  ],
  config: {
    messageKey: 'LANG_PROMPT',
    maxAttempts: 3,
  },
};

const SAMPLE_SEGMENT_2: SegmentNodeData = {
  segmentName: 'check_scheduler',
  displayName: 'Business Hours Check',
  segmentType: 'scheduler',
  transitions: [
    { resultName: 'OPEN', nextSegment: 'queue', isDefault: false },
    { resultName: 'CLOSED', nextSegment: 'voicemail', isDefault: false },
    { resultName: 'HOLIDAY', nextSegment: 'disconnect', isDefault: false },
  ],
  config: {
    schedulerId: 1,
  },
};

const SAMPLE_SEGMENT_3: SegmentNodeData = {
  segmentName: 'queue',
  displayName: 'Agent Queue',
  segmentType: 'queue',
  transitions: [
    { resultName: 'CONNECTED', nextSegment: 'disconnect', isDefault: false },
    { resultName: 'TIMEOUT', nextSegment: 'voicemail', isDefault: false },
    { resultName: 'ABANDONED', nextSegment: 'disconnect', isDefault: false },
  ],
  config: {
    queueId: 'main-queue',
    maxWaitTime: 300,
  },
};

const SAMPLE_SEGMENT_4: SegmentNodeData = {
  segmentName: 'voicemail',
  displayName: 'Voicemail',
  segmentType: 'voicemail',
  transitions: [
    { resultName: 'RECORDED', nextSegment: 'disconnect', isDefault: false },
    { resultName: 'SKIPPED', nextSegment: 'disconnect', isDefault: true },
  ],
  config: {
    maxRecordingTime: 180,
  },
};

const SAMPLE_SEGMENT_5: SegmentNodeData = {
  segmentName: 'disconnect',
  displayName: 'End Call',
  segmentType: 'terminate',
  transitions: [],
  config: {},
};

function generateInitialNodes(): DemoNode[] {
  return [
    // START NODE
    {
      id: '__START__',
      type: 'startNode',
      position: { x: 50, y: 50 },
      data: SAMPLE_START_DATA as StartNodeData,
      sourcePosition: Position.Bottom,
    } as Node<StartNodeData, 'startNode'>,
    // Language Selection
    {
      id: 'get_language',
      type: 'segment',
      position: { x: 450, y: 20 },
      data: SAMPLE_SEGMENT_1 as SegmentNodeData,
      targetPosition: Position.Left,
      sourcePosition: Position.Right,
    } as Node<SegmentNodeData, 'segment'>,
    // Business Hours Check
    {
      id: 'check_scheduler',
      type: 'segment',
      position: { x: 850, y: 50 },
      data: SAMPLE_SEGMENT_2 as SegmentNodeData,
      targetPosition: Position.Left,
      sourcePosition: Position.Right,
    } as Node<SegmentNodeData, 'segment'>,
    // Queue
    {
      id: 'queue',
      type: 'segment',
      position: { x: 1250, y: 20 },
      data: SAMPLE_SEGMENT_3 as SegmentNodeData,
      targetPosition: Position.Left,
      sourcePosition: Position.Right,
    } as Node<SegmentNodeData, 'segment'>,
    // Voicemail
    {
      id: 'voicemail',
      type: 'segment',
      position: { x: 1250, y: 280 },
      data: SAMPLE_SEGMENT_4 as SegmentNodeData,
      targetPosition: Position.Left,
      sourcePosition: Position.Right,
    } as Node<SegmentNodeData, 'segment'>,
    // Disconnect
    {
      id: 'disconnect',
      type: 'segment',
      position: { x: 1650, y: 150 },
      data: SAMPLE_SEGMENT_5 as SegmentNodeData,
      targetPosition: Position.Left,
      sourcePosition: Position.Right,
    } as Node<SegmentNodeData, 'segment'>,
  ];
}

function generateInitialEdges(): Edge[] {
  return [
    // START to Language Selection
    {
      id: 'start-to-lang',
      source: '__START__',
      target: 'get_language',
      label: 'Start Flow',
      animated: true,
      style: { stroke: '#3b82f6', strokeWidth: 2 },
    },
    // Language Selection to Scheduler (all language options)
    {
      id: 'lang-nl-to-scheduler',
      source: 'get_language',
      sourceHandle: 'transition-nl-BE',
      target: 'check_scheduler',
      label: 'nl-BE',
      style: { stroke: '#60a5fa' },
    },
    {
      id: 'lang-fr-to-scheduler',
      source: 'get_language',
      sourceHandle: 'transition-fr-BE',
      target: 'check_scheduler',
      label: 'fr-BE',
      style: { stroke: '#60a5fa' },
    },
    {
      id: 'lang-en-to-scheduler',
      source: 'get_language',
      sourceHandle: 'transition-en-GB',
      target: 'check_scheduler',
      label: 'en-GB',
      style: { stroke: '#60a5fa' },
    },
    {
      id: 'lang-default-to-scheduler',
      source: 'get_language',
      sourceHandle: 'transition-default',
      target: 'check_scheduler',
      label: 'default',
      style: { stroke: '#fbbf24', strokeWidth: 2 },
    },
    // Scheduler to Queue (OPEN)
    {
      id: 'scheduler-open-to-queue',
      source: 'check_scheduler',
      sourceHandle: 'transition-OPEN',
      target: 'queue',
      label: 'OPEN',
      style: { stroke: '#10b981' },
    },
    // Scheduler to Voicemail (CLOSED)
    {
      id: 'scheduler-closed-to-voicemail',
      source: 'check_scheduler',
      sourceHandle: 'transition-CLOSED',
      target: 'voicemail',
      label: 'CLOSED',
      style: { stroke: '#f59e0b' },
    },
    // Scheduler to Disconnect (HOLIDAY)
    {
      id: 'scheduler-holiday-to-disconnect',
      source: 'check_scheduler',
      sourceHandle: 'transition-HOLIDAY',
      target: 'disconnect',
      label: 'HOLIDAY',
      style: { stroke: '#ef4444' },
    },
    // Queue to Disconnect (CONNECTED)
    {
      id: 'queue-connected-to-disconnect',
      source: 'queue',
      sourceHandle: 'transition-CONNECTED',
      target: 'disconnect',
      label: 'CONNECTED',
      style: { stroke: '#10b981' },
    },
    // Queue to Voicemail (TIMEOUT)
    {
      id: 'queue-timeout-to-voicemail',
      source: 'queue',
      sourceHandle: 'transition-TIMEOUT',
      target: 'voicemail',
      label: 'TIMEOUT',
      style: { stroke: '#f59e0b' },
    },
    // Queue to Disconnect (ABANDONED)
    {
      id: 'queue-abandoned-to-disconnect',
      source: 'queue',
      sourceHandle: 'transition-ABANDONED',
      target: 'disconnect',
      label: 'ABANDONED',
      style: { stroke: '#ef4444' },
    },
    // Voicemail to Disconnect (both)
    {
      id: 'voicemail-recorded-to-disconnect',
      source: 'voicemail',
      sourceHandle: 'transition-RECORDED',
      target: 'disconnect',
      label: 'RECORDED',
      style: { stroke: '#10b981' },
    },
    {
      id: 'voicemail-skipped-to-disconnect',
      source: 'voicemail',
      sourceHandle: 'transition-SKIPPED',
      target: 'disconnect',
      label: 'SKIPPED',
      style: { stroke: '#94a3b8' },
    },
  ];
}

export function CustomNodesDemoPage() {
  const [nodes, , onNodesChange] = useNodesState(generateInitialNodes());
  const [edges, , onEdgesChange] = useEdgesState(generateInitialEdges());

  const nodeTypes = useMemo(
    () => ({
      startNode: StartNode,
      segment: SegmentNodeOption2,
    }) as any,  // Type assertion needed for demo with different node data types
    []
  );

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.1 }}
      >
        <Background color="#e5e7eb" gap={20} />
        <Controls />
        <MiniMap nodeColor={(node) => {
          if (node.type === 'startNode') return '#3b82f6';
          return '#60a5fa';
        }} />

        {/* Info Panel */}
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            backgroundColor: 'white',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
            maxWidth: '300px',
            fontSize: '13px',
            zIndex: 4,
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '16px' }}>
            Custom Nodes Demo
          </div>
          <div style={{ color: '#666', lineHeight: 1.6 }}>
            <p style={{ marginBottom: '8px' }}>
              This demo shows:
            </p>
            <ul style={{ paddingLeft: '20px', marginBottom: '8px' }}>
              <li><strong>StartNode</strong> - Routing configuration entry point</li>
              <li><strong>SegmentNodeOption2</strong> - Card/Box style with transition labels</li>
            </ul>
            <p style={{ fontSize: '12px', color: '#888' }}>
              Each transition label has its own handle that connects to the next segment.
            </p>
          </div>
        </div>
      </ReactFlow>
    </div>
  );
}
