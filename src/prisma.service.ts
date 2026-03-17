import {Injectable, OnModuleDestroy, OnModuleInit, Logger} from '@nestjs/common';
import {PrismaClient} from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private isConnected = false;
  private connectionAttempts = 0;
  private readonly maxConnectionAttempts = 5;

  constructor() {
    super({
      // Configuration optimale PostgreSQL
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      // Logs sélectifs pour performance
      log: ['warn', 'error'],
      errorFormat: 'pretty',
      // Configuration transactions optimisée
      transactionOptions: {
        maxWait: 15000,  // 15s pour attendre le début (augmenté)
        timeout: 60000,  // 60s pour l'exécution (doublé)
        isolationLevel: 'ReadCommitted', // Moins de locks
      },
    });
  }

  async onModuleInit() {
    if (this.isConnected) return; // évite les connexions multiples
    await this.connectWithRetry();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.isConnected) {
      await this.$disconnect();
      this.isConnected = false;
      this.logger.log('🔌 Prisma disconnected from PostgreSQL');
    }
  }

  // Connexion avec retry intelligent
  private async connectWithRetry(): Promise<void> {
    while (this.connectionAttempts < this.maxConnectionAttempts && !this.isConnected) {
      try {
        this.connectionAttempts++;
        this.logger.log(`🔄 Attempting database connection (${this.connectionAttempts}/${this.maxConnectionAttempts})`);

        await this.$connect();
        
        // Configuration PostgreSQL optimale
        await this.optimizePostgreSQL();
        
        this.isConnected = true;
        this.logger.log('✅ Prisma connected to PostgreSQL successfully');
        
        // Reset le compteur en cas de succès
        this.connectionAttempts = 0;
        return;

      } catch (error) {
        this.logger.error(`❌ Connection attempt ${this.connectionAttempts} failed: ${error.message}`);
        
        if (this.connectionAttempts >= this.maxConnectionAttempts) {
          this.logger.error('💥 Max connection attempts reached. Giving up.');
          throw new Error(`Failed to connect to database after ${this.maxConnectionAttempts} attempts`);
        }
        
        // Attente exponentielle
        const waitTime = Math.min(1000 * Math.pow(2, this.connectionAttempts - 1), 10000);
        this.logger.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  // Configuration PostgreSQL optimisée (uniquement les paramètres autorisés sur Neon)
  private async optimizePostgreSQL(): Promise<void> {
    // Neon ne permet pas SET deadlock_timeout, work_mem, etc. — on skip silencieusement
  }

  // Transaction super-robuste avec retry intelligent
  async executeTransaction<T>(
    operation: (prisma: PrismaClient) => Promise<T>,
    options?: {
      maxRetries?: number;
      baseDelay?: number;
      maxDelay?: number;
      timeout?: number;
    }
  ): Promise<T> {
    const {
      maxRetries = 5,
      baseDelay = 1000,
      maxDelay = 10000,
      timeout = 60000
    } = options || {};

    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.debug(`🔄 Transaction attempt ${attempt}/${maxRetries}`);
        
        return await this.$transaction(operation, {
          maxWait: 15000,
          timeout: timeout,
          isolationLevel: 'ReadCommitted',
        });

      } catch (error) {
        lastError = error;
        
        // Analyser le type d'erreur
        const isRetryable = this.isRetryableError(error);
        const isTimeoutError = this.isTimeoutError(error);
        const isConnectionError = this.isConnectionError(error);
        
        this.logger.warn(`⚠️ Transaction failed (${attempt}/${maxRetries}): ${error.message}`);
        
        if (!isRetryable || attempt >= maxRetries) {
          this.logger.error(`❌ Transaction failed definitively after ${attempt} attempts`);
          throw error;
        }

        // Gestion spéciale des erreurs de connexion
        if (isConnectionError) {
          this.logger.warn('🔗 Connection error detected, attempting reconnection...');
          this.isConnected = false;
          await this.connectWithRetry();
        }

        // Délai d'attente intelligent
        const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
        
        // Délai plus long pour les timeouts
        const finalDelay = isTimeoutError ? delay * 2 : delay;
        
        this.logger.log(`⏳ Waiting ${finalDelay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, finalDelay));
      }
    }
    
    throw lastError;
  }

  // Analyse intelligente des erreurs
  private isRetryableError(error: any): boolean {
    const message = error.message?.toLowerCase() || '';
    const code = error.code;
    
    // Erreurs de transaction récupérables
    const retryablePatterns = [
      'unable to start a transaction',
      'transaction already closed',
      'connection pool timeout',
      'connection refused',
      'connection is dropped',
      'connection terminated',
      'timeout expired',
      'deadlock detected',
      'could not serialize access',
      'canceling statement due to statement timeout',
    ];

    const retryableCodes = [
      'P2024', // Timed out waiting for connection
      'P2028', // Transaction API error
      'P2034', // Transaction failed
    ];

    return retryablePatterns.some(pattern => message.includes(pattern)) ||
           retryableCodes.includes(code);
  }

  private isTimeoutError(error: any): boolean {
    const message = error.message?.toLowerCase() || '';
    return message.includes('timeout') || message.includes('timed out');
  }

  private isConnectionError(error: any): boolean {
    const message = error.message?.toLowerCase() || '';
    return message.includes('connection') || message.includes('connect');
  }

  // Health check avancé
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    database: {
      connected: boolean;
      responseTime?: number;
      error?: string;
    };
    connections?: any;
    timestamp: string;
  }> {
    const start = Date.now();
    
    try {
      await this.$queryRaw`SELECT 1 as health_check`;
      const responseTime = Date.now() - start;
      
      // Obtenir les stats de connexion
      const connections = await this.getConnectionStats();
      
      return {
        status: 'healthy',
        database: {
          connected: true,
          responseTime,
        },
        connections,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        database: {
          connected: false,
          error: error.message,
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Statistiques de connexion détaillées
  async getConnectionStats() {
    try {
      const stats = await this.$queryRaw`
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections,
          count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction,
          max(now() - state_change) as max_connection_age
        FROM pg_stat_activity 
        WHERE datname = current_database()
          AND pid != pg_backend_pid()
      `;
      return stats[0];
    } catch (error) {
      this.logger.error(`❌ Could not get connection stats: ${error.message}`);
      return null;
    }
  }

  // Nettoyage des connexions zombies
  async cleanupConnections(): Promise<void> {
    try {
      const result = await this.$executeRaw`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = current_database()
          AND pid != pg_backend_pid()
          AND state = 'idle in transaction'
          AND state_change < now() - interval '5 minutes'
      `;
      
      if (result > 0) {
        this.logger.log(`🧹 Cleaned up ${result} zombie connections`);
      }
    } catch (error) {
      this.logger.warn(`⚠️ Could not cleanup connections: ${error.message}`);
    }
  }

  // Méthode de compatibility pour l'ancien code
  async executeWithRetry<T>(
    operation: (prisma: PrismaService) => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    return this.executeTransaction(operation, { maxRetries });
  }
}