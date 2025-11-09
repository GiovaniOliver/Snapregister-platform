# Warranty Analyzer Integration Guide

Complete guide for integrating the AI warranty analyzer into your Snapregister application.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Service Setup](#service-setup)
3. [Database Integration](#database-integration)
4. [API Integration](#api-integration)
5. [Frontend Integration](#frontend-integration)
6. [Production Deployment](#production-deployment)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Frontend                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  WarrantyAnalyzerPage Component                      │  │
│  │    ├─ WarrantyUploader (file upload)                 │  │
│  │    └─ WarrantyAnalysisDisplay (results)              │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Next.js API Routes (/api/warranty/*)                │  │
│  │    ├─ POST /api/warranty/analyze                     │  │
│  │    └─ GET /api/warranty/[id]                         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          ↓ HTTP
┌─────────────────────────────────────────────────────────────┐
│               Python Warranty Analyzer Service              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  FastAPI Application                                 │  │
│  │    ├─ POST /analyze-warranty                         │  │
│  │    ├─ GET /warranty-contract/{id}                    │  │
│  │    └─ POST /reanalyze                                │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ Document     │  │ Claude AI    │  │ Database        │  │
│  │ Processor    │  │ Analyzer     │  │ (PostgreSQL)    │  │
│  │ (PDF/OCR)    │  │ (API)        │  │                 │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Service Setup

### 1. Start Warranty Analyzer Service

#### Using Docker Compose (Recommended)

```bash
cd website/services/warranty-analyzer
docker-compose up -d
```

This starts:
- Warranty analyzer service (port 8001)
- PostgreSQL database (port 5432)
- Redis cache (port 6379)

#### Using Python Virtual Environment

```bash
cd website/services/warranty-analyzer

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export ANTHROPIC_API_KEY=your-key-here

# Run service
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001
```

### 2. Verify Service is Running

```bash
# Check health endpoint
curl http://localhost:8001/health

# Expected response:
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "api": true,
    "claude_ai": true,
    "storage": true
  }
}
```

## Database Integration

### 1. Run Prisma Migration

The `WarrantyContract` model has been added to your Prisma schema. Run migrations:

```bash
cd website

# Generate Prisma client
npx prisma generate

# Run migrations (SQLite for development)
npx prisma migrate dev --name add_warranty_contract

# For production (PostgreSQL)
npx prisma migrate deploy
```

### 2. Warranty Contract Schema

```prisma
model WarrantyContract {
  id              String   @id @default(cuid())
  userId          String
  productId       String?  @unique

  // Document Information
  documentUrl     String
  documentType    String
  fileName        String
  fileSize        Int

  // Extracted Text
  contractText    String
  ocrConfidence   Float?

  // AI Analysis Results
  aiSummary       String?
  confidenceScore Float?

  // Warranty Details
  duration        String?
  durationMonths  Int?
  startDate       DateTime?
  expiryDate      DateTime?

  // Coverage (JSON)
  coverageItems   String   @default("[]")
  exclusions      String   @default("[]")
  limitations     String   @default("[]")

  // Claim Info
  claimProcedure  String?
  claimContacts   String   @default("{}")
  requiredDocs    String   @default("[]")

  // Critical Dates
  criticalDates   String   @default("[]")

  // Additional Terms
  transferable    Boolean?
  extendedOptions String?

  // Status
  status          WarrantyAnalysisStatus @default(PROCESSING)

  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  user            User @relation(fields: [userId], references: [id])
  product         Product?
}
```

### 3. Saving Analysis Results to Database

Create a server action or API route:

```typescript
// app/actions/warranty.ts
'use server';

import { prisma } from '@/lib/prisma';
import { WarrantyAnalysis } from '@/types/warrantyAnalysis';

export async function saveWarrantyAnalysis(
  analysis: WarrantyAnalysis,
  userId: string,
  productId?: string
) {
  return await prisma.warrantyContract.create({
    data: {
      id: analysis.id,
      userId,
      productId,
      documentUrl: analysis.document_url,
      documentType: analysis.document_type,
      fileName: analysis.file_name,
      fileSize: analysis.file_size,
      contractText: analysis.contract_text || '',
      ocrConfidence: analysis.ocr_confidence,
      aiSummary: analysis.ai_summary,
      confidenceScore: analysis.confidence_score,
      duration: analysis.duration,
      durationMonths: analysis.duration_months,
      startDate: analysis.start_date ? new Date(analysis.start_date) : null,
      expiryDate: analysis.expiry_date ? new Date(analysis.expiry_date) : null,
      coverageItems: JSON.stringify(analysis.coverage_items),
      exclusions: JSON.stringify(analysis.exclusions),
      limitations: JSON.stringify(analysis.limitations),
      claimProcedure: analysis.claim_procedure,
      claimContacts: JSON.stringify(analysis.claim_contacts),
      requiredDocs: JSON.stringify(analysis.required_docs),
      criticalDates: JSON.stringify(analysis.critical_dates),
      transferable: analysis.transferable,
      extendedOptions: analysis.extended_options,
      status: analysis.status,
      criticalHighlights: JSON.stringify(analysis.critical_highlights),
      warningHighlights: JSON.stringify(analysis.warning_highlights),
      infoHighlights: JSON.stringify(analysis.info_highlights),
    },
  });
}
```

## API Integration

### 1. Environment Variables

Add to `website/.env`:

```bash
# Warranty Analyzer Service
WARRANTY_SERVICE_URL=http://localhost:8001

# For production
# WARRANTY_SERVICE_URL=https://warranty-analyzer.yourdomain.com
```

### 2. Next.js API Routes

Already created at:
- `src/app/api/warranty/analyze/route.ts` - Upload & analyze
- `src/app/api/warranty/[id]/route.ts` - Retrieve analysis

### 3. Example API Usage

```typescript
// Client-side usage
async function analyzeWarranty(file: File, userId: string, productId?: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('user_id', userId);
  if (productId) {
    formData.append('product_id', productId);
  }

  const response = await fetch('/api/warranty/analyze', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to analyze warranty');
  }

  return await response.json();
}
```

## Frontend Integration

### 1. Import Components

```tsx
// app/warranty/page.tsx
import WarrantyAnalyzerPage from '@/components/warranty/WarrantyAnalyzerPage';

export default function WarrantyPage() {
  return (
    <WarrantyAnalyzerPage
      userId="user123"  // Get from session
      productId="product456"  // Optional
      onBack={() => router.back()}
    />
  );
}
```

### 2. Integration with Product Registration Flow

```tsx
// app/register/[productId]/page.tsx
import { useState } from 'react';
import WarrantyUploader from '@/components/warranty/WarrantyUploader';
import { WarrantyAnalysis } from '@/types/warrantyAnalysis';

export default function ProductRegistrationPage({ params }) {
  const [warrantyAnalysis, setWarrantyAnalysis] = useState<WarrantyAnalysis | null>(null);

  const handleAnalysisComplete = async (analysis: WarrantyAnalysis) => {
    setWarrantyAnalysis(analysis);

    // Save to database
    await saveWarrantyAnalysis(analysis, userId, params.productId);

    // Auto-fill warranty fields in product registration form
    updateProductWarrantyFields({
      duration: analysis.duration_months,
      expiryDate: analysis.expiry_date,
      warrantyContractId: analysis.id,
    });
  };

  return (
    <div>
      <h1>Register Your Product</h1>

      {/* Step 1: Upload warranty */}
      <WarrantyUploader
        userId={userId}
        productId={params.productId}
        onAnalysisComplete={handleAnalysisComplete}
      />

      {/* Step 2: Review and complete registration */}
      {warrantyAnalysis && (
        <ProductRegistrationForm
          warranty={warrantyAnalysis}
        />
      )}
    </div>
  );
}
```

### 3. Dashboard Integration

```tsx
// app/dashboard/warranties/page.tsx
import { prisma } from '@/lib/prisma';
import WarrantyAnalysisDisplay from '@/components/warranty/WarrantyAnalysisDisplay';

export default async function WarrantiesPage() {
  const warranties = await prisma.warrantyContract.findMany({
    where: { userId },
    include: { product: true },
    orderBy: { expiryDate: 'asc' },
  });

  return (
    <div>
      <h1>Your Warranties</h1>

      {warranties.map((warranty) => (
        <WarrantyCard key={warranty.id} warranty={warranty} />
      ))}
    </div>
  );
}
```

## Production Deployment

### 1. Deploy Warranty Service

#### Option A: Docker on Cloud Provider

```bash
# Build image
docker build -t warranty-analyzer:latest .

# Push to registry
docker tag warranty-analyzer:latest your-registry/warranty-analyzer:latest
docker push your-registry/warranty-analyzer:latest

# Deploy to cloud (AWS ECS, Google Cloud Run, etc.)
```

#### Option B: Platform as a Service (Railway, Fly.io)

```bash
# Install fly CLI
fly launch

# Deploy
fly deploy
```

### 2. Configure Production Environment

```bash
# Set environment variables
WARRANTY_SERVICE_URL=https://warranty-analyzer.yourdomain.com
ANTHROPIC_API_KEY=sk-ant-api03-production-key
DATABASE_URL=postgresql://user:pass@prod-db:5432/snapregister
REDIS_URL=redis://prod-redis:6379/0
ENVIRONMENT=production
LOG_LEVEL=INFO
```

### 3. Set Up File Storage

For production, use cloud storage instead of local filesystem:

```typescript
// Use S3, Google Cloud Storage, or similar
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

async function uploadToS3(file: File) {
  const s3 = new S3Client({ region: 'us-east-1' });

  const command = new PutObjectCommand({
    Bucket: 'snapregister-warranties',
    Key: `${userId}/${Date.now()}-${file.name}`,
    Body: await file.arrayBuffer(),
  });

  await s3.send(command);
}
```

### 4. Monitoring & Alerts

Set up monitoring for:
- API response times
- Error rates
- Claude API usage
- Storage usage
- Queue length

```python
# Add to app/main.py
from prometheus_client import Counter, Histogram

warranty_analysis_counter = Counter('warranty_analysis_total', 'Total warranty analyses')
warranty_analysis_duration = Histogram('warranty_analysis_duration_seconds', 'Analysis duration')
```

### 5. Cost Optimization

1. **Caching**: Cache frequently accessed warranties in Redis
2. **Rate Limiting**: Prevent abuse with rate limits
3. **Batch Processing**: Process multiple warranties in parallel
4. **Page Limits**: Limit scanned PDFs to first 10 pages
5. **Image Optimization**: Compress images before sending to Claude

## Testing Integration

### 1. Unit Tests

```python
# tests/test_warranty_analyzer.py
import pytest
from app.warranty_analyzer import WarrantyAnalyzer

@pytest.mark.asyncio
async def test_analyze_warranty():
    analyzer = WarrantyAnalyzer()

    sample_text = """
    LIMITED WARRANTY
    Duration: 2 years from date of purchase
    Coverage: Manufacturing defects and parts
    Exclusions: Water damage, accidental damage
    """

    result = await analyzer.analyze_warranty(sample_text)

    assert result.duration_months == 24
    assert "Manufacturing defects" in result.coverage_items
    assert "Water damage" in result.exclusions
```

### 2. Integration Tests

```typescript
// __tests__/api/warranty.test.ts
import { POST } from '@/app/api/warranty/analyze/route';

describe('Warranty Analysis API', () => {
  it('should analyze warranty PDF', async () => {
    const formData = new FormData();
    formData.append('file', new File(['...'], 'warranty.pdf'));
    formData.append('user_id', 'test-user');

    const response = await POST({ formData } as any);
    const data = await response.json();

    expect(data.status).toBe('COMPLETED');
    expect(data.confidence_score).toBeGreaterThan(0.5);
  });
});
```

### 3. End-to-End Tests

```typescript
// e2e/warranty.spec.ts
import { test, expect } from '@playwright/test';

test('warranty analysis flow', async ({ page }) => {
  await page.goto('/warranty/analyze');

  // Upload warranty
  await page.setInputFiles('input[type="file"]', 'test-warranty.pdf');
  await page.click('button:has-text("Analyze")');

  // Wait for analysis
  await expect(page.locator('text=Analysis Complete')).toBeVisible();

  // Verify results
  await expect(page.locator('[data-testid="warranty-duration"]')).toContainText('24 months');
});
```

## Troubleshooting

### Service Connection Issues

```bash
# Check service is running
curl http://localhost:8001/health

# Check Docker logs
docker-compose logs -f warranty-analyzer

# Check network connectivity
docker-compose exec warranty-analyzer ping next-app
```

### API Key Issues

```bash
# Verify API key is set
docker-compose exec warranty-analyzer printenv | grep ANTHROPIC

# Test Claude API directly
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01"
```

### Database Connection Issues

```bash
# Check database is accessible
docker-compose exec warranty-analyzer pg_isready -h postgres

# Run Prisma studio
npx prisma studio
```

## Support

For integration help:
- 📧 Email: dev@snapregister.com
- 📚 Docs: [Full Documentation](./README.md)
- 🐛 Issues: GitHub Issues

## Next Steps

1. ✅ Service deployed and running
2. ✅ Database migrations applied
3. ✅ API routes configured
4. ✅ Frontend components integrated
5. 🚀 Test end-to-end flow
6. 🚀 Deploy to production
7. 🚀 Monitor performance
8. 🚀 Gather user feedback
