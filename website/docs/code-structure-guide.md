# Code Structure Guide

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.sample .env

# Add these to .env:
# SAMSUNG_API_KEY=your_key_here
# APPLE_JWT_TOKEN=your_token_here
# REDIS_URL=redis://localhost:6379

# 3. Start Redis (required for queue)
docker run -d -p 6379:6379 redis:alpine

# 4. Run database migrations
npm run prisma:migrate

# 5. Start development server
npm run dev

# 6. Start worker process (in separate terminal)
npm run worker:dev
```

## Complete File Structure

```
website/
│
├── src/
│   │
│   ├── lib/                           # Core business logic
│   │   │
│   │   ├── connectors/                # Manufacturer integrations
│   │   │   ├── base/
│   │   │   │   └── ManufacturerConnector.ts    # Base classes
│   │   │   │       - ManufacturerConnector (abstract base)
│   │   │   │       - ApiConnector (REST API base)
│   │   │   │       - WebAutomationConnector (Playwright base)
│   │   │   │       - CircuitBreaker implementation
│   │   │   │       - RateLimiter implementation
│   │   │   │       - Logger utility
│   │   │   │
│   │   │   ├── manufacturers/         # Specific implementations
│   │   │   │   ├── AppleConnector.ts
│   │   │   │   │   └── extends ApiConnector
│   │   │   │   │       - API integration
│   │   │   │   │       - Serial number validation (12 chars)
│   │   │   │   │       - 90-day purchase window
│   │   │   │   │       - JWT authentication
│   │   │   │   │
│   │   │   │   ├── SamsungConnector.ts
│   │   │   │   │   └── extends ApiConnector
│   │   │   │   │       - Primary: API integration
│   │   │   │   │       - Fallback: Web automation (Playwright)
│   │   │   │   │       - Serial format: 8-20 alphanumeric
│   │   │   │   │       - Handles both methods seamlessly
│   │   │   │   │
│   │   │   │   ├── LGConnector.ts              # TODO
│   │   │   │   ├── WhirlpoolConnector.ts       # TODO
│   │   │   │   ├── HPConnector.ts              # TODO
│   │   │   │   └── DellConnector.ts            # TODO
│   │   │   │
│   │   │   └── ConnectorRegistry.ts            # Factory & lifecycle
│   │   │       - Register/unregister connectors
│   │   │       - Get connector by manufacturer ID
│   │   │       - Health check management
│   │   │       - Circuit breaker status
│   │   │       - Statistics aggregation
│   │   │
│   │   ├── pipeline/                  # Registration workflow (TODO)
│   │   │   ├── RegistrationPipeline.ts
│   │   │   │   - submitRegistration()
│   │   │   │   - processRegistration()
│   │   │   │   - executeFallback()
│   │   │   │   - createManualAssist()
│   │   │   │
│   │   │   ├── QueueManager.ts
│   │   │   │   - BullMQ configuration
│   │   │   │   - Job priorities (high/normal/low)
│   │   │   │   - Worker management
│   │   │   │
│   │   │   └── FallbackStrategy.ts
│   │   │       - Determine fallback order
│   │   │       - Generate manual assist materials
│   │   │
│   │   ├── mappers/                   # Data transformation (TODO)
│   │   │   ├── UniversalDataMapper.ts
│   │   │   │   - toManufacturerFormat()
│   │   │   │   - Manufacturer-specific mappers
│   │   │   │   - Field validation
│   │   │   │
│   │   │   └── FieldValidator.ts
│   │   │       - Validate serial numbers
│   │   │       - Validate dates
│   │   │       - Pattern matching
│   │   │
│   │   ├── monitoring/                # Observability (TODO)
│   │   │   ├── RegistrationMonitor.ts
│   │   │   │   - getDashboardData()
│   │   │   │   - getSuccessRates()
│   │   │   │   - getLatencies()
│   │   │   │   - getManufacturerHealth()
│   │   │   │
│   │   │   ├── MetricsCollector.ts
│   │   │   │   - Record registration attempts
│   │   │   │   - Calculate aggregates
│   │   │   │   - Store metrics in DB
│   │   │   │
│   │   │   └── AlertManager.ts
│   │   │       - Check thresholds
│   │   │       - Send alerts (email/Slack)
│   │   │       - Alert history
│   │   │
│   │   └── services/
│   │       └── data-formatter.ts       # Field formatting (EXISTS)
│   │           - formatDate()
│   │           - formatPhone()
│   │           - formatAddress()
│   │           - formatSerialNumber()
│   │
│   ├── config/
│   │   └── manufacturers.config.ts     # Central configuration
│   │       - TIER_1_MANUFACTURERS (Top 20)
│   │       - TIER_2_MANUFACTURERS (21-50)
│   │       - TIER_3_MANUFACTURERS (51-100)
│   │       - API endpoints, auth, selectors
│   │       - Validation rules
│   │       - Fallback strategies
│   │
│   ├── types/
│   │   ├── device.ts                   # Device types (EXISTS)
│   │   ├── connector.ts                # Connector types (TODO)
│   │   └── registration.ts             # Registration types (TODO)
│   │
│   ├── app/
│   │   ├── api/
│   │   │   ├── registration/           # Registration endpoints (TODO)
│   │   │   │   ├── submit/
│   │   │   │   │   └── route.ts        # POST - Create registration
│   │   │   │   ├── status/
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── route.ts    # GET - Check status
│   │   │   │   └── complete/
│   │   │   │       └── [id]/
│   │   │   │           └── route.ts    # POST - Mark manual complete
│   │   │   │
│   │   │   ├── analytics/              # Monitoring endpoints (TODO)
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── route.ts        # GET - Dashboard data
│   │   │   │   └── manufacturers/
│   │   │   │       └── route.ts        # GET - Manufacturer health
│   │   │   │
│   │   │   └── health/
│   │   │       └── route.ts            # GET - System health
│   │   │
│   │   ├── dashboard/                  # Admin dashboard (TODO)
│   │   │   └── page.tsx
│   │   │
│   │   └── register/                   # User registration flow
│   │       └── page.tsx
│   │
│   └── workers/                        # Background jobs (TODO)
│       ├── registration-worker.ts      # Process queue jobs
│       └── health-check-worker.ts      # Periodic health checks
│
├── prisma/
│   └── schema.prisma                   # Database schema (EXISTS)
│       - User, Product, Registration models
│       - Manufacturer, RegistrationAttempt
│       - Metrics and analytics tables
│
├── docs/                               # Documentation
│   ├── manufacturer-api-architecture.md   # Main architecture doc
│   ├── sequence-diagrams.md              # Flow diagrams
│   ├── implementation-roadmap.md         # Implementation plan
│   └── code-structure-guide.md           # This file
│
├── tests/                              # Tests (TODO)
│   ├── connectors/
│   │   ├── AppleConnector.test.ts
│   │   └── SamsungConnector.test.ts
│   └── integration/
│       └── registration-flow.test.ts
│
├── .env.sample                         # Environment template
├── package.json                        # Dependencies (EXISTS)
├── tsconfig.json                       # TypeScript config
└── docker-compose.yml                  # Local development (TODO)
```

## Key Components Explained

### 1. ManufacturerConnector (Base Class)

**Location**: `src/lib/connectors/base/ManufacturerConnector.ts`

```typescript
// Abstract base class that all connectors extend
export abstract class ManufacturerConnector {
  // Must implement:
  abstract register(request): Promise<RegistrationResponse>
  abstract healthCheck(): Promise<HealthStatus>
  abstract validateRequest(request): ValidationResult
  abstract mapToManufacturerFormat(request): any

