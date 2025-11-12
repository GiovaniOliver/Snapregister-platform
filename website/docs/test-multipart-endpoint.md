# Testing the Updated Analyze-Product-Image Endpoint

## Quick Validation Checklist

The endpoint has been successfully updated with the following features:

### 1. Multipart File Upload Support ✓
- Detects `multipart/form-data` content type
- Extracts file from FormData with field name "file"
- Validates file size (max 10MB)
- Validates file type (JPEG, PNG, WebP, GIF)
- Converts file to base64 data URI

### 2. Backward Compatibility ✓
- Still accepts JSON requests with URL
- Still accepts JSON requests with data URI
- Maintains all SSRF protection for URLs
- Same response format for all request types

### 3. Error Handling ✓
- Detailed error messages for file validation failures
- Proper error handling for FormData parsing
- Graceful handling of file conversion errors
- Maintains existing error handling for JSON requests

## Test Cases

### Test 1: Multipart File Upload (cURL)
```bash
curl -X POST http://localhost:3000/api/analyze-product-image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/product-image.jpg"
```

### Test 2: JSON with Data URI (Existing)
```bash
curl -X POST http://localhost:3000/api/analyze-product-image \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  }'
```

### Test 3: JSON with URL (Existing)
```bash
curl -X POST http://localhost:3000/api/analyze-product-image \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "image": "https://s3.amazonaws.com/example/product.jpg"
  }'
```

### Test 4: Invalid File Type (Should Fail)
```bash
curl -X POST http://localhost:3000/api/analyze-product-image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/document.pdf"
```

Expected Error:
```json
{
  "error": "Invalid file",
  "message": "Invalid file type: application/pdf. Allowed types: image/jpeg, image/jpg, image/png, image/webp, image/gif"
}
```

### Test 5: Oversized File (Should Fail)
```bash
# Create a large test file
dd if=/dev/zero of=large-image.jpg bs=1M count=11

curl -X POST http://localhost:3000/api/analyze-product-image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@large-image.jpg"
```

Expected Error:
```json
{
  "error": "Invalid file",
  "message": "File size exceeds maximum allowed size of 10MB. Current size: 11.00MB"
}
```

## Integration Testing with Mobile App

### React Native Example
```typescript
import * as ImagePicker from 'expo-image-picker';

async function testImageAnalysis() {
  // Pick image
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
  });

  if (result.canceled) return;

  const imageUri = result.assets[0].uri;

  // Create FormData
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'product.jpg',
  } as any);

  // Send request
  try {
    const response = await fetch('https://api.snapregister.com/api/analyze-product-image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      console.log('Product detected:', data.data.productName);
      console.log('Manufacturer:', data.data.manufacturer);
      console.log('Confidence:', data.data.confidenceScore);
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
}
```

## Code Changes Summary

### Files Modified
- `C:\Users\Oliver Productions\Desktop\1.SMG-BUSINESS\Side-Brands\Snapregister\website\src\app\api\analyze-product-image\route.ts`

### New Constants Added
```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
```

### New Helper Functions Added
1. `fileToDataUri(file: File): Promise<string>`
   - Converts File to base64 data URI
   - Uses Buffer for efficient conversion

2. `validateUploadedFile(file: File): { valid: boolean; error?: string }`
   - Validates file size
   - Validates file type
   - Checks for empty files

### Modified POST Handler
- Added content-type detection
- Added multipart/form-data handling branch
- Maintains JSON handling branch (existing)
- Both branches converge to same OpenAI processing logic

## Expected Behavior

### For Multipart Requests
1. Endpoint detects `multipart/form-data` content type
2. Parses FormData to extract file
3. Validates file (size, type, non-empty)
4. Converts file to base64 data URI
5. Proceeds with OpenAI Vision API call
6. Returns same response format as JSON requests

### For JSON Requests (Unchanged)
1. Endpoint parses JSON body
2. Validates image field (URL or data URI)
3. Applies SSRF protection for URLs
4. Proceeds with OpenAI Vision API call
5. Returns response with extracted product data

## Performance Notes

### Memory Usage
- Files are processed in-memory (no disk I/O)
- 10MB limit prevents excessive memory usage
- Base64 conversion is ~33% larger than binary

### Network Overhead
- Multipart uploads are binary-efficient
- Server converts to base64 for OpenAI API
- Consider client-side compression for mobile

## Security Notes

### Maintained Security Features
- Authentication required (session or Bearer token)
- SSRF protection for URL uploads
- File size limits prevent DoS attacks
- File type validation prevents malicious uploads
- No file persistence (processed in-memory only)

### New Security Considerations
- File type validation based on MIME type (client-provided)
- Consider adding magic number validation for extra security
- Rate limiting should be enforced at middleware level
- Monitor server memory usage with file uploads

## Next Steps

1. **Deploy to staging environment**
2. **Test with mobile app**
3. **Monitor logs for errors**
4. **Measure performance impact**
5. **Consider adding metrics/analytics**
6. **Update API documentation**

## Troubleshooting

### Common Issues

**Issue: "Failed to parse multipart form data"**
- Cause: Malformed multipart request
- Solution: Ensure Content-Type has boundary parameter (set automatically by fetch)

**Issue: "No file provided. Expected file field named 'file'"**
- Cause: Wrong field name in FormData
- Solution: Use `formData.append('file', ...)` not 'image' or 'photo'

**Issue: "Invalid file type"**
- Cause: Non-image file or unsupported image format
- Solution: Only send JPEG, PNG, WebP, or GIF images

**Issue: "File size exceeds maximum"**
- Cause: File larger than 10MB
- Solution: Compress image client-side before upload

## Success Criteria

✓ Endpoint accepts multipart file uploads
✓ Endpoint maintains backward compatibility with JSON
✓ File validation works correctly
✓ Base64 conversion works correctly
✓ OpenAI Vision API receives correct image format
✓ Error messages are clear and actionable
✓ Security measures are maintained
✓ No breaking changes to existing functionality
