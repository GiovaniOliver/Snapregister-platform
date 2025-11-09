# Quick Start Guide - Warranty Analyzer

Get up and running with the AI warranty analyzer in 5 minutes.

## Prerequisites

- Docker and Docker Compose installed
- Anthropic API key ([Get one here](https://console.anthropic.com/))

## Setup Steps

### 1. Configure Environment

```bash
cd website/services/warranty-analyzer

# Copy environment template
cp .env.sample .env

# Edit .env and add your Anthropic API key
# ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
```

### 2. Start the Service

```bash
# Start all services (warranty-analyzer, PostgreSQL, Redis)
docker-compose up -d

# Check logs
docker-compose logs -f
```

### 3. Verify Service

```bash
# Health check
curl http://localhost:8001/health

# You should see:
# {"status":"healthy","version":"1.0.0",...}
```

### 4. Test the API

#### Using cURL

```bash
# Analyze a warranty document
curl -X POST http://localhost:8001/analyze-warranty \
  -F "file=@path/to/warranty.pdf" \
  -F "user_id=user123"
```

#### Using the Interactive Docs

Open http://localhost:8001/docs in your browser for interactive API documentation.

### 5. Integrate with Next.js

Add to `website/.env`:

```bash
WARRANTY_SERVICE_URL=http://localhost:8001
```

Use in your Next.js app:

```tsx
import WarrantyAnalyzerPage from '@/components/warranty/WarrantyAnalyzerPage';

export default function Page() {
  return <WarrantyAnalyzerPage userId="user123" />;
}
```

## Example API Response

```json
{
  "id": "warranty_abc123",
  "status": "COMPLETED",
  "confidence_score": 0.92,
  "ai_summary": "This is a 2-year limited warranty covering manufacturing defects and parts. Not covered: water damage, normal wear, accidents. Claims must be filed within warranty period with proof of purchase.",
  "duration": "24 months",
  "duration_months": 24,
  "expiry_date": "2026-01-15T00:00:00Z",
  "coverage_items": [
    "Manufacturing defects",
    "Parts replacement",
    "Labor costs"
  ],
  "exclusions": [
    "Water damage",
    "Normal wear and tear",
    "Accidental damage",
    "Cosmetic damage"
  ],
  "claim_procedure": "Contact customer service at 1-800-XXX-XXXX within 30 days of discovering defect. Provide proof of purchase, photos of defect, and product serial number.",
  "claim_contacts": {
    "phone": "1-800-XXX-XXXX",
    "email": "warranty@company.com",
    "website": "https://company.com/warranty"
  },
  "critical_highlights": [
    {
      "text": "Must register product within 30 days of purchase to activate warranty",
      "category": "critical",
      "icon": "🔴",
      "importance": 5
    },
    {
      "text": "Proof of purchase required for all claims",
      "category": "critical",
      "icon": "🔴",
      "importance": 5
    }
  ],
  "warning_highlights": [
    {
      "text": "Water damage voids warranty",
      "category": "warning",
      "icon": "⚠️",
      "importance": 4
    },
    {
      "text": "Unauthorized repairs void warranty",
      "category": "warning",
      "icon": "⚠️",
      "importance": 4
    }
  ]
}
```

## Common Use Cases

### 1. Product Registration Flow

```tsx
// User uploads warranty during product registration
<ProductRegistrationForm>
  <WarrantyUploader
    userId={userId}
    productId={productId}
    onAnalysisComplete={(analysis) => {
      // Auto-fill warranty fields
      setWarrantyDuration(analysis.duration_months);
      setWarrantyExpiry(analysis.expiry_date);
    }}
  />
</ProductRegistrationForm>
```

### 2. Warranty Dashboard

```tsx
// Display all user warranties
<WarrantyDashboard>
  {warranties.map(warranty => (
    <WarrantyCard
      key={warranty.id}
      warranty={warranty}
      expiringIn={calculateDaysRemaining(warranty.expiry_date)}
    />
  ))}
</WarrantyDashboard>
```

### 3. Warranty Alerts

```tsx
// Notify users of expiring warranties
const expiringWarranties = warranties.filter(w =>
  isExpiringSoon(w.expiry_date, 30) // 30 days
);

{expiringWarranties.map(w => (
  <Alert severity="warning">
    Your {w.productName} warranty expires in {daysRemaining} days!
  </Alert>
))}
```

## Troubleshooting

### Service won't start

```bash
# Check Docker is running
docker ps

# Check logs for errors
docker-compose logs warranty-analyzer

# Restart services
docker-compose restart
```

### API returns 500 error

```bash
# Check Anthropic API key is valid
docker-compose exec warranty-analyzer printenv | grep ANTHROPIC

# Check Claude API is accessible
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: YOUR_KEY"
```

### Low OCR confidence

- Ensure image is high quality (300+ DPI)
- Convert scanned PDFs to images first
- Use well-lit, clear photos

## Next Steps

1. ✅ Service running successfully
2. 📖 Read [full documentation](./README.md)
3. 🔧 Read [integration guide](./INTEGRATION.md)
4. 🚀 Deploy to production
5. 📊 Set up monitoring

## Resources

- **API Documentation**: http://localhost:8001/docs
- **Full README**: [README.md](./README.md)
- **Integration Guide**: [INTEGRATION.md](./INTEGRATION.md)
- **Anthropic Docs**: https://docs.anthropic.com/

## Support

Questions? Issues?
- 📧 Email: support@snapregister.com
- 🐛 GitHub Issues: [Create an issue]
- 💬 Discord: [Join our community]

---

**Ready to build?** Start by uploading your first warranty document! 🚀
