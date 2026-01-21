/**
 * Utilities for extracting message keys from segment configurations
 *
 * These functions recursively traverse config objects to find all messageKey references,
 * which are used to determine which messages are needed for a flow export.
 */

/**
 * Recursively extract all messageKey references from a config object
 * Used to find all messages referenced in segment configs
 *
 * @param config Configuration object to search
 * @returns Array of unique message keys found (sorted alphabetically)
 *
 * @example
 * ```typescript
 * const config = {
 *   messageKey: 'welcome_message',
 *   nested: {
 *     prompt: {
 *       messageKey: 'prompt_message'
 *     }
 *   }
 * };
 * const keys = extractMessageKeys(config);
 * // Returns: ['prompt_message', 'welcome_message']
 * ```
 */
export function extractMessageKeys(config: Record<string, unknown>): string[] {
  const keys = new Set<string>();

  function traverse(obj: unknown): void {
    if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
      return; // Skip primitive values
    }

    if (Array.isArray(obj)) {
      obj.forEach((item) => traverse(item));
      return;
    }

    if (obj === null || typeof obj !== 'object') {
      return;
    }

    const record = obj as Record<string, unknown>;

    // Check if this object has a messageKey property
    if ('messageKey' in record && typeof record.messageKey === 'string') {
      keys.add(record.messageKey);
    }

    // Recurse into all properties
    for (const value of Object.values(record)) {
      traverse(value);
    }
  }

  traverse(config);
  return Array.from(keys).sort(); // Sort for consistency
}

/**
 * Extract message keys from multiple segment configurations
 *
 * @param segments Array of segments with config objects or arrays
 * @returns Array of unique message keys found across all segments (sorted)
 *
 * @example
 * ```typescript
 * const segments = [
 *   { config: { messageKey: 'welcome' } },
 *   { config: { messageKey: 'goodbye' } }
 * ];
 * const keys = extractMessageKeysFromSegments(segments);
 * // Returns: ['goodbye', 'welcome']
 * ```
 */
export function extractMessageKeysFromSegments(
  segments: { config: Record<string, unknown> | Array<{ key: string; value?: unknown }> }[],
): string[] {
  const allKeys = new Set<string>();

  for (const segment of segments) {
    // Handle both object-based and array-based config formats
    let configObj: Record<string, unknown>;

    if (Array.isArray(segment.config)) {
      // Convert array format to object format
      configObj = segment.config.reduce(
        (acc, item) => {
          if (item.value !== undefined) {
            acc[item.key] = item.value;
          }
          return acc;
        },
        {} as Record<string, unknown>,
      );
    } else {
      configObj = segment.config;
    }

    const keys = extractMessageKeys(configObj);
    keys.forEach((k) => allKeys.add(k));
  }

  return Array.from(allKeys).sort();
}
