import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

export interface MemoryRecord {
  id: string;
  type: 'agent' | 'swarm' | 'task' | 'metric' | 'custom';
  timestamp: Date;
  data: any;
  metadata?: Record<string, any>;
}

export interface AgentMemory {
  agentId: string;
  type: string;
  name: string;
  status: string;
  metrics: {
    tasksCompleted: number;
    avgResponseTime: number;
    errorCount: number;
    tokenUsage: number;
  };
  skills: string[];
  context: Record<string, any>;
  swarmId?: string;
  createdAt: Date;
  lastActivity: Date;
}

export interface MemoryEntry {
  key: string;
  value: any;
  namespace: string;
  createdAt: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface StoreArgs {
  key: string;
  value: any;
  namespace?: string;
  ttl?: number; // TTL in milliseconds
  metadata?: Record<string, any>;
}

export interface RetrieveArgs {
  key: string;
  namespace?: string;
}

export interface PersistArgs {
  action: 'export' | 'import';
  filePath?: string;
  namespace?: string;
  compression?: boolean;
  format?: 'json';
}

export interface ClearArgs {
  namespace: string;
}

export interface MemoryStats {
  totalEntries: number;
  namespaces: string[];
  memoryUsage: {
    totalBytes: number;
    entriesByNamespace: Record<string, number>;
    expiredEntries: number;
  };
  oldestEntry?: Date;
  newestEntry?: Date;
}

export class MemoryManager {
  private records: Map<string, MemoryRecord> = new Map();
  private agentMemory: Map<string, AgentMemory> = new Map();
  private memory: Map<string, MemoryEntry> = new Map(); // key: namespace:key
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly defaultNamespace = 'default';

