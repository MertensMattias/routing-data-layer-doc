/**
 * Merge dictionary hooks with instance hooks
 * Instance overrides dictionary
 */
export function mergeHooks(
  dictionaryHooks: Record<string, string>,
  instanceHooks: Record<string, string>,
): Record<string, string> {
  return {
    ...(dictionaryHooks ?? {}),
    ...(instanceHooks ?? {}),
  };
}

/**
 * Get instance-only hooks (excluding dictionary defaults)
 * Used when saving to backend (only save overrides)
 */
export function getInstanceOnlyHooks(
  dictionaryHooks: Record<string, string>,
  instanceHooks: Record<string, string>,
): Record<string, string> {
  const instanceOnly: Record<string, string> = {};

  for (const [key, value] of Object.entries(instanceHooks)) {
    // Include if not in dictionary or if value differs
    if (!dictionaryHooks[key] || dictionaryHooks[key] !== value) {
      instanceOnly[key] = value;
    }
  }

  return instanceOnly;
}
