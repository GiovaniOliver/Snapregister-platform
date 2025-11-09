# Warranty Analyzer Service

AI-powered warranty contract analysis using Claude AI. This microservice extracts key information from warranty documents (PDF and images) and provides structured data about warranty coverage, exclusions, claim procedures, and critical deadlines.

## Features

- **Document Processing**: Supports PDF and image files (PNG, JPEG)
- **OCR Extraction**: Uses Claude Vision API for scanned documents and images
- **AI Analysis**: Claude 3.5 Sonnet analyzes warranty text and extracts structured information
- **Comprehensive Extraction**:
  - Warranty duration and expiry dates
  - Coverage items and exclusions
  - Claim procedures and contact information
  - Critical dates and deadlines
  - Transferability information
  - Extended warranty options
- **Confidence Scoring**: AI provides confidence scores for extracted information
- **Highlighted Insights**: Categorizes information into critical, warning, and info highlights

## Tech Stack

- **Framework**: FastAPI (Python 3.12+)
- **AI**: Anthropic Claude 3.5 Sonnet
- **OCR**: Claude Vision API, PyPDF2, pdf2image
- **Database**: PostgreSQL (via SQLAlchemy async)
- **Caching**: Redis
- **Deployment**: Docker, Docker Compose

## Quick Start

### 1. Prerequisites

- Python 3.12+
- Docker & Docker Compose (recommended)
- Anthropic API key

### 2. Environment Setup

Copy `.env.sample` to `.env`:

```bash
cp .env.sample .env
```

Edit `.env` and add your Anthropic API key:

```bash
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
```

### 3. Local Development

#### Option A: Using Docker (Recommended)

```bash
# Build and start services
docker-compose up --build

# Service will be available at http://localhost:8001
```

#### Option B: Using Python Virtual Environment

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the service
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### 4. Verify Service

Visit http://localhost:8001/docs for interactive API documentation.

## API Endpoints

### POST /analyze-warranty

Analyze a warranty document and extract key information.

**Request:**
- `file`: Warranty document (PDF or image)
- `user_id`: User ID
- `product_id`: Optional product ID

**Response:**
```json
{
  "id": "warranty_abc123",
  "status": "COMPLETED",
  "confidence_score": 0.92,
  "ai_summary": "This is a 2-year limited warranty covering...",
  "duration": "24 months",
  "duration_months": 24,
  "expiry_date": "2026-01-15T00:00:00",
  "coverage_items": ["Manufacturing defects", "Parts replacement"],
  "exclusions": ["Water damage", "Normal wear and tear"],
  "claim_procedure": "Contact customer service at...",
  "critical_highlights": [
    {
      "text": "Must register within 30 days of purchase",
      "category": "critical",
      "icon": "🔴",
      "importance": 5
    }
  ]
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:8001/analyze-warranty" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@warranty.pdf" \
  -F "user_id=user123" \
  -F "product_id=product456"
```

### GET /warranty-contract/{id}

Retrieve a warranty analysis by ID.

### POST /reanalyze

Re-analyze an existing warranty contract (coming soon).

### GET /health

Health check endpoint.

## Architecture

```
warranty-analyzer/
├── app/
│   ├── __init__.py
│   ├── main.py                  # FastAPI application
│   ├── config.py                # Configuration management
│   ├── models.py                # Pydantic models
│   ├── document_processor.py   # PDF/Image processing & OCR
│   ├── warranty_analyzer.py    # Claude AI analysis
│   └── database.py             # Database operations
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── README.md
```

## Integration with Next.js App

### 1. Add Environment Variable

In `website/.env`:

```bash
WARRANTY_SERVICE_URL=http://localhost:8001
```

### 2. Use API Routes

The service is integrated via Next.js API routes:

```typescript
// Upload and analyze warranty
const formData = new FormData();
formData.append('file', file);
formData.append('user_id', userId);

const response = await fetch('/api/warranty/analyze', {
  method: 'POST',
  body: formData,
});

const analysis = await response.json();
```

### 3. Use React Components