  // Built-in features:
  - Circuit breaker pattern
  - Rate limiting
  - Logging
  - Error handling
  - Metrics tracking
}
```

**Purpose**: Provides consistent interface and shared functionality for all manufacturer integrations.

### 2. AppleConnector (Implementation Example)

**Location**: `src/lib/connectors/manufacturers/AppleConnector.ts`

```typescript
export class AppleConnector extends ApiConnector {
  // Configuration
  - baseUrl: https://api.apple.com/support
  - authType: JWT
  - rateLimit: 100 requests/minute

  // Validation rules
  - Serial number: Exactly 12 alphanumeric characters
  - Purchase date: Within 90 days
  - Required fields: serialNumber, purchaseDate, email

  // Flow:
  1. Validate request data
  2. Check circuit breaker
  3. Apply rate limiting
  4. Map to Apple format
  5. POST to /v1/warranty/register
  6. Return confirmation code
}
```

### 3. SamsungConnector (Fallback Example)

**Location**: `src/lib/connectors/manufacturers/SamsungConnector.ts`

```typescript
export class SamsungConnector extends ApiConnector {
  // Primary method: API
  async registerViaAPI(request) {
    - POST to /v1/products/register
    - Return confirmation code
  }

  // Fallback method: Web Automation
  async registerViaWebAutomation(request) {
    1. Launch Playwright browser
    2. Navigate to samsung.com/register
    3. Fill form fields
    4. Submit
    5. Extract confirmation from success page
    6. Return result
  }

