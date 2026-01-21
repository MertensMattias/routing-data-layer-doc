/**
 * Data transformation utilities for export/import operations
 */

/**
 * Deep clone an object (safe for JSON-serializable objects)
 * @param obj Object to clone
 * @returns Deep copy of the object
 *
 * @example
 * ```typescript
 * const original = { a: { b: 1 } };
 * const cloned = deepClone(original);
 * cloned.a.b = 2;
 * // original.a.b is still 1
 * ```
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Compare two objects for equality (deep comparison)
 * @param obj1 First object
 * @param obj2 Second object
 * @returns true if objects are deeply equal
 *
 * @example
 * ```typescript
 * deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 }) // true
 * deepEqual({ a: 1 }, { a: 2 }) // false
 * ```
 */
export function deepEqual(obj1: unknown, obj2: unknown): boolean {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

/**
 * Merge objects (shallow merge, second object overwrites first)
 * @param source Source object
 * @param updates Updates to apply
 * @returns Merged object
 *
 * @example
 * ```typescript
 * const merged = mergeObjects({ a: 1, b: 2 }, { b: 3, c: 4 });
 * // Returns: { a: 1, b: 3, c: 4 }
 * ```
 */
export function mergeObjects<T extends Record<string, unknown>>(source: T, updates: Partial<T>): T {
  return { ...source, ...updates };
}

/**
 * Filter object to only include specific keys
 * @param obj Object to filter
 * @param keys Keys to include
 * @returns Filtered object with only specified keys
 *
 * @example
 * ```typescript
 * const filtered = filterObjectKeys({ a: 1, b: 2, c: 3 }, ['a', 'c']);
 * // Returns: { a: 1, c: 3 }
 * ```
 */
export function filterObjectKeys<T extends Record<string, unknown>>(
  obj: T,
  keys: string[],
): Partial<T> {
  const result: Partial<T> = {};
  for (const key of keys) {
    if (key in obj) {
      result[key as keyof T] = obj[key as keyof T];
    }
  }
  return result;
}