```tsx
import WarrantyAnalyzerPage from '@/components/warranty/WarrantyAnalyzerPage';

export default function WarrantyPage() {
  return (
    <WarrantyAnalyzerPage
      userId="user123"
      productId="product456"
    />
  );
}
```

## Claude AI Prompt Engineering

The warranty analyzer uses a carefully crafted prompt to ensure accurate extraction:

```python
# Structured JSON output
# Explicit field definitions
# Categorized highlights (critical, warning, info)
# Confidence scoring
```

Key prompt strategies:
- Request structured JSON output
- Explicitly define all fields
- Ask for confidence scores
- Categorize information by importance
- Handle missing information gracefully

## Performance Considerations

### Document Processing
- PDF text extraction: ~1-2 seconds
- Image OCR (Claude Vision): ~3-5 seconds per page
- Large PDFs limited to first 10 pages for cost control

### AI Analysis
- Average analysis time: 5-10 seconds
- Claude 3.5 Sonnet: ~4000 tokens per analysis
- Cost per analysis: ~$0.02-$0.05

### Optimization Tips
1. **Caching**: Cache analyzed warranties in Redis
2. **Batch Processing**: Process multiple warranties in parallel
3. **Page Limits**: Limit scanned PDF pages to reduce costs
4. **Image Optimization**: Resize images before sending to Claude

## Error Handling

The service provides detailed error responses:

```json
{
  "error": "File too large",
  "detail": "Maximum file size is 10.0MB",
  "status_code": 413
}
```

Common errors:
- `400`: Invalid file type or missing required fields
- `413`: File too large (>10MB)
- `500`: Processing or AI analysis failure

## Monitoring & Logging

Logs are structured JSON (in production) for easy parsing:

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "message": "Analyzing warranty for user user123",
  "context": {
    "user_id": "user123",
    "file_name": "warranty.pdf",
    "file_size": 524288
  }
}
```

## Testing

### Run Tests

```bash
pytest tests/ -v
```

### Test Coverage

```bash
pytest --cov=app tests/
```

### Manual Testing

Use the interactive API docs at http://localhost:8001/docs

## Deployment

### Docker Production Build

```bash
# Build production image
docker build -t warranty-analyzer:latest .

# Run container
docker run -p 8001:8001 \
  -e ANTHROPIC_API_KEY=your-key \
  -e ENVIRONMENT=production \
  warranty-analyzer:latest
```

### Environment Variables

Required:
- `ANTHROPIC_API_KEY`: Anthropic API key

Optional:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `ENVIRONMENT`: development/staging/production
- `LOG_LEVEL`: DEBUG/INFO/WARNING/ERROR
- `MAX_FILE_SIZE`: Maximum upload size in bytes

## Security Considerations

1. **File Validation**: Only PDF and image files accepted
2. **Size Limits**: 10MB maximum file size
3. **Non-root User**: Docker runs as non-root user
4. **API Key Security**: Never commit `.env` files
5. **Input Sanitization**: All inputs validated with Pydantic

## Troubleshooting

### Issue: "Anthropic API error"
- Check API key is valid
- Verify API key has sufficient credits
- Check rate limits

### Issue: "OCR confidence is low"
- Ensure image is high quality (300+ DPI)
- Try re-scanning document with better lighting
- Convert scanned PDF to individual images

### Issue: "Service unavailable"
- Check Docker containers are running: `docker-compose ps`
- View logs: `docker-compose logs -f warranty-analyzer`
- Verify network connectivity

## Contributing

1. Follow PEP 8 style guide
2. Use type hints throughout
3. Write docstrings for all functions
4. Add tests for new features
5. Update documentation

## License

MIT License - See LICENSE file for details

## Support

For issues or questions:
- GitHub Issues: [Create an issue]
- Email: support@snapregister.com
- Docs: [Full documentation]

## Roadmap

- [ ] Support for multi-page warranty documents
- [ ] Batch processing API
- [ ] Webhook notifications
- [ ] Support for more document formats (DOCX, images)
- [ ] Multi-language support
- [ ] Warranty comparison feature
- [ ] Integration with manufacturer databases
