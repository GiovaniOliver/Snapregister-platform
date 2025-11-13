# Next Development Phase: AI Integration & Product Flow Completion

## Current Status

### ✅ Completed (Phase 1 - Foundation)
- [x] Mobile app structure with Expo + TypeScript
- [x] Authentication system (login/signup/logout)
- [x] API client with token management
- [x] Camera integration and permissions
- [x] Basic screens (Home, Scan, Products, Profile)
- [x] Backend API endpoints ready:
  - `/api/ai/analyze-product` - Multi-image analysis (OpenAI GPT-4o Vision)
  - `/api/analyze-product-image` - Single image analysis
  - `/api/registration/submit` - Save product to database
- [x] Mobile services implemented:
  - `aiService.ts` - AI analysis functions
  - `imageService.ts` - Image compression & upload
  - `authService.ts` - Authentication
  - `productService.ts` - Product CRUD

### 🔄 Next Phase: AI Integration & Complete Product Flow

This is the **final piece of Phase 1** - connecting everything together for the core user flow:
**Camera → AI Analysis → Product Creation → Database**

---

## Implementation Plan

### Task 1: Test & Verify Backend Configuration ⚙️

**Objective**: Ensure backend is ready to accept mobile requests

**Steps**:
1. **Start backend with AI configuration**:
   ```bash
   cd website
   # Add OpenAI API key to .env
   echo "OPENAI_API_KEY=your_key_here" >> .env
   npm run dev:mobile  # Port 3004
   ```

2. **Test AI endpoint from command line**:
   ```bash
   # Test multi-image analysis endpoint
   curl -X POST http://localhost:3004/api/ai/analyze-product \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -F "serialNumberImage=@test-serial.jpg" \
     -F "productImage=@test-product.jpg"
   ```

3. **Verify Prisma is generated**:
   ```bash
   cd website
   npx prisma generate
   ```

**Success Criteria**:
- Backend returns 200 OK (not 500)
- AI analysis returns structured JSON with product data
- No Prisma client errors

---

### Task 2: Connect Mobile Camera to AI Analysis 📸

**Objective**: Wire up the multi-image capture screen to backend AI

**Files to Modify**:
- `mobile/src/screens/MultiImageCaptureScreen.tsx`
- `mobile/src/services/imageService.ts` (already has `uploadAndAnalyzeImages`)

**Implementation**:

1. **Update `MultiImageCaptureScreen.tsx`** (around line 350):

```typescript
// In the handleAnalyze function
const handleAnalyze = async () => {
  try {
    setUploading(true);
    setProgress(0);
    setError(null);

    // Get captured images
    const images: MultiImageCapture = {
      serialNumberImage: capturedImages.serialNumber,
      warrantyCardImage: capturedImages.warrantyCard,
      receiptImage: capturedImages.receipt,
      productImage: capturedImages.product,
    };

    // Call the image service to analyze
    const result = await imageService.uploadAndAnalyzeImages(
      images,
      (percent) => setProgress(percent)
    );

    // Navigate to product creation with extracted data
    navigation.navigate('CreateProduct', {
      extractedData: result,
      autoFill: true,
    });

  } catch (error) {
    console.error('[MultiImageCapture] Analysis failed:', error);
    setError(error instanceof Error ? error.message : 'Analysis failed');
  } finally {
    setUploading(false);
  }
};
```

2. **Verify `imageService.uploadAndAnalyzeImages`** works:
   - Already implemented in `mobile/src/services/imageService.ts:348`
   - Uses multipart form data
   - Handles progress tracking
   - Has retry logic

**Success Criteria**:
- Tap "Analyze X Images" button
- See progress modal (0-100%)
- Get extracted product data back
- Navigate to product creation screen

---

### Task 3: Create Product Form Screen 📝

**Objective**: Build a form to create/edit products with AI-extracted data

**New File**: `mobile/src/screens/CreateProductScreen.tsx`

**Features**:
- Pre-fill form fields with AI-extracted data
- Allow manual editing
- Validate required fields
- Save to backend via `/api/registration/submit`

**Key Fields**:
```typescript
interface ProductForm {
  productName: string;
  manufacturer: string;
  modelNumber?: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  retailer?: string;
  warrantyDuration?: number; // months
  warrantyType?: string;
  category?: string;
}
```

