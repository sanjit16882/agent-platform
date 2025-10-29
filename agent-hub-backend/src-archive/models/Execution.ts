export type ExecutionStatus = 'queued' | 'running' | 'completed' | 'failed' | 'timeout' | 'cancelled';

export interface ExecutionData {
  id: string;
  agentId: string;
  userId: string;
  apiKeyId?: string;
  inputs: Record<string, any>;
  status: ExecutionStatus;
  progress: number;
  results?: Record<string, any>;
  error?: string;
  sync: boolean;
  timeout: number;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface CreateExecutionRequest {
  agentId: string;
  inputs: Record<string, any>;
  sync?: boolean;
  timeout?: number;
  metadata?: Record<string, any>;
}

export interface ExecutionResponse {
  id: string;
  agentId: string;
  status: ExecutionStatus;
  progress: number;
  sync: boolean;
  timeout: number;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  createdAt: Date;
  results?: Record<string, any>;
  error?: string;
}

export class Execution {
  public readonly id: string;
  public readonly agentId: string;
  public readonly userId: string;
  public readonly apiKeyId?: string;
  public readonly inputs: Record<string, any>;
  public status: ExecutionStatus;
  public progress: number;
  public results?: Record<string, any>;
  public error?: string;
  public readonly sync: boolean;
  public readonly timeout: number;
  public startedAt?: Date;
  public completedAt?: Date;
  public duration?: number;
  public readonly createdAt: Date;
  public readonly metadata?: Record<string, any>;

  constructor(data: ExecutionData) {
    this.id = data.id;
    this.agentId = data.agentId;
    this.userId = data.userId;
    this.apiKeyId = data.apiKeyId;
    this.inputs = data.inputs;
    this.status = data.status;
    this.progress = data.progress;
    this.results = data.results;
    this.error = data.error;
    this.sync = data.sync;
    this.timeout = data.timeout;
    this.startedAt = data.startedAt;
    this.completedAt = data.completedAt;
    this.duration = data.duration;
    this.createdAt = data.createdAt;
    this.metadata = data.metadata;
  }

  /**
   * Generate a unique execution ID
   */
  static generateId(): string {
    return 'exec_' + require('crypto').randomBytes(16).toString('hex');
  }

  /**
   * Start the execution
   */
  start(): void {
    this.status = 'running';
    this.startedAt = new Date();
    this.progress = 0;
  }

  /**
   * Update execution progress
   */
  updateProgress(progress: number): void {
    this.progress = Math.max(0, Math.min(100, progress));
  }

  /**
   * Complete the execution successfully
   */
  complete(results: Record<string, any>): void {
    this.status = 'completed';
    this.progress = 100;
    this.results = results;
    this.completedAt = new Date();
    
    if (this.startedAt) {
      this.duration = this.completedAt.getTime() - this.startedAt.getTime();
    }
  }

  /**
   * Fail the execution
   */
  fail(error: string): void {
    this.status = 'failed';
    this.error = error;
    this.completedAt = new Date();
    
    if (this.startedAt) {
      this.duration = this.completedAt.getTime() - this.startedAt.getTime();
    }
  }

  /**
   * Cancel the execution
   */
  cancel(): void {
    this.status = 'cancelled';
    this.completedAt = new Date();
    
    if (this.startedAt) {
      this.duration = this.completedAt.getTime() - this.startedAt.getTime();
    }
  }

  /**
   * Mark execution as timed out
   */
  markAsTimedOut(): void {
    this.status = 'timeout';
    this.error = `Execution timed out after ${this.timeout} seconds`;
    this.completedAt = new Date();
    
    if (this.startedAt) {
      this.duration = this.completedAt.getTime() - this.startedAt.getTime();
    }
  }

  /**
   * Check if execution is in a final state
   */
  isFinished(): boolean {
    return ['completed', 'failed', 'timeout', 'cancelled'].includes(this.status);
  }

  /**
   * Check if execution is still running
   */
  isRunning(): boolean {
    return ['queued', 'running'].includes(this.status);
  }

  /**
   * Check if execution was successful
   */
  isSuccessful(): boolean {
    return this.status === 'completed';
  }

  /**
   * Get execution duration in seconds
   */
  getDurationSeconds(): number | null {
    if (!this.duration) return null;
    return Math.round(this.duration / 1000);
  }

  /**
   * Convert to response format
   */
  toResponse(): ExecutionResponse {
    return {
      id: this.id,
      agentId: this.agentId,
      status: this.status,
      progress: this.progress,
      sync: this.sync,
      timeout: this.timeout,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      duration: this.duration,
      createdAt: this.createdAt,
      results: this.results,
      error: this.error
    };
  }

  /**
   * Convert to database format
   */
  toDatabase(): ExecutionData {
    return {
      id: this.id,
      agentId: this.agentId,
      userId: this.userId,
      apiKeyId: this.apiKeyId,
      inputs: this.inputs,
      status: this.status,
      progress: this.progress,
      results: this.results,
      error: this.error,
      sync: this.sync,
      timeout: this.timeout,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      duration: this.duration,
      createdAt: this.createdAt,
      metadata: this.metadata
    };
  }
}