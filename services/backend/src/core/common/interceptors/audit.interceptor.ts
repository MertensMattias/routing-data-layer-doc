import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../services/audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // From JWT auth guard

    if (!user) {
      // Skip audit for unauthenticated requests (will be rejected anyway)
      return next.handle();
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (data) => {
          // Only log write operations (POST, PUT, PATCH, DELETE)
          if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
            const entityId = this.extractEntityId(data, request.url);
            this.auditService.log({
              userId: user.userId,
              userEmail: user.email,
              action: `${request.method} ${request.url}`,
              entityType: this.extractEntityType(request.url),
              entityId: entityId ? String(entityId) : undefined,
              timestamp: new Date(),
              duration: Date.now() - startTime,
              ipAddress: request.ip,
              userAgent: request.headers['user-agent'],
              requestBody: this.sanitizeBody(request.body),
              responseStatus: 'success',
            });
          }
        },
        error: (error) => {
          // Log failed operations too
          if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
            this.auditService.log({
              userId: user.userId,
              userEmail: user.email,
              action: `${request.method} ${request.url}`,
              entityType: this.extractEntityType(request.url),
              timestamp: new Date(),
              duration: Date.now() - startTime,
              ipAddress: request.ip,
              responseStatus: 'error',
              errorMessage: error.message,
            });
          }
        },
      }),
    );
  }

  private extractEntityType(url: string): string {
    if (url.includes('/company-projects')) return 'CompanyProject';
    if (url.includes('/routing')) return 'RoutingTable';
    if (url.includes('/segments')) return 'Segment';
    if (url.includes('/messages')) return 'Message';
    if (url.includes('/changesets')) return 'ChangeSet';
    return 'Unknown';
  }

  private extractEntityId(data: any, url: string): string | number | undefined {
    // Try to extract from response data first
    if (data) {
      // Try specific ID fields based on entity type
      if (url.includes('/company-projects')) {
        if (data.companyProjectId) return data.companyProjectId;
      }
      if (url.includes('/routing')) {
        if (data.routingId || data.id) return data.routingId || data.id;
      }
      if (url.includes('/changesets')) {
        if (data.changeSetId || data.id) return data.changeSetId || data.id;
      }
      if (url.includes('/segments')) {
        if (data.segmentId || data.id) return data.segmentId || data.id;
      }
      if (url.includes('/messages')) {
        if (data.messageId || data.id) return data.messageId || data.id;
      }

      // Fallback to generic id field
      if (data.id) return data.id;
    }

    // If no data (e.g., DELETE operations), extract ID from URL
    // URL patterns: /api/v1/company-projects/2 or /company-projects/2
    const urlMatch = url.match(/\/company-projects\/(\d+)/);
    if (urlMatch) return urlMatch[1];

    const routingMatch = url.match(/\/routing\/(\d+)/);
    if (routingMatch) return routingMatch[1];

    const segmentMatch = url.match(/\/segments\/(\d+)/);
    if (segmentMatch) return segmentMatch[1];

    const messageMatch = url.match(/\/messages\/(\d+)/);
    if (messageMatch) return messageMatch[1];

    const changesetMatch = url.match(/\/changesets\/(\d+)/);
    if (changesetMatch) return changesetMatch[1];

    return undefined;
  }

  private sanitizeBody(body: any): any {
    // Remove sensitive fields like passwords
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'apiKey', 'secret'];
    sensitiveFields.forEach((field) => delete sanitized[field]);

    return sanitized;
  }
}