  // Automatic fallback
  async register(request) {
    try {
      return await this.registerViaAPI(request);
    } catch (error) {
      return await this.registerViaWebAutomation(request);
    }
  }
}
```

### 4. ConnectorRegistry (Factory)

**Location**: `src/lib/connectors/ConnectorRegistry.ts`

```typescript
export class ConnectorRegistry {
  // Singleton registry of all connectors
  private connectors: Map<string, ManufacturerConnector>

  // Usage:
  const registry = getConnectorRegistry();
  const connector = registry.getConnector('apple');
  const result = await connector.register(request);

  // Features:
  - Lazy loading
  - Health check management
  - Circuit breaker monitoring
  - Statistics aggregation
}
```

### 5. Manufacturer Configuration

**Location**: `src/config/manufacturers.config.ts`

```typescript
export const MANUFACTURERS = {
  samsung: {
    id: 'samsung',
    tier: 1,
    estimatedVolume: 0.09,
    api: {
      baseUrl: 'https://api.samsung.com',
      authType: 'oauth2',
      endpoints: { register: '/v1/products/register' }
    },
    automation: {
      registrationUrl: 'https://samsung.com/register',
      selectors: { /* CSS selectors */ }
    },
    validation: {
      serialNumber: { pattern: '^[A-Z0-9]{8,20}$' }
    },
    fallback: {
      primary: 'API',
      secondary: 'AUTOMATION_RELIABLE'
    }
  }
  // ... more manufacturers
}
```

### 6. Registration Pipeline (To Be Implemented)

**Location**: `src/lib/pipeline/RegistrationPipeline.ts`

```typescript
export class RegistrationPipeline {
  // Main flow:
  async submitRegistration(userId, productId) {
    1. Load user and product data
    2. Create registration record in DB
    3. Queue job in BullMQ
    4. Return job ID
  }

  async processRegistration(job) {
    1. Get connector for manufacturer
    2. Check circuit breaker
    3. Validate request
    4. Execute registration
    5. Handle success/failure
    6. Try fallback if needed
    7. Update database
    8. Notify user
  }
}
```

## Usage Examples

### Example 1: Submit Registration

```typescript
// In API route: /api/registration/submit/route.ts
import { RegistrationPipeline } from '@/lib/pipeline/RegistrationPipeline';

export async function POST(request: Request) {
  const { userId, productId } = await request.json();

  const pipeline = new RegistrationPipeline();
  const jobId = await pipeline.submitRegistration(userId, productId);

  return Response.json({
    success: true,
    jobId,
    message: 'Registration queued for processing'
  });
}
```

### Example 2: Direct Connector Usage

```typescript
// In worker: registration-worker.ts
import { getConnectorRegistry } from '@/lib/connectors/ConnectorRegistry';

const registry = getConnectorRegistry();
const connector = registry.getConnector('apple');

if (!connector) {
  throw new Error('No connector for Apple');
}

// Prepare request
const request = {
  user: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
  product: { serialNumber: 'C02ABC12XYZ', modelNumber: 'MacBook Pro' },
  purchase: { date: new Date(), price: 2499 },
  documents: []
};

// Execute registration
const response = await connector.register(request);

if (response.success) {
  console.log('Confirmation:', response.confirmationCode);
}
```

### Example 3: Check Health

```typescript
// In health check worker
import { getConnectorRegistry } from '@/lib/connectors/ConnectorRegistry';

const registry = getConnectorRegistry();
const healthStatuses = await registry.healthCheckAll();

