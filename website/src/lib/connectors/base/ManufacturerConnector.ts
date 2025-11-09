/**
 * Base Manufacturer Connector Interface
 *
 * All manufacturer-specific connectors must extend this abstract class
 */

import { RegistrationMethod } from '@prisma/client';

// Types
export interface ConnectorConfig {
  manufacturerId: string;
  name: string;
  priority: number; // 1-100, higher = preferred
  supportedMethods: RegistrationMethod[];
  rateLimit: {
    maxRequests: number;
    windowMs: number;
  };
  timeout: number;
  retryConfig: {
    maxAttempts: number;
    backoffMs: number;
    maxBackoffMs: number;
  };
}

export interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export interface ProductData {
  name: string;
  manufacturer: string;
  modelNumber?: string;
  serialNumber: string;
  category?: string;
}

export interface PurchaseData {
  date: Date;
  price?: number;
  retailer?: string;
  receiptNumber?: string;
}

export interface DocumentData {
  type: 'serial' | 'warranty' | 'receipt' | 'product_photo';
  url: string;
  ocrText?: string;
}

export interface RegistrationRequest {
  user: UserData;
  product: ProductData;
  purchase: PurchaseData;
  documents: DocumentData[];
  metadata?: Record<string, any>;
}

export interface RegistrationResponse {
  success: boolean;
  confirmationCode?: string;
  registrationUrl?: string;
  method: RegistrationMethod;
  confidence: number; // 0-1
  details?: Record<string, any>;
  nextSteps?: string[];
  error?: ConnectorError;
}

export interface ConnectorError {
  code: string;
  message: string;
  recoverable: boolean;
  details?: Record<string, any>;
}

export interface HealthStatus {
  healthy: boolean;
  latency?: number;
  lastCheck: Date;
  details?: Record<string, any>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface ConnectorCapabilities {
  supportsAPI: boolean;
  supportsAutomation: boolean;
  supportsBatch: boolean;
  requiresAuth: boolean;
  maxBatchSize: number;
}

export interface CircuitBreakerMetrics {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  successCount: number;
  lastFailureTime?: Date;
}

/**
 * Circuit Breaker Pattern Implementation
 */
export class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount: number = 0;
  private lastFailureTime?: Date;
  private successCount: number = 0;

  constructor(
    private config: {
      threshold: number;
      timeout: number;
      successThreshold: number;
    }
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.state = 'CLOSED';
        this.successCount = 0;
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.failureCount >= this.config.threshold) {
      this.state = 'OPEN';
      this.successCount = 0;
    }
  }

  private shouldAttemptReset(): boolean {
    return (
      this.lastFailureTime !== undefined &&
      Date.now() - this.lastFailureTime.getTime() > this.config.timeout
    );
  }

  isOpen(): boolean {
    return this.state === 'OPEN';
  }

  getState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN' {
    return this.state;
  }

  getMetrics(): CircuitBreakerMetrics {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
    };
  }

  reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = undefined;
  }
}