  constructor() {
    // Start cleanup timer for expired entries (every 5 minutes)
    this.startCleanupTimer();
  }

  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, 5 * 60 * 1000); // 5 minutes
  }

  private stopCleanupTimer(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  private cleanupExpiredEntries(): void {
    const now = new Date();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.memory.entries()) {
      if (entry.expiresAt && entry.expiresAt <= now) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.memory.delete(key);
    }
  }

  private getMemoryKey(key: string, namespace: string = this.defaultNamespace): string {
    return `${namespace}:${key}`;
  }

  private isEntryExpired(entry: MemoryEntry): boolean {
    return entry.expiresAt ? entry.expiresAt <= new Date() : false;
  }

  private async ensureDirectoryExists(filePath: string): Promise<void> {
    const dir = dirname(filePath);
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  private calculateMemoryUsage(): number {
    let totalBytes = 0;
    for (const entry of this.memory.values()) {
      try {
        totalBytes += Buffer.byteLength(JSON.stringify(entry), 'utf8');
      } catch {
        // If JSON.stringify fails, estimate size
        totalBytes += 1024; // 1KB estimate
      }
    }
    return totalBytes;
  }

  // Core memory operations
  async store(args: StoreArgs): Promise<any> {
    try {
      const {
        key,
        value,
        namespace = this.defaultNamespace,
        ttl,
        metadata
      } = args;

      if (!key) {
        throw new Error('Key is required');
      }

      const memoryKey = this.getMemoryKey(key, namespace);
      const now = new Date();
      const expiresAt = ttl ? new Date(now.getTime() + ttl) : undefined;

      const entry: MemoryEntry = {
        key,
        value,
        namespace,
        createdAt: now,
        expiresAt,
        metadata
      };

      this.memory.set(memoryKey, entry);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: 'Data stored successfully',
              key,
              namespace,
              expiresAt: expiresAt?.toISOString(),
              timestamp: now.toISOString()
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date().toISOString()
            }, null, 2)
          }
        ]
      };
    }
  }

  async retrieve(args: RetrieveArgs): Promise<any> {
    try {
      const { key, namespace = this.defaultNamespace } = args;

      if (!key) {
        throw new Error('Key is required');
      }

      const memoryKey = this.getMemoryKey(key, namespace);
      const entry = this.memory.get(memoryKey);

      if (!entry) {
        return undefined;
      }

      if (this.isEntryExpired(entry)) {
        this.memory.delete(memoryKey);
        return undefined;
      }

      // Return data in the format expected by tests
      return {
        key: entry.key,
        value: entry.value,
        namespace: entry.namespace,
        createdAt: entry.createdAt.toISOString(),
        expiresAt: entry.expiresAt?.toISOString(),
        metadata: entry.metadata
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Retrieve with content format (for MCP tool compatibility)
   */
  async retrieveWithContent(args: RetrieveArgs): Promise<any> {
    try {
      const { key, namespace = this.defaultNamespace } = args;

      if (!key) {
        throw new Error('Key is required');
      }

      const memoryKey = this.getMemoryKey(key, namespace);
      const entry = this.memory.get(memoryKey);

      if (!entry) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                message: 'Key not found',
                key,
                namespace,
                timestamp: new Date().toISOString()
              }, null, 2)
            }
          ]
        };
      }

      if (this.isEntryExpired(entry)) {
        this.memory.delete(memoryKey);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                message: 'Key has expired',
                key,
                namespace,
                timestamp: new Date().toISOString()
              }, null, 2)
            }
          ]
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              data: {
                key: entry.key,
                value: entry.value,
                namespace: entry.namespace,
                createdAt: entry.createdAt.toISOString(),
                expiresAt: entry.expiresAt?.toISOString(),
                metadata: entry.metadata
              },
              timestamp: new Date().toISOString()
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date().toISOString()
            }, null, 2)
          }
        ]
      };
    }
  }

  async persist(args: PersistArgs): Promise<any> {
    try {
      const {
        action,
        filePath,
        namespace,
        compression = false,
        format = 'json'
      } = args;

      if (action === 'export') {
        const defaultPath = join(process.cwd(), 'memory-export.json');
        const outputPath = filePath || defaultPath;

        // Filter entries by namespace if specified
        let entriesToExport: MemoryEntry[] = [];
        for (const entry of this.memory.values()) {
          if (!namespace || entry.namespace === namespace) {
            if (!this.isEntryExpired(entry)) {
              entriesToExport.push(entry);
            }
          }
        }

        const exportData = {
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          namespace: namespace || 'all',
          compression,
          format,
          entries: entriesToExport,
          metadata: {
            totalEntries: entriesToExport.length,
            exportedBy: 'MemoryManager',
            platform: 'win32'
          }
        };

        await this.ensureDirectoryExists(outputPath);

        let dataToWrite = JSON.stringify(exportData, null, 2);

        if (compression) {
          const compressed = await gzipAsync(Buffer.from(dataToWrite, 'utf8'));
          await fs.writeFile(outputPath + '.gz', compressed);
        } else {
          await fs.writeFile(outputPath, dataToWrite, 'utf8');
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: 'Memory exported successfully',
                filePath: compression ? outputPath + '.gz' : outputPath,
                entriesExported: entriesToExport.length,
                compression,
                timestamp: new Date().toISOString()
              }, null, 2)
            }
          ]
        };

      } else if (action === 'import') {
        if (!filePath) {
          throw new Error('File path is required for import');
        }

        let fileContent: string;

        try {
          if (filePath.endsWith('.gz')) {
            const compressedData = await fs.readFile(filePath);
            const decompressed = await gunzipAsync(compressedData);
            fileContent = decompressed.toString('utf8');
          } else {
            fileContent = await fs.readFile(filePath, 'utf8');
          }
        } catch (error) {
          throw new Error(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        const importData = JSON.parse(fileContent);
        const entries = importData.entries || [];

        let importedCount = 0;
        for (const entry of entries) {
          // Reconstruct dates
          const memoryEntry: MemoryEntry = {
            ...entry,
            createdAt: new Date(entry.createdAt),
            expiresAt: entry.expiresAt ? new Date(entry.expiresAt) : undefined
          };

          // Skip expired entries
          if (!this.isEntryExpired(memoryEntry)) {
            const memoryKey = this.getMemoryKey(memoryEntry.key, memoryEntry.namespace);
            this.memory.set(memoryKey, memoryEntry);
            importedCount++;
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: 'Memory imported successfully',
                filePath,
                entriesImported: importedCount,
                totalEntriesInFile: entries.length,
                timestamp: new Date().toISOString()
              }, null, 2)
            }
          ]
        };
      }

      throw new Error('Invalid action. Must be "export" or "import"');

    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date().toISOString()
            }, null, 2)
          }
        ]
      };
    }
  }

  async clear(args: ClearArgs): Promise<any> {
    try {
      const { namespace } = args;

      if (!namespace) {
        throw new Error('Namespace is required');
      }

      const keysToDelete: string[] = [];
      for (const [key, entry] of this.memory.entries()) {
        if (entry.namespace === namespace) {
          keysToDelete.push(key);
        }
      }

      for (const key of keysToDelete) {
        this.memory.delete(key);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Namespace '${namespace}' cleared successfully`,
              deletedEntries: keysToDelete.length,
              timestamp: new Date().toISOString()
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date().toISOString()
            }, null, 2)
          }
        ]
      };
    }
  }

  async getStats(): Promise<any> {
    try {
      // Clean up expired entries first
      this.cleanupExpiredEntries();

      const namespaces = new Set<string>();
      const entriesByNamespace: Record<string, number> = {};
      let oldestEntry: Date | undefined;
      let newestEntry: Date | undefined;
      let expiredCount = 0;

      for (const entry of this.memory.values()) {
        namespaces.add(entry.namespace);
        entriesByNamespace[entry.namespace] = (entriesByNamespace[entry.namespace] || 0) + 1;

        if (!oldestEntry || entry.createdAt < oldestEntry) {
          oldestEntry = entry.createdAt;
        }
        if (!newestEntry || entry.createdAt > newestEntry) {
          newestEntry = entry.createdAt;
        }

        if (this.isEntryExpired(entry)) {
          expiredCount++;
        }
      }

      const stats: MemoryStats = {
        totalEntries: this.memory.size,
        namespaces: Array.from(namespaces),
        memoryUsage: {
          totalBytes: this.calculateMemoryUsage(),
          entriesByNamespace,
          expiredEntries: expiredCount
        },
        oldestEntry,
        newestEntry
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              stats,
              timestamp: new Date().toISOString()
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date().toISOString()
            }, null, 2)
          }
        ]
      };
    }
  }

  // Legacy methods for backward compatibility
  async storeRecord(record: MemoryRecord): Promise<void> {
    const key = record.id;
    const namespace = 'records';
    await this.store({
      key,
      value: record,
      namespace,
      metadata: { type: 'legacy_record' }
    });
  }

  async getRecord(id: string): Promise<MemoryRecord | undefined> {
    const result = await this.retrieve({ key: id, namespace: 'records' });
    const content = result.content[0]?.text;
    if (content) {
      const parsed = JSON.parse(content);
      return parsed.success ? parsed.data?.value : undefined;
    }
    return undefined;
  }

  async storeAgentMemory(agentMemory: AgentMemory): Promise<void> {
    this.agentMemory.set(agentMemory.agentId, agentMemory);
  }

  async getAgentMemory(agentId: string): Promise<AgentMemory | undefined> {
    return this.agentMemory.get(agentId);
  }

  async updateAgentMemory(agentId: string, updates: Partial<AgentMemory>): Promise<void> {
    const existing = this.agentMemory.get(agentId);
    if (existing) {
      this.agentMemory.set(agentId, { ...existing, ...updates });
    }
  }

  async deleteAgentMemory(agentId: string): Promise<void> {
    this.agentMemory.delete(agentId);
  }

  async getAllAgentMemories(): Promise<AgentMemory[]> {
    return Array.from(this.agentMemory.values());
  }

  async getAgentsBySwarm(swarmId: string): Promise<AgentMemory[]> {
    return Array.from(this.agentMemory.values()).filter(agent => agent.swarmId === swarmId);
  }

  /**
   * Export memory to file (alias for persist with export action)
   */
  async export(filePath?: string): Promise<any> {
    return this.persist({
      action: 'export',
      filePath: filePath || join(process.cwd(), 'memory-export.json')
    });
  }

  /**
   * Import memory from file (alias for persist with import action)
   */
  async import(filePath: string): Promise<any> {
    return this.persist({
      action: 'import',
      filePath
    });
  }

  // Cleanup method for graceful shutdown
  destroy(): void {
    this.stopCleanupTimer();
    this.memory.clear();
    this.records.clear();
    this.agentMemory.clear();
  }
}