**Implementation Outline**:

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, ScrollView, StyleSheet } from 'react-native';
import { productService } from '../services/productService';

export default function CreateProductScreen({ route, navigation }) {
  const { extractedData } = route.params || {};

  const [form, setForm] = useState({
    productName: extractedData?.brand || '',
    manufacturer: extractedData?.brand || '',
    modelNumber: extractedData?.model || '',
    serialNumber: extractedData?.serialNumber || '',
    purchaseDate: extractedData?.purchaseDate || '',
    purchasePrice: extractedData?.price || '',
    retailer: extractedData?.retailer || '',
    warrantyDuration: extractedData?.warrantyPeriod || '',
  });

  const handleSave = async () => {
    try {
      // Call backend API
      const response = await fetch('http://YOUR_IP:3004/api/registration/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          productInfo: {
            productName: form.productName,
            manufacturerName: form.manufacturer,
            modelNumber: form.modelNumber,
            serialNumber: form.serialNumber,
            purchaseDate: form.purchaseDate,
            purchasePrice: parseFloat(form.purchasePrice),
            retailer: form.retailer,
            warrantyDuration: parseInt(form.warrantyDuration),
          },
          userInfo: {
            // User info from session
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Navigate to product list or details
        navigation.navigate('Products');
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save product');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Create Product</Text>

      <Text>Product Name *</Text>
      <TextInput
        value={form.productName}
        onChangeText={(text) => setForm({...form, productName: text})}
        style={styles.input}
      />

      {/* Add more fields... */}

      <Button title="Save Product" onPress={handleSave} />
    </ScrollView>
  );
}
```

**Success Criteria**:
- Form shows pre-filled data from AI
- Can edit any field
- Save button calls `/api/registration/submit`
- Product saved to database
- Navigate back to product list

---

### Task 4: Update Product List Screen with Real Data 📋

**Objective**: Display saved products from backend

**File to Modify**: `mobile/src/screens/ProductsScreen.tsx`

**Implementation**:

```typescript
import { productService } from '../services/productService';

export default function ProductsScreen() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.getProducts();
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <FlatList
      data={products}
      renderItem={({ item }) => (
        <ProductCard product={item} onPress={() => navigateToDetails(item.id)} />
      )}
      onRefresh={loadProducts}
      refreshing={loading}
    />
  );
}
```

**Success Criteria**:
- Products load from `/api/products`
- Shows product name, manufacturer, image
- Pull to refresh works
- Tap card navigates to details

---

### Task 5: Error Handling & Edge Cases 🛡️

**Objective**: Handle failures gracefully

**Scenarios to Handle**:

1. **AI Analysis Fails**:
   - Show retry button
   - Allow manual data entry
   - Clear error message

2. **Network Timeout**:
   - Show "Network error" message
   - Retry with exponential backoff
   - Save draft locally

3. **Invalid/Blurry Images**:
   - Show AI confidence score
   - Suggest retaking photo
   - Allow proceeding with low confidence

4. **Backend Returns 500**:
   - Show "Server error" message
   - Don't lose user's images
   - Offer retry or manual entry

5. **No OpenAI API Key**:
   - Detect 503 from backend
   - Show "AI service unavailable"
   - Fallback to manual entry

**Implementation**:

```typescript
// In MultiImageCaptureScreen
try {
  const result = await imageService.uploadAndAnalyzeImages(images, onProgress);

  // Check confidence
  if (result.confidence === 'low') {
    Alert.alert(
      'Low Confidence',
      'The AI had trouble reading your images. Would you like to retake them or proceed with manual editing?',
      [
        { text: 'Retake', onPress: () => { /* Clear images */ } },
        { text: 'Edit Manually', onPress: () => navigateToForm(result) },
      ]
    );
  } else {
    navigateToForm(result);
  }
} catch (error) {
  if (error.message.includes('timeout')) {
    setError('Network timeout. Please check your connection and try again.');
  } else if (error.message.includes('AI service')) {
    setError('AI service is temporarily unavailable. You can enter product details manually.');
  } else {
    setError('Analysis failed. Please try again or enter details manually.');
  }

  // Show manual entry button
  setShowManualEntry(true);
}
```

---

## Testing Checklist

### Unit Tests
- [ ] `aiService.analyzeMultipleImages()` with mock data
- [ ] `imageService.compressImage()` reduces file size
- [ ] `productService.createProduct()` sends correct payload
- [ ] Form validation catches empty required fields

### Integration Tests (Manual)
- [ ] **Happy Path**: Camera → Analyze → Auto-fill → Save → See in list
- [ ] **Low Confidence**: AI returns low confidence, show warning
- [ ] **Network Error**: Disconnect WiFi, see error message
- [ ] **Server Error**: Backend returns 500, show retry option
- [ ] **No Images**: Try to analyze with 0 images, show error
- [ ] **Edit After AI**: Change AI data, save, verify changes persist
- [ ] **Multiple Products**: Create 3 products, all show in list

### Device Testing
- [ ] Test on iOS Simulator
- [ ] Test on Android Emulator
- [ ] Test on physical iPhone
- [ ] Test on physical Android
- [ ] Test with different image qualities (bright, dark, blurry)

---

## API Endpoints Reference

### Mobile → Backend

| Endpoint | Method | Purpose | Request | Response |
|----------|--------|---------|---------|----------|
| `/api/ai/analyze-product` | POST | Analyze 4 images | `multipart/form-data` with `serialNumberImage`, `warrantyCardImage`, `receiptImage`, `productImage` | `{ success, data: { brand, model, serialNumber, ...} }` |
| `/api/registration/submit` | POST | Save product | `{ productInfo: {...}, userInfo: {...} }` | `{ success, productId, registrationId }` |
| `/api/products` | GET | List products | - | `{ products: [...] }` |
| `/api/products/:id` | GET | Get product details | - | `{ product: {...} }` |

---

## Environment Setup Requirements

### Backend (website)
```bash
# .env file
OPENAI_API_KEY=sk-proj-...
DATABASE_URL=file:./prisma/dev.db
```

### Mobile (mobile)
```bash
# .env file
EXPO_PUBLIC_API_URL=http://192.168.1.15:3004
```

### Required Services Running
1. **Next.js backend**: `cd website && npm run dev:mobile`
2. **Expo dev server**: `cd mobile && npm start`
3. **OpenAI API** key configured in backend
4. **Prisma client** generated: `npx prisma generate`

---

## Success Metrics

### Phase 1 Completion Criteria
- [ ] User can capture 1-4 product images
- [ ] Images are analyzed by AI within 15 seconds
- [ ] Product form is pre-filled with 70%+ accuracy
- [ ] User can save product to database
- [ ] Product appears in product list immediately
- [ ] Error messages are clear and actionable
- [ ] Works on both iOS and Android

### Performance Targets
- AI analysis: < 15 seconds for 4 images
- Image compression: < 2 seconds per image
- Product save: < 3 seconds
- Product list load: < 2 seconds

---

## Next Steps After Completion

Once this phase is done, you'll have a **fully functional MVP** where users can:
1. Sign up / Log in
2. Take photos of products
3. Get AI-extracted product details
4. Save products to their account
5. View their product list

### Phase 2 Priorities (After MVP)
1. **Push Notifications** - Warranty expiration alerts
2. **Offline Mode** - Cache products locally, sync when online
3. **Document Scanning** - Enhanced warranty card capture
4. **Barcode Scanner** - Quick product lookup by UPC
5. **Receipt OCR** - Extract purchase details from receipts

---

## Questions?

**Stuck on anything?**
1. Check `MOBILE_LOGIN_FIX.md` for backend setup
2. Check `IMAGE_UPLOAD_GUIDE.md` for upload troubleshooting
3. Review API endpoint docs in `API_SETUP.md`
4. Look at test files in `mobile/src/__tests__/` for examples

**Common Issues**:
- **Timeout errors**: Backend not running → see `MOBILE_LOGIN_FIX.md`
- **500 errors**: Prisma not generated → run `npx prisma generate`
- **AI not working**: Missing OpenAI key → add to `.env`
- **Images too large**: Already handled by `imageService.compressImage()`

---

## Estimated Timeline

- **Task 1** (Backend setup): 30 minutes
- **Task 2** (Connect camera to AI): 1-2 hours
- **Task 3** (Product form screen): 2-3 hours
- **Task 4** (Product list with real data): 1-2 hours
- **Task 5** (Error handling): 1-2 hours
- **Testing**: 2-3 hours

**Total**: ~8-12 hours for complete Phase 1

---

**Ready to start?** Begin with Task 1 - verify your backend is configured correctly!
