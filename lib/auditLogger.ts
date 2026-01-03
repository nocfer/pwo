/**
 * Audit logging infrastructure
 * Provides comprehensive logging of data modifications and operations
 */

import type {
    AuditLogEntry,
    DataType
} from "@/types/enhanced";
import {
    AuditAction
} from "@/types/enhanced";
import { storage } from "./storage";

// ============================================================================
// Audit Logger Class
// ============================================================================

export class AuditLogger {
  private static instance: AuditLogger;
  private logEntries: AuditLogEntry[] = [];
  private maxLogSize = 1000; // Maximum number of log entries to keep in memory

  private constructor() {
    this.loadAuditLog();
  }

  /**
   * Gets the singleton instance
   */
  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  /**
   * Loads audit log from storage
   */
  private async loadAuditLog(): Promise<void> {
    try {
      const stored = await storage.getItem('audit_log');
      if (stored) {
        this.logEntries = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load audit log:', error);
      this.logEntries = [];
    }
  }

  /**
   * Saves audit log to storage
   */
  private async saveAuditLog(): Promise<void> {
    try {
      // Keep only the most recent entries to prevent storage bloat
      const entriesToSave = this.logEntries.slice(-this.maxLogSize);
      await storage.setItem('audit_log', JSON.stringify(entriesToSave));
      this.logEntries = entriesToSave;
    } catch (error) {
      console.error('Failed to save audit log:', error);
    }
  }

  /**
   * Generates a unique ID for log entries
   */
  private generateLogId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Logs an audit entry
   */
  async logEntry(
    action: AuditAction,
    entityType: DataType,
    entityId: string,
    entityName?: string,
    changes?: Record<string, { from: any; to: any }>,
    metadata?: Record<string, any>,
    userId?: string
  ): Promise<AuditLogEntry> {
    const entry: AuditLogEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      userId,
      action,
      entityType,
      entityId,
      entityName,
      changes,
      metadata
    };

    this.logEntries.push(entry);
    await this.saveAuditLog();

    return entry;
  }

  /**
   * Logs a create operation
   */
  async logCreate(
    entityType: DataType,
    entityId: string,
    entityName: string,
    entityData: any,
    userId?: string
  ): Promise<AuditLogEntry> {
    return this.logEntry(
      AuditAction.CREATE,
      entityType,
      entityId,
      entityName,
      undefined,
      { entityData },
      userId
    );
  }

  /**
   * Logs an update operation
   */
  async logUpdate(
    entityType: DataType,
    entityId: string,
    entityName: string,
    changes: Record<string, { from: any; to: any }>,
    userId?: string
  ): Promise<AuditLogEntry> {
    return this.logEntry(
      AuditAction.UPDATE,
      entityType,
      entityId,
      entityName,
      changes,
      undefined,
      userId
    );
  }

  /**
   * Logs a delete operation
   */
  async logDelete(
    entityType: DataType,
    entityId: string,
    entityName: string,
    entityData?: any,
    userId?: string
  ): Promise<AuditLogEntry> {
    return this.logEntry(
      AuditAction.DELETE,
      entityType,
      entityId,
      entityName,
      undefined,
      { deletedData: entityData },
      userId
    );
  }

  /**
   * Logs a bulk delete operation
   */
  async logBulkDelete(
    entityType: DataType,
    entityIds: string[],
    entityNames: string[],
    userId?: string
  ): Promise<AuditLogEntry> {
    return this.logEntry(
      AuditAction.BULK_DELETE,
      entityType,
      'bulk_operation',
      `Bulk delete of ${entityIds.length} ${entityType}`,
      undefined,
      { 
        deletedIds: entityIds,
        deletedNames: entityNames,
        count: entityIds.length
      },
      userId
    );
  }

  /**
   * Logs a duplicate operation
   */
  async logDuplicate(
    entityType: DataType,
    originalId: string,
    originalName: string,
    newId: string,
    newName: string,
    userId?: string
  ): Promise<AuditLogEntry> {
    return this.logEntry(
      AuditAction.DUPLICATE,
      entityType,
      newId,
      newName,
      undefined,
      {
        originalId,
        originalName,
        operation: 'duplicate'
      },
      userId
    );
  }

  /**
   * Logs an import operation
   */
  async logImport(
    entityType: DataType,
    importedCount: number,
    skippedCount: number,
    errorCount: number,
    metadata?: Record<string, any>,
    userId?: string
  ): Promise<AuditLogEntry> {
    return this.logEntry(
      AuditAction.IMPORT,
      entityType,
      'import_operation',
      `Import of ${importedCount} ${entityType}`,
      undefined,
      {
        importedCount,
        skippedCount,
        errorCount,
        ...metadata
      },
      userId
    );
  }

  /**
   * Logs an export operation
   */
  async logExport(
    entityType: DataType,
    exportedCount: number,
    exportFormat?: string,
    metadata?: Record<string, any>,
    userId?: string
  ): Promise<AuditLogEntry> {
    return this.logEntry(
      AuditAction.EXPORT,
      entityType,
      'export_operation',
      `Export of ${exportedCount} ${entityType}`,
      undefined,
      {
        exportedCount,
        exportFormat,
        ...metadata
      },
      userId
    );
  }

