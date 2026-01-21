import { Position, Node } from '@xyflow/react';

/**
 * Calculate optimal handle position based on relative node positions
 * Returns the best source and target positions for an edge connection
 */
export function calculateHandlePositions(
  sourceNode: Node,
  targetNode: Node
): { sourcePosition: Position; targetPosition: Position } {
  const dx = targetNode.position.x - sourceNode.position.x;
  const dy = targetNode.position.y - sourceNode.position.y;

  // Determine dominant direction
  const isHorizontalDominant = Math.abs(dx) > Math.abs(dy);

  if (isHorizontalDominant) {
    // Horizontal flow (left-right)
    if (dx > 0) {
      return { sourcePosition: Position.Right, targetPosition: Position.Left };
    } else {
      return { sourcePosition: Position.Left, targetPosition: Position.Right };
    }
  } else {
    // Vertical flow (top-bottom)
    if (dy > 0) {
      return { sourcePosition: Position.Bottom, targetPosition: Position.Top };
    } else {
      return { sourcePosition: Position.Top, targetPosition: Position.Bottom };
    }
  }
}

/**
 * Calculate handle position for a specific source node to target node
 * Used for nodes with multiple source handles (transitions)
 * Always returns Left/Right, never Top/Bottom for transitions
 */
export function calculateSourceHandlePosition(
  sourceNode: Node,
  targetNode: Node
): Position {
  const dx = targetNode.position.x - sourceNode.position.x;

  // For transitions, only use left/right based on horizontal position
  // Ignore vertical distance entirely
  return dx > 0 ? Position.Right : Position.Left;
}

/**
 * Calculate target handle ID based on source node position
 * Returns the handle ID that should be used on the target node
 */
export function calculateTargetHandleId(
  sourceNode: Node,
  targetNode: Node
): string {
  const dx = targetNode.position.x - sourceNode.position.x;
  const dy = targetNode.position.y - sourceNode.position.y;

  // Determine which direction is dominant
  const isHorizontalDominant = Math.abs(dx) > Math.abs(dy);

  if (isHorizontalDominant) {
    // Horizontal flow - target should receive from left or right
    return dx > 0 ? 'target-left' : 'target-right';
  } else {
    // Vertical flow - target should receive from top or bottom
    return dy > 0 ? 'target-top' : 'target-bottom';
  }
}

/**
 * Get handle style based on position
 * Returns CSS positioning styles for the handle
 */
export function getHandleStyle(position: Position): React.CSSProperties {
  const baseStyle: React.CSSProperties = {
    width: 12,
    height: 12,
    background: '#3b82f6',
    border: '2px solid white',
  };

  switch (position) {
    case Position.Right:
      return { ...baseStyle, right: -6 };
    case Position.Left:
      return { ...baseStyle, left: -6 };
    case Position.Bottom:
      return { ...baseStyle, bottom: -6 };
    case Position.Top:
      return { ...baseStyle, top: -6 };
    default:
      return baseStyle;
  }
}
