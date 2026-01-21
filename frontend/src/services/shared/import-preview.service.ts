export interface ImportConflict {
  suggestedAction: 'create' | 'update' | 'skip';
  messageKey?: string;
  language?: string;
  entityType?: string;
  entityId?: string;
  [key: string]: unknown;
}

export interface ImportChanges {
  willCreate: number;
  willUpdate: number;
  willSkip?: number;
}

export interface ImportChangesSummary {
  create: number;
  update: number;
  skip: number;
}

export interface ProcessedImportPreview {
  isValid: boolean;
  validatedAt: string;
  totalChanges: number;
  changesByType: Record<string, ImportChangesSummary>;
  criticalConflicts: ImportConflict[];
  warningConflicts: ImportConflict[];
  affectedEntities: string[];
  estimatedDuration: string; // "< 1 minute", "1-5 minutes", etc.
  riskLevel: 'low' | 'medium' | 'high';
  recommendedAction: string;
}

/**
 * ImportPreviewService - Processes raw preview responses into user-friendly format
 */
export class ImportPreviewService {
  /**
   * Process raw preview response into user-friendly format
   */
  static processPreview(raw: {
    isValid?: boolean;
    validatedAt?: string;
    conflicts?: ImportConflict[];
    summary?: {
      flows?: ImportChanges;
      messages?: ImportChanges;
      routing?: ImportChanges;
    };
    previewChanges?: {
      affectedFlows?: string[];
      affectedMessages?: string[];
      affectedRoutingEntries?: string[];
    };
  }): ProcessedImportPreview {
    const conflictsByEntityType = {
      critical: raw.conflicts?.filter((c) => c.suggestedAction === 'skip') || [],
      warning: raw.conflicts?.filter((c) => c.suggestedAction === 'update') || [],
    };

    const changesByType: Record<string, ImportChangesSummary> = {};
    if (raw.summary?.flows) {
      changesByType['flows'] = {
        create: raw.summary.flows.willCreate || 0,
        update: raw.summary.flows.willUpdate || 0,
        skip: raw.summary.flows.willSkip || 0,
      };
    }
    if (raw.summary?.messages) {
      changesByType['messages'] = {
        create: raw.summary.messages.willCreate || 0,
        update: raw.summary.messages.willUpdate || 0,
        skip: raw.summary.messages.willSkip || 0,
      };
    }
    if (raw.summary?.routing) {
      changesByType['routing'] = {
        create: raw.summary.routing.willCreate || 0,
        update: raw.summary.routing.willUpdate || 0,
        skip: raw.summary.routing.willSkip || 0,
      };
    }

    const totalChanges = Object.values(changesByType).reduce(
      (sum: number, changes: ImportChangesSummary) =>
        sum + changes.create + changes.update,
      0,
    );

    const riskLevel = this.determineRiskLevel(conflictsByEntityType.critical, totalChanges);
    const recommendedAction = this.getRecommendation(riskLevel);
    const estimatedDuration = this.estimateDuration(totalChanges);

    return {
      isValid: raw.isValid ?? false,
      validatedAt: raw.validatedAt ?? new Date().toISOString(),
      totalChanges,
      changesByType,
      criticalConflicts: conflictsByEntityType.critical,
      warningConflicts: conflictsByEntityType.warning,
      affectedEntities: raw.previewChanges
        ? [
            ...(raw.previewChanges.affectedFlows || []),
            ...(raw.previewChanges.affectedMessages || []),
            ...(raw.previewChanges.affectedRoutingEntries || []),
          ]
        : [],
      estimatedDuration,
      riskLevel,
      recommendedAction,
    };
  }

  private static determineRiskLevel(
    conflicts: ImportConflict[],
    totalChanges: number,
  ): 'low' | 'medium' | 'high' {
    if (conflicts.length > 10) return 'high';
    if (conflicts.length > 5) return 'medium';
    if (totalChanges > 100) return 'medium';
    return 'low';
  }

  private static getRecommendation(riskLevel: string): string {
    if (riskLevel === 'high') {
      return 'Review conflicts carefully before importing';
    }
    if (riskLevel === 'medium') {
      return 'Preview changes and resolve conflicts';
    }
    return 'Safe to import';
  }

  private static estimateDuration(totalChanges: number): string {
    if (totalChanges < 10) return '< 1 minute';
    if (totalChanges < 50) return '1-2 minutes';
    if (totalChanges < 100) return '2-5 minutes';
    return '5-10 minutes';
  }
}