  /**
   * Gets audit log entries with optional filtering
   */
  getLogEntries(options?: {
    entityType?: DataType;
    entityId?: string;
    action?: AuditAction;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): AuditLogEntry[] {
    let filtered = [...this.logEntries];

    if (options?.entityType) {
      filtered = filtered.filter(entry => entry.entityType === options.entityType);
    }

    if (options?.entityId) {
      filtered = filtered.filter(entry => entry.entityId === options.entityId);
    }

    if (options?.action) {
      filtered = filtered.filter(entry => entry.action === options.action);
    }

    if (options?.startDate) {
      filtered = filtered.filter(entry => entry.timestamp >= options.startDate!);
    }

    if (options?.endDate) {
      filtered = filtered.filter(entry => entry.timestamp <= options.endDate!);
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (options?.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  /**
   * Gets audit log entries for a specific entity
   */
  getEntityHistory(entityType: DataType, entityId: string): AuditLogEntry[] {
    return this.getLogEntries({ entityType, entityId });
  }

  /**
   * Gets recent audit log entries
   */
  getRecentEntries(limit: number = 50): AuditLogEntry[] {
    return this.getLogEntries({ limit });
  }

  /**
   * Gets audit statistics
   */
  getAuditStats(): {
    totalEntries: number;
    entriesByAction: Record<AuditAction, number>;
    entriesByType: Record<DataType, number>;
    oldestEntry?: string;
    newestEntry?: string;
  } {
    const entriesByAction = {} as Record<AuditAction, number>;
    const entriesByType = {} as Record<DataType, number>;

    // Initialize counters
    Object.values(AuditAction).forEach(action => {
      entriesByAction[action] = 0;
    });

    (['exercises', 'programs', 'challenges'] as DataType[]).forEach(type => {
      entriesByType[type] = 0;
    });

    // Count entries
    this.logEntries.forEach(entry => {
      entriesByAction[entry.action]++;
      entriesByType[entry.entityType]++;
    });

    const timestamps = this.logEntries.map(e => e.timestamp).sort();

    return {
      totalEntries: this.logEntries.length,
      entriesByAction,
      entriesByType,
      oldestEntry: timestamps[0],
      newestEntry: timestamps[timestamps.length - 1]
    };
  }

  /**
   * Clears old audit log entries
   */
  async clearOldEntries(olderThanDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    const cutoffISO = cutoffDate.toISOString();

    const originalCount = this.logEntries.length;
    this.logEntries = this.logEntries.filter(entry => entry.timestamp >= cutoffISO);
    
    await this.saveAuditLog();
    
    return originalCount - this.logEntries.length;
  }

  /**
   * Exports audit log as JSON
   */
  exportAuditLog(options?: {
    startDate?: string;
    endDate?: string;
    entityType?: DataType;
  }): string {
    const entries = this.getLogEntries(options);
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      totalEntries: entries.length,
      filters: options,
      entries
    }, null, 2);
  }
}

// ============================================================================
// Utility Functions and Exports
// ============================================================================

/**
 * Gets the global audit logger instance
 */
export const auditLogger = AuditLogger.getInstance();

/**
 * Helper function to detect changes between two objects
 */
export function detectChanges(
  oldData: Record<string, any>,
  newData: Record<string, any>
): Record<string, { from: any; to: any }> {
  const changes: Record<string, { from: any; to: any }> = {};

  // Check all keys from both objects
  const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

  for (const key of allKeys) {
    const oldValue = oldData[key];
    const newValue = newData[key];

    // Skip if values are the same
    if (JSON.stringify(oldValue) === JSON.stringify(newValue)) {
      continue;
    }

    changes[key] = {
      from: oldValue,
      to: newValue
    };
  }

  return changes;
}

/**
 * Helper function to create audit metadata
 */
export function createAuditMetadata(
  operation: string,
  additionalData?: Record<string, any>
): Record<string, any> {
  return {
    operation,
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
    ...additionalData
  };
}

/**
 * Decorator for automatic audit logging of CRUD operations
 */
export function withAuditLogging<T extends (...args: any[]) => any>(
  operation: AuditAction,
  entityType: DataType,
  getEntityInfo: (args: Parameters<T>, result?: any) => { id: string; name: string }
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: Parameters<T>) {
      const startTime = Date.now();
      let result: any;
      let error: Error | null = null;

      try {
        result = await originalMethod.apply(this, args);
        
        // Log successful operation
        const entityInfo = getEntityInfo(args, result);
        await auditLogger.logEntry(
          operation,
          entityType,
          entityInfo.id,
          entityInfo.name,
          undefined,
          createAuditMetadata(propertyKey, {
            duration: Date.now() - startTime,
            success: true
          })
        );

        return result;
      } catch (err) {
        error = err as Error;
        
        // Log failed operation
        try {
          const entityInfo = getEntityInfo(args);
          await auditLogger.logEntry(
            operation,
            entityType,
            entityInfo.id,
            entityInfo.name,
            undefined,
            createAuditMetadata(propertyKey, {
              duration: Date.now() - startTime,
              success: false,
              error: error.message
            })
          );
        } catch (auditError) {
          console.error('Failed to log audit entry:', auditError);
        }

        throw error;
      }
    };

    return descriptor;
  };
}