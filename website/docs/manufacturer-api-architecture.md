# Manufacturer API Integration Architecture

## Executive Summary

SnapRegister's manufacturer API integration system is designed to support 100+ manufacturer integrations with a unified, scalable architecture. The system uses a plugin-based connector pattern, intelligent fallback mechanisms, and robust queue management to handle registrations across APIs, web automation, and manual assist workflows.

## Current State Analysis

### Existing Components
- **Database Schema**: Well-structured Prisma schema with Manufacturer, Registration, and RegistrationAttempt models
- **Data Formatter**: Basic data formatting service exists for field transformations
- **Queue Support**: BullMQ and Redis already in dependencies for job queue management
- **Automation Support**: Playwright installed for web automation fallback
- **AI Integration**: Anthropic SDK for intelligent data extraction

### Identified Gaps
1. No manufacturer connector infrastructure
2. Missing API client implementations
3. No unified configuration system for manufacturers
4. Absence of retry and circuit breaker patterns
5. No monitoring/analytics dashboard
6. Missing rate limiting and throttling logic
7. No standardized error handling across connectors

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                       User Interface Layer                       │
│                   (React + Next.js Frontend)                     │
└────────────────┬────────────────────────────┬───────────────────┘
                 │                            │
                 ▼                            ▼
┌──────────────────────────┐    ┌────────────────────────────────┐
│   Registration API       │    │    Monitoring Dashboard         │
│   /api/registration/*    │    │    /api/analytics/*             │
└───────────┬──────────────┘    └────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Registration Orchestrator                     │
│         (Handles routing, retries, fallback strategies)          │
└───────────┬──────────────────────────────────┬──────────────────┘
            │                                  │
            ▼                                  ▼
┌──────────────────────┐          ┌───────────────────────────────┐
│   BullMQ Job Queue   │          │    Connector Registry          │
│  (Priority queuing)  │          │  (Plugin management system)    │
└──────────┬───────────┘          └───────────┬───────────────────┘
           │                                   │
           ▼                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Manufacturer Connectors                       │
├──────────────┬──────────────┬──────────────┬───────────────────┤
│ API Connector│ Web Automation│GraphQL Client│ Manual Assist     │
│   (REST)     │  (Playwright) │              │  (PDF/Email)      │
└──────────────┴──────────────┴──────────────┴───────────────────┘
           │                                   │
           ▼                                   ▼
┌──────────────────────┐          ┌───────────────────────────────┐
│  External APIs       │          │   Manufacturer Websites        │
│  (Apple, Samsung,    │          │   (Form submission)            │
│   HP, Dell, etc.)    │          │                                │
└──────────────────────┘          └───────────────────────────────┘
```

## Core Components Design

### 1. Unified Connector Interface

```typescript
// src/lib/connectors/base/ManufacturerConnector.ts

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

export interface RegistrationRequest {
  user: UserData;
  product: ProductData;
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

export abstract class ManufacturerConnector {
  protected config: ConnectorConfig;
  protected circuitBreaker: CircuitBreaker;
  protected rateLimiter: RateLimiter;
  protected logger: Logger;

  constructor(config: ConnectorConfig) {
    this.config = config;
    this.circuitBreaker = new CircuitBreaker(config);
    this.rateLimiter = new RateLimiter(config.rateLimit);
    this.logger = new Logger(`connector:${config.manufacturerId}`);
  }

  // Main registration method - must be implemented by each connector
  abstract register(request: RegistrationRequest): Promise<RegistrationResponse>;

  // Check if connector is healthy and can accept requests
  abstract healthCheck(): Promise<HealthStatus>;

  // Validate request data against manufacturer requirements
  abstract validateRequest(request: RegistrationRequest): ValidationResult;

  // Transform our data format to manufacturer's format
  abstract mapToManufacturerFormat(request: RegistrationRequest): any;

  // Get current connector capabilities
  getCapabilities(): ConnectorCapabilities {
    return {
      supportsAPI: this.config.supportedMethods.includes('API'),
      supportsAutomation: this.config.supportedMethods.includes('AUTOMATION'),
      supportsBatch: false,
      requiresAuth: false,
      maxBatchSize: 1,
    };
  }

  // Circuit breaker wrapper
  protected async executeWithCircuitBreaker<T>(
    operation: () => Promise<T>
  ): Promise<T> {
    return this.circuitBreaker.execute(operation);
  }

  // Rate limiting wrapper
  protected async executeWithRateLimit<T>(
    operation: () => Promise<T>
  ): Promise<T> {
    await this.rateLimiter.acquire();
    return operation();
  }
}
```

### 2. Manufacturer Configuration System

```typescript
// src/config/manufacturers/index.ts

export interface ManufacturerConfig {
  id: string;
  name: string;
  tier: 1 | 2 | 3; // Priority tier from research doc
  estimatedVolume: number; // Percentage of total registrations

  // API Configuration
  api?: {
    baseUrl: string;
    authType: 'oauth2' | 'apiKey' | 'jwt' | 'basic' | 'none';
    credentials?: {
      source: 'env' | 'vault' | 'config';
      key?: string;
    };
    endpoints: {
      register?: string;
      validate?: string;
      status?: string;
    };
    headers?: Record<string, string>;
    requestFormat: 'json' | 'formData' | 'xml';
    responseFormat: 'json' | 'xml' | 'html';
  };

  // Web Automation Configuration
  automation?: {
    registrationUrl: string;
    selectors: {
      form?: string;
      fields: Record<string, string>;
      submitButton: string;
      successIndicator?: string;
      errorIndicator?: string;
    };
    waitConditions?: string[];
    captchaHandler?: 'manual' | '2captcha' | 'anticaptcha';
  };

  // Field Mapping Configuration
  fieldMapping: {
    required: string[];
    optional: string[];
    custom: Record<string, FieldTransform>;
  };

  // Validation Rules
  validation: {
    serialNumber?: {
      pattern?: string;
      length?: { min?: number; max?: number };
      transform?: 'uppercase' | 'lowercase' | 'remove_spaces';
    };
    modelNumber?: {
      pattern?: string;
      required?: boolean;
    };
    purchaseDate?: {
      maxAge?: number; // Days
      format?: string;
    };
  };

  // Fallback Strategy
  fallback: {
    primary: RegistrationMethod;
    secondary?: RegistrationMethod;
    tertiary?: RegistrationMethod;
    manualAssist: {
      pdfUrl?: string;
      emailTemplate?: string;
      instructions?: string;
    };
  };

  // Monitoring Configuration
  monitoring: {
    healthCheckUrl?: string;
    expectedSuccessRate: number; // 0-1
    alertThresholds: {
      errorRate: number;
      latency: number; // ms
      consecutiveFailures: number;
    };
  };
}

// Manufacturer configurations
export const manufacturers: Record<string, ManufacturerConfig> = {
  samsung: {
    id: 'samsung',
    name: 'Samsung Electronics',
    tier: 1,
    estimatedVolume: 0.09,
    api: {
      baseUrl: 'https://api.samsung.com/warranty',
      authType: 'oauth2',
      credentials: {
        source: 'env',
        key: 'SAMSUNG_API_KEY',
      },
      endpoints: {
        register: '/v1/products/register',
        validate: '/v1/products/validate',
        status: '/v1/registrations/{id}',
      },
      requestFormat: 'json',
      responseFormat: 'json',
    },
    automation: {
      registrationUrl: 'https://www.samsung.com/us/support/register/',
      selectors: {
        form: '#registration-form',
        fields: {
          serialNumber: 'input[name="serialNumber"]',
          modelNumber: 'input[name="modelNumber"]',
          purchaseDate: 'input[name="purchaseDate"]',
          firstName: 'input[name="firstName"]',
          lastName: 'input[name="lastName"]',
          email: 'input[name="email"]',
          phone: 'input[name="phone"]',
          address: 'input[name="address1"]',
          city: 'input[name="city"]',
          state: 'select[name="state"]',
          zipCode: 'input[name="zip"]',
        },
        submitButton: 'button[type="submit"]',
        successIndicator: '.registration-success',
        errorIndicator: '.error-message',
      },
      waitConditions: ['networkidle', 'domcontentloaded'],
    },
    fieldMapping: {
      required: ['serialNumber', 'modelNumber', 'purchaseDate', 'email'],
      optional: ['phone', 'address', 'city', 'state', 'zipCode'],
      custom: {
        serialNumber: {
          transform: 'uppercase',
          removeSpaces: true,
        },
      },
    },
    validation: {
      serialNumber: {
        pattern: '^[A-Z0-9]{8,20}$',
        transform: 'uppercase',
      },
      purchaseDate: {
        maxAge: 365,
        format: 'MM/DD/YYYY',
      },
    },
    fallback: {
      primary: 'API',
      secondary: 'AUTOMATION_RELIABLE',
      tertiary: 'ASSISTED_MANUAL',
      manualAssist: {
        emailTemplate: 'samsung_manual_registration',
        instructions: 'Visit Samsung.com/register and enter your information',
      },
    },
    monitoring: {
      expectedSuccessRate: 0.85,
      alertThresholds: {
        errorRate: 0.2,
        latency: 5000,
        consecutiveFailures: 5,
      },
    },
  },

  apple: {
    id: 'apple',
    name: 'Apple Inc.',
    tier: 1,
    estimatedVolume: 0.08,
    api: {
      baseUrl: 'https://api.apple.com/support',
      authType: 'jwt',
      credentials: {
        source: 'vault',
        key: 'apple_jwt_token',
      },
      endpoints: {
        register: '/v1/warranty/register',
        validate: '/v1/device/validate',
        status: '/v1/warranty/status',
      },
      headers: {
        'X-Apple-Partner-Id': '${APPLE_PARTNER_ID}',
      },
      requestFormat: 'json',
      responseFormat: 'json',
    },
    fieldMapping: {
      required: ['serialNumber', 'purchaseDate', 'email'],
      optional: ['firstName', 'lastName', 'country'],
      custom: {},
    },
    validation: {
      serialNumber: {
        pattern: '^[A-Z0-9]{12}$',
        transform: 'uppercase',
      },
      purchaseDate: {
        maxAge: 90,
        format: 'YYYY-MM-DD',
      },
    },
    fallback: {
      primary: 'API',
      secondary: 'ASSISTED_MANUAL',
      manualAssist: {
        pdfUrl: 'https://support.apple.com/register',
        instructions: 'Use Apple Check Coverage tool',
      },
    },
    monitoring: {
      healthCheckUrl: 'https://api.apple.com/health',
      expectedSuccessRate: 0.95,
      alertThresholds: {
        errorRate: 0.1,
        latency: 3000,
        consecutiveFailures: 3,
      },
    },
  },

  // Add more manufacturer configs...
};
```

### 3. Registration Pipeline

```typescript
// src/lib/pipeline/RegistrationPipeline.ts

export class RegistrationPipeline {
  private queue: Queue;
  private connectorRegistry: ConnectorRegistry;
  private monitor: PipelineMonitor;

  constructor() {
    this.queue = new Queue('registrations', {
      connection: redis,
      defaultJobOptions: {
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });

    this.connectorRegistry = new ConnectorRegistry();
    this.monitor = new PipelineMonitor();
  }

  async submitRegistration(
    userId: string,
    productId: string,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<string> {
    // Load product and user data
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { manufacturer: true, documents: true },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!product || !user) {
      throw new Error('Invalid product or user');
    }

    // Create registration record
    const registration = await prisma.registration.create({
      data: {
        productId,
        userId,
        manufacturerId: product.manufacturerId,
        status: 'PENDING',
        registrationMethod: this.determineMethod(product.manufacturer),
      },
    });

    // Queue the job
    const job = await this.queue.add(
      'process-registration',
      {
        registrationId: registration.id,
        userId,
        productId,
        manufacturerId: product.manufacturerId,
      },
      {
        priority: this.getPriorityValue(priority),
        delay: this.calculateDelay(product.manufacturer),
      }
    );

    return job.id;
  }

  private async processRegistration(job: Job): Promise<RegistrationResponse> {
    const { registrationId, manufacturerId } = job.data;

    // Update status
    await prisma.registration.update({
      where: { id: registrationId },
      data: { status: 'PROCESSING' },
    });

    try {
      // Get appropriate connector
      const connector = this.connectorRegistry.getConnector(manufacturerId);

      if (!connector) {
        throw new Error(`No connector available for ${manufacturerId}`);
      }

      // Check circuit breaker status
      if (connector.isCircuitOpen()) {
        // Try fallback method
        return await this.executeFallback(registrationId, manufacturerId);
      }

      // Prepare request data
      const request = await this.prepareRequest(registrationId);

      // Validate request
      const validation = await connector.validateRequest(request);
      if (!validation.valid) {
        throw new ValidationError(validation.errors);
      }

      // Execute registration
      const response = await connector.register(request);

      // Record attempt
      await this.recordAttempt(registrationId, response);

      // Update registration status
      await this.updateRegistrationStatus(registrationId, response);

      // Send notifications
      await this.notifyUser(registrationId, response);

      // Update metrics
      this.monitor.recordSuccess(manufacturerId, response);

      return response;

    } catch (error) {
      // Record failure
      await this.recordFailure(registrationId, error);

      // Update metrics
      this.monitor.recordFailure(manufacturerId, error);

      // Determine if we should retry or fallback
      if (job.attemptsMade < job.opts.attempts) {
        throw error; // Let BullMQ handle retry
      } else {
        // Max retries reached, try fallback
        return await this.executeFallback(registrationId, manufacturerId);
      }
    }
  }

  private async executeFallback(
    registrationId: string,
    manufacturerId: string
  ): Promise<RegistrationResponse> {
    const config = manufacturers[manufacturerId];

    if (!config) {
      throw new Error(`No configuration for ${manufacturerId}`);
    }

    // Try secondary method
    if (config.fallback.secondary) {
      const secondaryConnector = this.connectorRegistry.getConnectorByMethod(
        manufacturerId,
        config.fallback.secondary
      );

      if (secondaryConnector && !secondaryConnector.isCircuitOpen()) {
        try {
          const request = await this.prepareRequest(registrationId);
          return await secondaryConnector.register(request);
        } catch (error) {
          this.logger.warn(`Secondary method failed: ${error.message}`);
        }
      }
    }

    // Fall back to manual assist
    return await this.createManualAssist(registrationId, manufacturerId);
  }

  private async createManualAssist(
    registrationId: string,
    manufacturerId: string
  ): Promise<RegistrationResponse> {
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        product: true,
        user: true,
      },
    });

    // Generate pre-filled PDF or instructions
    const assistData = await this.generateAssistData(registration);

    // Update registration with assist info
    await prisma.registration.update({
      where: { id: registrationId },
      data: {
        status: 'MANUAL_REQUIRED',
        assistedPdfUrl: assistData.pdfUrl,
        statusMessage: assistData.instructions,
      },
    });

    // Send email with instructions
    await this.emailService.sendManualRegistrationEmail(
      registration.user.email,
      assistData
    );

    return {
      success: false,
      method: 'ASSISTED_MANUAL',
      confidence: 0.5,
      nextSteps: [assistData.instructions],
    };
  }
}
```

### 4. Circuit Breaker Implementation

```typescript
// src/lib/patterns/CircuitBreaker.ts

export class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount: number = 0;
  private lastFailureTime?: Date;
  private successCount: number = 0;

  constructor(
    private config: {
      threshold: number; // Number of failures to open circuit
      timeout: number; // Ms to wait before trying half-open
      successThreshold: number; // Successes needed to close from half-open
    }
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check if circuit should be opened
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
      } else {
        throw new CircuitOpenError('Circuit breaker is open');
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
      this.lastFailureTime &&
      Date.now() - this.lastFailureTime.getTime() > this.config.timeout
    );
  }

  isOpen(): boolean {
    return this.state === 'OPEN';
  }

  getState(): string {
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
}
```

### 5. Rate Limiter

```typescript
// src/lib/patterns/RateLimiter.ts

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
}
```

### 6. Data Mapper

```typescript
// src/lib/mappers/UniversalDataMapper.ts

export interface UniversalProductData {
  // User Information
  user: {
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
  };

  // Product Information
  product: {
    name: string;
    manufacturer: string;
    modelNumber?: string;
    serialNumber: string;
    category?: string;
  };

  // Purchase Information
  purchase: {
    date: Date;
    price?: number;
    retailer?: string;
    receiptNumber?: string;
  };

  // Warranty Information
  warranty?: {
    type?: string;
    duration?: number; // months
    startDate?: Date;
    extendedWarranty?: boolean;
  };
}

export class UniversalDataMapper {
  static toManufacturerFormat(
    data: UniversalProductData,
    manufacturerId: string
  ): any {
    const mappers: Record<string, (data: UniversalProductData) => any> = {
      samsung: this.toSamsungFormat,
      apple: this.toAppleFormat,
      lg: this.toLGFormat,
      whirlpool: this.toWhirlpoolFormat,
      // Add more mappers...
    };

    const mapper = mappers[manufacturerId];
    if (!mapper) {
      throw new Error(`No mapper found for manufacturer: ${manufacturerId}`);
    }

    return mapper(data);
  }

  private static toSamsungFormat(data: UniversalProductData): any {
    return {
      customer: {
        first_name: data.user.firstName,
        last_name: data.user.lastName,
        email: data.user.email,
        phone_number: DataFormatter.formatPhone(data.user.phone, 'RAW'),
        address: {
          line1: data.user.address?.street,
          city: data.user.address?.city,
          state: data.user.address?.state,
          postal_code: data.user.address?.zipCode,
          country_code: 'US',
        },
      },
      product: {
        serial_number: data.product.serialNumber.toUpperCase().replace(/[\s-]/g, ''),
        model_number: data.product.modelNumber,
        purchase_date: format(data.purchase.date, 'yyyy-MM-dd'),
        retailer_name: data.purchase.retailer,
      },
    };
  }

  private static toAppleFormat(data: UniversalProductData): any {
    return {
      serialNumber: data.product.serialNumber.toUpperCase(),
      purchaseDate: data.purchase.date.toISOString(),
      owner: {
        email: data.user.email,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        country: data.user.address?.country || 'US',
      },
    };
  }

  private static toLGFormat(data: UniversalProductData): any {
    return {
      registration: {
        serial: this.formatLGSerial(data.product.serialNumber),
        model: data.product.modelNumber,
        purchaseDate: format(data.purchase.date, 'MM/dd/yyyy'),
        store: data.purchase.retailer,
      },
      customer: {
        name: `${data.user.firstName} ${data.user.lastName}`,
        email: data.user.email,
        phone: DataFormatter.formatPhone(data.user.phone, 'US'),
        address: DataFormatter.formatAddress(
          data.user.address?.street,
          data.user.address?.city,
          data.user.address?.state,
          data.user.address?.zipCode,
          data.user.address?.country,
          'US_STANDARD'
        ),
      },
    };
  }

  private static formatLGSerial(serial: string): string {
    const cleaned = serial.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleaned.length >= 9) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
    }
    return cleaned;
  }

  // Validation methods
  static validateManufacturerRequirements(
    data: UniversalProductData,
    manufacturerId: string
  ): ValidationResult {
    const config = manufacturers[manufacturerId];
    if (!config) {
      return { valid: false, errors: ['Unknown manufacturer'] };
    }

    const errors: string[] = [];

    // Check required fields
    for (const field of config.fieldMapping.required) {
      if (!this.getFieldValue(data, field)) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate serial number format
    if (config.validation.serialNumber?.pattern) {
      const pattern = new RegExp(config.validation.serialNumber.pattern);
      const serial = data.product.serialNumber;
      if (!pattern.test(serial)) {
        errors.push(`Invalid serial number format`);
      }
    }

    // Validate purchase date
    if (config.validation.purchaseDate?.maxAge) {
      const maxAge = config.validation.purchaseDate.maxAge;
      const daysSincePurchase = differenceInDays(new Date(), data.purchase.date);
      if (daysSincePurchase > maxAge) {
        errors.push(`Purchase date is too old (max ${maxAge} days)`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private static getFieldValue(data: UniversalProductData, field: string): any {
    const paths: Record<string, any> = {
      firstName: data.user.firstName,
      lastName: data.user.lastName,
      email: data.user.email,
      phone: data.user.phone,
      serialNumber: data.product.serialNumber,
      modelNumber: data.product.modelNumber,
      purchaseDate: data.purchase.date,
      // Add more field mappings...
    };

    return paths[field];
  }
}
```

## Monitoring & Analytics System

```typescript
// src/lib/monitoring/RegistrationMonitor.ts

export class RegistrationMonitor {
  private metrics: MetricsCollector;
  private alerts: AlertManager;

  constructor() {
    this.metrics = new MetricsCollector();
    this.alerts = new AlertManager();
  }

  async getDashboardData(): Promise<DashboardData> {
    const [
      successRates,
      latencies,
      queueStats,
      errorBreakdown,
      manufacturerHealth,
    ] = await Promise.all([
      this.getSuccessRates(),
      this.getLatencies(),
      this.getQueueStats(),
      this.getErrorBreakdown(),
      this.getManufacturerHealth(),
    ]);

    return {
      successRates,
      latencies,
      queueStats,
      errorBreakdown,
      manufacturerHealth,
      timestamp: new Date(),
    };
  }

  private async getSuccessRates(): Promise<SuccessRateData> {
    const registrations = await prisma.registration.groupBy({
      by: ['manufacturerId', 'status'],
      where: {
        createdAt: {
          gte: subHours(new Date(), 24),
        },
      },
      _count: true,
    });

    const ratesByManufacturer = new Map<string, number>();

    for (const group of registrations) {
      const manufacturerId = group.manufacturerId || 'unknown';
      const count = group._count;

      if (!ratesByManufacturer.has(manufacturerId)) {
        ratesByManufacturer.set(manufacturerId, 0);
      }

      if (group.status === 'SUCCESS' || group.status === 'PARTIAL_SUCCESS') {
        ratesByManufacturer.set(
          manufacturerId,
          ratesByManufacturer.get(manufacturerId)! + count
        );
      }
    }

    return {
      overall: this.calculateOverallRate(registrations),
      byManufacturer: Object.fromEntries(ratesByManufacturer),
      byMethod: await this.getSuccessRatesByMethod(),
    };
  }

  private async getLatencies(): Promise<LatencyData> {
    const attempts = await prisma.registrationAttempt.findMany({
      where: {
        completedAt: {
          gte: subHours(new Date(), 24),
        },
      },
      select: {
        durationMs: true,
        registration: {
          select: {
            manufacturerId: true,
            registrationMethod: true,
          },
        },
      },
    });

    return {
      p50: this.calculatePercentile(attempts, 50),
      p95: this.calculatePercentile(attempts, 95),
      p99: this.calculatePercentile(attempts, 99),
      byManufacturer: this.groupLatenciesByManufacturer(attempts),
    };
  }

  private async getManufacturerHealth(): Promise<ManufacturerHealthData[]> {
    const manufacturers = await prisma.manufacturer.findMany({
      where: { isActive: true },
    });

    const healthData = await Promise.all(
      manufacturers.map(async (manufacturer) => {
        const connector = this.connectorRegistry.getConnector(manufacturer.id);
        const circuitState = connector?.getCircuitBreakerState() || 'UNKNOWN';
        const rateLimit = connector?.getRateLimitStatus() || null;

        const recentAttempts = await prisma.registrationAttempt.count({
          where: {
            registration: {
              manufacturerId: manufacturer.id,
            },
            startedAt: {
              gte: subHours(new Date(), 1),
            },
          },
        });

        const recentSuccesses = await prisma.registrationAttempt.count({
          where: {
            registration: {
              manufacturerId: manufacturer.id,
            },
            success: true,
            startedAt: {
              gte: subHours(new Date(), 1),
            },
          },
        });

        const successRate = recentAttempts > 0
          ? recentSuccesses / recentAttempts
          : 0;

        return {
          manufacturerId: manufacturer.id,
          name: manufacturer.name,
          status: this.determineHealthStatus(successRate, circuitState),
          circuitBreakerState: circuitState,
          successRate,
          rateLimitRemaining: rateLimit?.remaining,
          lastSuccessAt: await this.getLastSuccessTime(manufacturer.id),
          alertActive: this.alerts.hasActiveAlert(manufacturer.id),
        };
      })
    );

    return healthData;
  }

  private determineHealthStatus(
    successRate: number,
    circuitState: string
  ): 'healthy' | 'degraded' | 'down' {
    if (circuitState === 'OPEN') return 'down';
    if (successRate < 0.5) return 'down';
    if (successRate < 0.8) return 'degraded';
    return 'healthy';
  }
}
```

## Implementation Priorities

### Phase 1: Foundation (Week 1-2)
1. Set up connector interface and base classes
2. Implement circuit breaker and rate limiter
3. Create manufacturer configuration system
4. Set up BullMQ job queue infrastructure

### Phase 2: Core Connectors (Week 3-4)
1. Implement Apple API connector (highest success probability)
2. Implement Samsung connector (API + fallback to web automation)
3. Create universal data mapper
4. Build registration pipeline orchestrator

### Phase 3: Monitoring & Testing (Week 5)
1. Build monitoring dashboard
2. Implement health checks and alerts
3. Create integration tests
4. Load testing and optimization

### Phase 4: Scale Out (Week 6+)
1. Add remaining Tier 1 manufacturers
2. Implement batch processing
3. Add advanced retry strategies
4. Build self-healing capabilities

## Database Schema Updates

```sql
-- Add indexes for performance
CREATE INDEX idx_registration_manufacturer_status
ON Registration(manufacturerId, status);

CREATE INDEX idx_registration_created_at
ON Registration(createdAt);

CREATE INDEX idx_attempt_success_started
ON RegistrationAttempt(success, startedAt);

-- Add connector metrics table
CREATE TABLE ConnectorMetrics (
  id TEXT PRIMARY KEY,
  manufacturerId TEXT NOT NULL,
  method TEXT NOT NULL,
  timestamp DATETIME NOT NULL,
  successCount INTEGER DEFAULT 0,
  failureCount INTEGER DEFAULT 0,
  avgLatencyMs INTEGER,
  p95LatencyMs INTEGER,
  circuitBreakerTrips INTEGER DEFAULT 0,
  rateLimitHits INTEGER DEFAULT 0,
  FOREIGN KEY (manufacturerId) REFERENCES Manufacturer(id)
);
```

## Security Considerations

1. **Credential Management**: Use HashiCorp Vault or AWS Secrets Manager
2. **API Key Rotation**: Implement automatic key rotation every 90 days
3. **Rate Limiting**: Implement per-user and per-IP rate limits
4. **Data Encryption**: Encrypt sensitive fields (serial numbers, PII) at rest
5. **Audit Logging**: Log all registration attempts with user attribution
6. **Input Validation**: Sanitize all inputs before sending to manufacturers
7. **CORS Configuration**: Restrict API access to authorized domains

## Performance Targets

- **API Response Time**: < 200ms p50, < 500ms p95
- **Registration Processing**: < 30 seconds for API, < 2 minutes for automation
- **Success Rate**: > 85% for Tier 1 manufacturers
- **Queue Throughput**: 1000 registrations/minute
- **System Availability**: 99.9% uptime SLA
- **Circuit Breaker Recovery**: < 5 minutes
- **Database Query Time**: < 50ms for all indexed queries

## Cost Analysis

### At 10,000 registrations/month:
- **Infrastructure**: ~$200/month (AWS/Vercel)
- **API Costs**: ~$50/month (manufacturer APIs)
- **Monitoring**: ~$100/month (DataDog/New Relic)
- **Total**: ~$350/month

### At 100,000 registrations/month:
- **Infrastructure**: ~$800/month
- **API Costs**: ~$500/month
- **Monitoring**: ~$300/month
- **Total**: ~$1,600/month

### At 1,000,000 registrations/month:
- **Infrastructure**: ~$5,000/month
- **API Costs**: ~$3,000/month
- **Monitoring**: ~$1,000/month
- **Total**: ~$9,000/month

## Next Steps

1. Review and approve architecture
2. Set up development environment with Docker
3. Implement Phase 1 foundation components
4. Create Apple connector as proof of concept
5. Build monitoring dashboard MVP
6. Begin manufacturer outreach for API access