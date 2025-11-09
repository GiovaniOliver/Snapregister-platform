# Products API Endpoint

## Overview
This endpoint provides paginated access to products for authenticated users.

## Endpoint
`GET /api/products`

## Authentication
**Required**: Yes - Session cookie-based authentication

## Request Parameters

### Query Parameters

| Parameter | Type | Required | Default | Constraints | Description |
|-----------|------|----------|---------|-------------|-------------|
| `page` | integer | No | 1 | Min: 1, Max: None | Page number for pagination |
| `limit` | integer | No | 20 | Min: 1, Max: 100 | Number of items per page |

### Example Requests

```bash
# Get first page with 5 items
GET http://192.168.1.15:3004/api/products?page=1&limit=5

# Get first page with 20 items (default)
GET http://192.168.1.15:3004/api/products?page=1&limit=20

# Get second page
GET http://192.168.1.15:3004/api/products?page=2&limit=20
```

## Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "cuid...",
      "productName": "Product Name",
      "manufacturerName": "Manufacturer Name",
      "category": "ELECTRONICS",
      "modelNumber": "MODEL123",
      "sku": "SKU123",
      "upc": "UPC123",
      "purchaseDate": "2024-01-01T00:00:00.000Z",
      "purchasePrice": 99.99,
      "retailer": "Best Buy",
      "warrantyDuration": 12,
      "warrantyStartDate": "2024-01-01T00:00:00.000Z",
      "warrantyExpiry": "2025-01-01T00:00:00.000Z",
      "warrantyType": "Limited",
      "imageUrls": ["https://..."],
      "confidenceScore": 0.95,
      "status": "READY",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "manufacturer": {
        "id": "cuid...",
        "name": "Manufacturer Name",
        "logo": "https://..."
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalCount": 45,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### Error Responses

#### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

#### 400 Bad Request
```json
{
  "error": "Invalid parameter",
  "message": "Page must be a positive integer",
  "field": "page"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Failed to fetch products. Please try again later."
}
```

## Security Features

1. **Authentication Required**: Only authenticated users can access this endpoint
2. **Authorization**: Users can only see their own products (filtered by `userId`)
3. **Input Validation**: All query parameters are validated and sanitized
4. **Rate Limiting**: Should be implemented at middleware level (recommended)
5. **No Sensitive Data Exposure**: Serial numbers (encrypted) are not exposed in the API
6. **Error Handling**: Generic error messages prevent information leakage
7. **Maximum Limit Cap**: Prevents abuse by capping maximum results at 100

## Data Privacy

- **Serial Numbers**: NOT included in response (encrypted sensitive data)
- **User Data**: Only the authenticated user's products are returned
- **Audit Trail**: All requests are logged with user context

## Performance Considerations

- Uses database pagination (skip/take) for efficiency
- Default limit of 20 items balances performance and usability
- Total count query may be cached in production for better performance

## Testing

To test this endpoint, you need to:

1. First authenticate by logging in:
```bash
POST http://192.168.1.15:3004/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

2. The response will set a session cookie that you need to include in subsequent requests

3. Then call the products endpoint:
```bash
GET http://192.168.1.15:3004/api/products?page=1&limit=5
Cookie: session=<your-session-token>
```

## Mobile App Integration

When calling this endpoint from your mobile app, ensure you:

1. Include the session cookie in all requests
2. Handle 401 responses by redirecting to login
3. Implement proper error handling for all error responses
4. Consider implementing local caching for better performance
5. Implement exponential backoff for retries on 500 errors
