import { Node, Viewport } from '@xyflow/react';

/**
 * Check if node is visible in viewport
 */
export function isNodeVisible(node: Node, viewport: Viewport): boolean {
  if (!node.position) return false;

  const { x, y, zoom } = viewport;
  const nodeX = node.position.x * zoom + x;
  const nodeY = node.position.y * zoom + y;
  const nodeWidth = (node.width || 200) * zoom;
  const nodeHeight = (node.height || 80) * zoom;

  // Check if node is within screen bounds (with margin)
  const margin = 100;
  return (
    nodeX + nodeWidth > -margin &&
    nodeX < window.innerWidth + margin &&
    nodeY + nodeHeight > -margin &&
    nodeY < window.innerHeight + margin
  );
}

/**
 * Get visible nodes from viewport
 */
export function getVisibleNodes(nodes: Node[], viewport: Viewport): Node[] {
  return nodes.filter(node => isNodeVisible(node, viewport));
}

/**
 * Calculate optimal viewport for nodes
 */
export function calculateOptimalViewport(nodes: Node[]): Viewport {
  if (nodes.length === 0) {
    return { x: 0, y: 0, zoom: 1 };
  }

  // Find bounds
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  nodes.forEach(node => {
    if (!node.position) return;

    const width = node.width || 200;
    const height = node.height || 80;

    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + width);
    maxY = Math.max(maxY, node.position.y + height);
  });

  // Calculate center and zoom
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const width = maxX - minX;
  const height = maxY - minY;

  // Calculate zoom to fit
  const padding = 100;
  const zoomX = (window.innerWidth - padding * 2) / width;
  const zoomY = (window.innerHeight - padding * 2) / height;
  const zoom = Math.min(zoomX, zoomY, 1.5); // Max zoom of 1.5

  return {
    x: window.innerWidth / 2 - centerX * zoom,
    y: window.innerHeight / 2 - centerY * zoom,
    zoom,
  };
}
