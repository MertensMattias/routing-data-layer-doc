import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ExternalLink, FileCode } from 'lucide-react';

/**
 * Demo page with links to HTML mockups
 */
export function DemoPage() {
  const demos = [
    {
      title: 'Custom Nodes Demo',
      description: 'StartNode + SegmentNodeOption2 (Card/Box style) with sample call flow',
      path: '/demo/custom-nodes',
      isInternal: true,
    },
    {
      title: 'Context Routing Mockup',
      description: 'Basic flow designer with context routing visualization',
      path: '/docs/flow-designer-context-routing-mockup.html',
      isInternal: false,
    },
    {
      title: 'Context Router Node',
      description: 'Advanced router node with context key handling',
      path: '/docs/flow-designer-context-router-node.html',
      isInternal: false,
    },
    {
      title: 'Context Selector',
      description: 'Context selector UI component demo',
      path: '/docs/flow-designer-context-selector.html',
      isInternal: false,
    },
    {
      title: 'Expanded Edges (Option 1)',
      description: 'Flow visualization with expanded edge details',
      path: '/docs/flow-designer-option1-expanded-edges.html',
      isInternal: false,
    },
    {
      title: 'Simple Context Key',
      description: 'Simplified context key implementation',
      path: '/docs/flow-designer-simple-contextkey.html',
      isInternal: false,
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Flow Designer Demos</h1>
        <p className="text-gray-600">
          HTML mockups and prototypes for the flow designer functionality
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {demos.map((demo) => (
          <Card key={demo.path} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <FileCode className="w-8 h-8 text-blue-600 mb-2" />
                {demo.isInternal ? (
                  <a
                    href={demo.path}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                ) : (
                  <a
                    href={demo.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                )}
              </div>
              <CardTitle className="text-lg">{demo.title}</CardTitle>
              <CardDescription>{demo.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {demo.isInternal ? (
                <a
                  href={demo.path}
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Open Demo
                  <ExternalLink className="w-4 h-4" />
                </a>
              ) : (
                <a
                  href={demo.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Open Demo
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12">
        <Card>
          <CardHeader>
            <CardTitle>About These Demos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              These HTML mockups were created as prototypes during the Flow Designer development.
              They demonstrate various UI patterns and interactions for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
              <li>Visual flow graph rendering with React Flow</li>
              <li>Context-based routing and decision nodes</li>
              <li>Edge labeling and transition visualization</li>
              <li>Interactive node selection and editing</li>
              <li>Context key management and propagation</li>
            </ul>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> The actual Flow Designer is implemented in React at{' '}
                <code className="px-1 py-0.5 bg-blue-100 rounded">/designer/:routingId</code>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
