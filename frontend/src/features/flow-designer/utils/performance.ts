/**
 * Track performance metrics
 */
export function trackPerformance(metric: string, value: number, metadata?: Record<string, unknown>) {
  // Send to analytics service
  if (typeof window !== 'undefined' && (window as any).analytics) {
    (window as any).analytics.track('Flow Designer Performance', {
      metric,
      value,
      timestamp: Date.now(),
      ...metadata,
    });
  }

  // Also log to console in development
  if (import.meta.env.DEV) {
    console.log(`[Performance] ${metric}: ${value.toFixed(2)}ms`, metadata);
  }
}

/**
 * Create a performance tracker
 */
export class PerformanceTracker {
  private startTime: number;
  private metric: string;

  constructor(metric: string) {
    this.metric = metric;
    this.startTime = performance.now();
  }

  /**
   * End tracking and report
   */
  end(metadata?: Record<string, unknown>) {
    const duration = performance.now() - this.startTime;
    trackPerformance(this.metric, duration, metadata);
    return duration;
  }
}

/**
 * Measure function execution time
 */
export async function measureAsync<T>(
  metric: string,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  const tracker = new PerformanceTracker(metric);
  try {
    const result = await fn();
    tracker.end({ ...metadata, success: true });
    return result;
  } catch (error) {
    tracker.end({ ...metadata, success: false, error: String(error) });
    throw error;
  }
}

/**
 * Measure synchronous function execution time
 */
export function measure<T>(
  metric: string,
  fn: () => T,
  metadata?: Record<string, unknown>
): T {
  const tracker = new PerformanceTracker(metric);
  try {
    const result = fn();
    tracker.end({ ...metadata, success: true });
    return result;
  } catch (error) {
    tracker.end({ ...metadata, success: false, error: String(error) });
    throw error;
  }
}

/**
 * Track component render time
 */
export function useRenderTracking(componentName: string) {
  if (import.meta.env.DEV) {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      console.log(`[Render] ${componentName}: ${duration.toFixed(2)}ms`);
    };
  }
  return () => {};
}