healthStatuses.forEach((healthy, manufacturerId) => {
  if (!healthy) {
    console.error(`${manufacturerId} is unhealthy!`);
    // Trigger alert
  }
});
```

### Example 4: Monitor Circuit Breaker

```typescript
// In monitoring dashboard
import { getConnectorRegistry } from '@/lib/connectors/ConnectorRegistry';

const registry = getConnectorRegistry();
const circuitStates = registry.getCircuitBreakerStatuses();

// Display on dashboard
circuitStates.forEach((state, manufacturerId) => {
  console.log(`${manufacturerId}: ${state}`);
  // CLOSED = healthy
  // OPEN = blocking requests
  // HALF_OPEN = testing recovery
});
```

## Environment Variables

```bash
# API Credentials
SAMSUNG_API_KEY=your_samsung_key
SAMSUNG_PARTNER_ID=your_partner_id
APPLE_JWT_TOKEN=your_apple_token
APPLE_PARTNER_ID=your_apple_partner_id

# Infrastructure
DATABASE_URL=file:./dev.db
REDIS_URL=redis://localhost:6379

# Monitoring (optional)
DATADOG_API_KEY=your_datadog_key
SLACK_WEBHOOK_URL=your_slack_webhook

# Feature Flags
ENABLE_WEB_AUTOMATION=true
ENABLE_MANUAL_ASSIST=true
```

## Database Migrations

```bash
# Create new migration
npx prisma migrate dev --name add_connector_metrics

# Apply migrations
npx prisma migrate deploy

# View database
npx prisma studio
```

## Testing

```bash
# Run all tests
npm test

# Test specific connector
npm test AppleConnector

# Integration tests
npm test -- --testPathPattern=integration

# With coverage
npm test -- --coverage
```

## Development Workflow

```bash
# Terminal 1: Next.js dev server
npm run dev

# Terminal 2: Worker process
npm run worker:dev

# Terminal 3: Redis
docker-compose up redis

# Terminal 4: Prisma Studio (database viewer)
npm run prisma:studio
```

## Adding a New Manufacturer

1. **Create connector class**
   ```typescript
   // src/lib/connectors/manufacturers/NewManufacturerConnector.ts
   export class NewManufacturerConnector extends ApiConnector {
     // Implement required methods
   }
   ```

2. **Add configuration**
   ```typescript
   // src/config/manufacturers.config.ts
   export const TIER_1_MANUFACTURERS = {
     newmanufacturer: {
       id: 'newmanufacturer',
       // ... configuration
     }
   }
   ```

3. **Register in registry**
   ```typescript
   // src/lib/connectors/ConnectorRegistry.ts
   this.registerConnectorFactory('newmanufacturer', createNewManufacturerConnector);
   ```

4. **Write tests**
   ```typescript
   // tests/connectors/NewManufacturerConnector.test.ts
   describe('NewManufacturerConnector', () => {
     // Test cases
   });
   ```

5. **Deploy and monitor**
   - Push to staging
   - Run integration tests
   - Monitor success rate
   - Adjust thresholds

## Troubleshooting

### Circuit Breaker Stuck Open
```typescript
const registry = getConnectorRegistry();
registry.resetCircuitBreaker('manufacturer_id');
```

### Queue Not Processing
```bash
# Check Redis connection
redis-cli ping

# Check worker logs
npm run worker:dev

# View queue in Bull Board (optional)
# http://localhost:3000/admin/queues
```

### Registration Failing
```typescript
// Enable debug logging
process.env.LOG_LEVEL = 'debug';

// Check connector health
const health = await connector.healthCheck();
console.log(health);
```

## Performance Tuning

```typescript
// Adjust rate limits
rateLimit: {
  maxRequests: 100, // Lower if hitting limits
  windowMs: 60000    // 1 minute window
}

// Tune circuit breaker
{
  threshold: 5,       // Failures before opening
  timeout: 60000,     // Wait before retry (ms)
  successThreshold: 3 // Successes to close
}

// Worker concurrency
const worker = new Worker('registrations', processor, {
  concurrency: 10 // Process 10 jobs simultaneously
});
```

## Next Steps

1. Review this guide
2. Set up local environment
3. Test Apple connector with sandbox credentials
4. Implement registration pipeline
5. Build monitoring dashboard
6. Add more connectors