/**
 * Rate Limiter Implementation (Token Bucket Algorithm)
 */
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private config: {
      maxRequests: number;
      windowMs: number;
    }
  ) {
    this.tokens = config.maxRequests;
    this.lastRefill = Date.now();
  }

  async acquire(): Promise<void> {
    this.refillTokens();

    if (this.tokens <= 0) {
      const waitTime = this.config.windowMs - (Date.now() - this.lastRefill);
      await this.sleep(waitTime);
      this.refillTokens();
    }

    this.tokens--;
  }

  private refillTokens(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;

    if (timePassed >= this.config.windowMs) {
      this.tokens = this.config.maxRequests;
      this.lastRefill = now;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getAvailableTokens(): number {
    this.refillTokens();
    return this.tokens;
  }

  getRemainingTime(): number {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    return Math.max(0, this.config.windowMs - timePassed);
  }
}

/**
 * Simple Logger
 */
export class Logger {
  constructor(private context: string) {}

  info(message: string, meta?: any): void {
    console.log(`[${this.context}] INFO:`, message, meta || '');
  }

  warn(message: string, meta?: any): void {
    console.warn(`[${this.context}] WARN:`, message, meta || '');
  }

  error(message: string, error?: any): void {
    console.error(`[${this.context}] ERROR:`, message, error || '');
  }

  debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${this.context}] DEBUG:`, message, meta || '');
    }
  }
}

/**
 * Abstract Base Connector Class
 */
export abstract class ManufacturerConnector {
  protected config: ConnectorConfig;
  protected circuitBreaker: CircuitBreaker;
  protected rateLimiter: RateLimiter;
  protected logger: Logger;

  constructor(config: ConnectorConfig) {
    this.config = config;
    this.circuitBreaker = new CircuitBreaker({
      threshold: 5,
      timeout: 60000, // 1 minute
      successThreshold: 3,
    });
    this.rateLimiter = new RateLimiter(config.rateLimit);
    this.logger = new Logger(`connector:${config.manufacturerId}`);
  }

  /**
   * Main registration method - must be implemented by each connector
   */
  abstract register(request: RegistrationRequest): Promise<RegistrationResponse>;

  /**
   * Check if connector is healthy and can accept requests
   */
  abstract healthCheck(): Promise<HealthStatus>;

  /**
   * Validate request data against manufacturer requirements
   */
  abstract validateRequest(request: RegistrationRequest): ValidationResult;

  /**
   * Transform our data format to manufacturer's format
   */
  abstract mapToManufacturerFormat(request: RegistrationRequest): any;

  /**
   * Get current connector capabilities
   */
  getCapabilities(): ConnectorCapabilities {
    return {
      supportsAPI: this.config.supportedMethods.includes('API'),
      supportsAutomation: this.config.supportedMethods.includes('AUTOMATION_RELIABLE') ||
                          this.config.supportedMethods.includes('AUTOMATION_EXPERIMENTAL'),
      supportsBatch: false,
      requiresAuth: false,
      maxBatchSize: 1,
    };
  }

  /**
   * Execute operation with circuit breaker protection
   */
  protected async executeWithCircuitBreaker<T>(
    operation: () => Promise<T>
  ): Promise<T> {
    return this.circuitBreaker.execute(operation);
  }

  /**
   * Execute operation with rate limiting
   */
  protected async executeWithRateLimit<T>(
    operation: () => Promise<T>
  ): Promise<T> {
    await this.rateLimiter.acquire();
    return operation();
  }

  /**
   * Execute operation with both circuit breaker and rate limiting
   */
  protected async executeProtected<T>(
    operation: () => Promise<T>
  ): Promise<T> {
    return this.executeWithCircuitBreaker(async () => {
      return this.executeWithRateLimit(operation);
    });
  }

  /**
   * Check if circuit breaker is open
   */
  isCircuitOpen(): boolean {
    return this.circuitBreaker.isOpen();
  }

  /**
   * Get circuit breaker state
   */
  getCircuitBreakerState(): string {
    return this.circuitBreaker.getState();
  }

  /**
   * Get circuit breaker metrics
   */
  getCircuitBreakerMetrics(): CircuitBreakerMetrics {
    return this.circuitBreaker.getMetrics();
  }

  /**
   * Get rate limit status
   */
  getRateLimitStatus(): { remaining: number; resetMs: number } {
    return {
      remaining: this.rateLimiter.getAvailableTokens(),
      resetMs: this.rateLimiter.getRemainingTime(),
    };
  }

  /**
   * Reset circuit breaker (for manual intervention)
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker.reset();
    this.logger.info('Circuit breaker manually reset');
  }

  /**
   * Get connector configuration
   */
  getConfig(): ConnectorConfig {
    return this.config;
  }

  /**
   * Create error response
   */
  protected createErrorResponse(
    error: Error | ConnectorError,
    method: RegistrationMethod
  ): RegistrationResponse {
    const connectorError: ConnectorError = 'code' in error ? error : {
      code: 'UNKNOWN_ERROR',
      message: error.message,
      recoverable: false,
    };

    return {
      success: false,
      method,
      confidence: 0,
      error: connectorError,
    };
  }

  /**
   * Create success response
   */
  protected createSuccessResponse(
    confirmationCode: string,
    method: RegistrationMethod,
    details?: Record<string, any>
  ): RegistrationResponse {
    return {
      success: true,
      confirmationCode,
      method,
      confidence: 1.0,
      details,
    };
  }
}

/**
 * Base API Connector (for REST APIs)
 */
export abstract class ApiConnector extends ManufacturerConnector {
  protected baseUrl: string;
  protected headers: Record<string, string>;

  constructor(config: ConnectorConfig, baseUrl: string, headers: Record<string, string> = {}) {
    super(config);
    this.baseUrl = baseUrl;
    this.headers = headers;
  }

  /**
   * Make HTTP request with error handling
   */
  protected async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...this.headers,
        ...options.headers,
      },
      signal: AbortSignal.timeout(this.config.timeout),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json() as T;
  }

  /**
   * Health check via API ping
   */
  async healthCheck(): Promise<HealthStatus> {
    const startTime = Date.now();

    try {
      await this.request('/health', { method: 'GET' });

      return {
        healthy: true,
        latency: Date.now() - startTime,
        lastCheck: new Date(),
      };
    } catch (error) {
      return {
        healthy: false,
        lastCheck: new Date(),
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }
}

/**
 * Base Web Automation Connector (for Playwright)
 */
export abstract class WebAutomationConnector extends ManufacturerConnector {
  protected registrationUrl: string;

  constructor(config: ConnectorConfig, registrationUrl: string) {
    super(config);
    this.registrationUrl = registrationUrl;
  }

  /**
   * Health check via page load
   */
  async healthCheck(): Promise<HealthStatus> {
    const startTime = Date.now();

    try {
      const response = await fetch(this.registrationUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });

      return {
        healthy: response.ok,
        latency: Date.now() - startTime,
        lastCheck: new Date(),
        details: {
          status: response.status,
        },
      };
    } catch (error) {
      return {
        healthy: false,
        lastCheck: new Date(),
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }
}
