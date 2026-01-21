import { ConfigItem, Transition, TransitionOutcome, SegmentSnapshot } from '@/features/flow-designer/types/flow.types';

/**
 * Legacy segment format (before array migration)
 */
type LegacySegment = Omit<SegmentSnapshot, 'config' | 'transitions'> & {
  config: Record<string, unknown> | ConfigItem[];
  transitions?: {
    on?: Record<string, TransitionOutcome>;
    default?: TransitionOutcome;
  } | Transition[];
  configMetadata?: Record<string, { order?: number; isDisplayed?: boolean; isEditable?: boolean }>;
};

/**
 * Migrate old object-based config to new array-based format
 */
export function migrateConfigToArray(
  config: Record<string, unknown> | ConfigItem[],
  metadata?: Record<string, { order?: number; isDisplayed?: boolean; isEditable?: boolean }>
): ConfigItem[] {
  if (Array.isArray(config)) {
    return config;
  }

  const entries = Object.entries(config);
  const items = entries.map(([key, value]) => ({
    key,
    value,
    isDisplayed: metadata?.[key]?.isDisplayed ?? true,
    isEditable: metadata?.[key]?.isEditable ?? true,
    _order: metadata?.[key]?.order ?? 999,
  }));

  items.sort((a, b) => a._order - b._order);
  return items.map(({ _order, ...rest }) => rest);
}

/**
 * Migrate old transitions to array format
 */
export function migrateTransitionsToArray(
  transitions?:
    | {
        on?: Record<string, TransitionOutcome>;
        default?: TransitionOutcome;
      }
    | Transition[]
): Transition[] {
  if (Array.isArray(transitions)) {
    return transitions;
  }

  const result: Transition[] = [];

  if (transitions?.on) {
    Object.entries(transitions.on).forEach(([resultName, outcome]) => {
      result.push({ resultName, outcome, isDefault: false });
    });
  }

  if (transitions?.default) {
    result.push({
      resultName: 'default',
      outcome: transitions.default,
      isDefault: true,
    });
  }

  return result;
}

/**
 * Normalize segment to use array-based structures
 * Handles both legacy object-based and modern array-based formats
 */
export function normalizeSegment(segment: LegacySegment | SegmentSnapshot): SegmentSnapshot {
  return {
    ...segment,
    config: migrateConfigToArray(segment.config, segment.configMetadata),
    transitions: migrateTransitionsToArray(segment.transitions),
    configMetadata: undefined,
  };
}
