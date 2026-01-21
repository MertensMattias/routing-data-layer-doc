/**
 * Report errors to tracking service
 */
export function reportError(error: Error, context?: Record<string, unknown>) {
  // Integrate with Sentry, Datadog, etc.
  console.error('Flow Designer Error:', error, context);

  // Check if Sentry is available
  if (typeof window !== 'undefined' && (window as any).Sentry) {
    (window as any).Sentry.captureException(error, {
      tags: {
        feature: 'flow-designer',
      },
      extra: context,
    });
  }
}

/**
 * Report warning to tracking service
 */
export function reportWarning(message: string, context?: Record<string, unknown>) {
  console.warn('Flow Designer Warning:', message, context);

  if (typeof window !== 'undefined' && (window as any).Sentry) {
    (window as any).Sentry.captureMessage(message, {
      level: 'warning',
      tags: {
        feature: 'flow-designer',
      },
      extra: context,
    });
  }
}

/**
 * Report info to tracking service
 */
export function reportInfo(message: string, context?: Record<string, unknown>) {
  console.info('Flow Designer Info:', message, context);

  if (typeof window !== 'undefined' && (window as any).Sentry) {
    (window as any).Sentry.captureMessage(message, {
      level: 'info',
      tags: {
        feature: 'flow-designer',
      },
      extra: context,
    });
  }
}
