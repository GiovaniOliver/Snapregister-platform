# SnapRegister Mobile Type Definitions

This directory contains all TypeScript type definitions used throughout the SnapRegister mobile application.

## File Structure

```
src/types/
├── index.ts              # Main export file - imports all types
├── warranty.ts           # Warranty management types
├── warrantyAnalysis.ts   # AI warranty analysis types
├── registration.ts       # Product registration flow types
├── device.ts            # Device information types
└── README.md            # This file
```

## Type Categories

### Core Data Models (`index.ts`)

**Product Interface**
```typescript
interface Product {
  id: string;
  userId: string;
  name: string;
  brand: string;
  model: string;
  serialNumber?: string;
  category: string;
  purchaseDate: Date | string;
  purchasePrice?: number;
  retailer?: string;
  imageUrl?: string;
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}
```

**User Interface**
```typescript
interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  avatar?: string;
  plan?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}
```

**AI Extracted Data**
```typescript
interface AIExtractedData {
  brand?: string;
  model?: string;
  serialNumber?: string;
  productName?: string;
  category?: string;
  warrantyInfo?: {
    duration?: string;
    startDate?: string;
    endDate?: string;
    terms?: string;
  };
  confidence: number;
  rawText?: string;
}
```

### Navigation Types

**Root Stack**
```typescript
type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  ProductDetails: { productId: string };
  WarrantyDetails: { warrantyId: string };
  CameraCapture: undefined;
  EditProduct: { productId?: string };
};
```

**Tab Navigation**
```typescript
type TabParamList = {
  Home: undefined;
  Scan: undefined;
  Products: undefined;
  Profile: undefined;
};
```

**Auth Stack**
```typescript
type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};
```

### API Response Types

**Generic Response**
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

**Paginated Response**
```typescript
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
```

### Warranty Types (`warranty.ts`)

**Warranty Status Enum**
```typescript
enum WarrantyStatus {
  ACTIVE = 'ACTIVE',
  EXPIRING_SOON = 'EXPIRING_SOON',
  EXPIRED = 'EXPIRED',
  CLAIMED = 'CLAIMED',
  VOID = 'VOID',
  LIFETIME = 'LIFETIME',
}
```

**Warranty Contract**
```typescript
interface WarrantyContract {
  id: string;
  userId: string;
  productId?: string;
  documentUrl: string;
  warrantyType: WarrantyType;
  status: WarrantyStatus;
  coverageItems: string[];
  exclusions: string[];
  claimContacts: ClaimContacts;
  // ... more fields
}
```

### AI Analysis Types (`warrantyAnalysis.ts`)

**Analysis Status**
```typescript
enum WarrantyAnalysisStatus {
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  NEEDS_REVIEW = 'NEEDS_REVIEW',
  FAILED = 'FAILED',
  REANALYZING = 'REANALYZING',
}
```

**Warranty Analysis Result**
```typescript
interface WarrantyAnalysis {
  id: string;
  status: WarrantyAnalysisStatus;
  confidence_score?: number;
  ai_summary?: string;
  coverage_items: string[];
  exclusions: string[];
  critical_highlights: WarrantyHighlight[];
  // ... more fields
}
```

### Registration Types (`registration.ts`)

**Registration Steps**
```typescript
enum RegistrationStep {
  PHOTO_CAPTURE = 1,
  DATA_REVIEW = 2,
  USER_INFO = 3,
  DEVICE_CAPTURE = 4,
  SUBMISSION = 5,
}
```

**User Contact Info**
```typescript
interface UserContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country: string;
}
```

### Device Types (`device.ts`)

**Device Type Enum**
```typescript
enum DeviceType {
  MOBILE = 'MOBILE',
  TABLET = 'TABLET',
  DESKTOP = 'DESKTOP',
  SMARTTV = 'SMARTTV',
  WEARABLE = 'WEARABLE',
  EMBEDDED = 'EMBEDDED',
  UNKNOWN = 'UNKNOWN',
}
```

**Device Information**
```typescript
interface DeviceInfo {
  deviceFingerprint: string;
  deviceType: DeviceType;
  osName?: string;
  browserName?: string;
  screenWidth?: number;
  screenHeight?: number;
  // ... more fields
}
```

## Usage Examples

### Importing Types

```typescript
// Import specific types
import { Product, Warranty, User } from '@types';

// Import from specific modules
import { WarrantyStatus, WarrantyContract } from '@types/warranty';
import { WarrantyAnalysis } from '@types/warrantyAnalysis';
import { RegistrationStep } from '@types/registration';

// Import navigation types
import { RootStackParamList } from '@types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
```

### Using Navigation Types

```typescript
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@types';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetails'>;

const ProductDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { productId } = route.params; // Typed as string

  navigation.navigate('WarrantyDetails', {
    warrantyId: '123' // Type-checked
  });
};
```

### Using API Response Types

```typescript
import { ApiResponse, Product } from '@types';

const fetchProduct = async (id: string): Promise<ApiResponse<Product>> => {
  const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
  return response.data;
};

// Usage
const result = await fetchProduct('123');
if (result.success && result.data) {
  const product: Product = result.data;
  console.log(product.name);
}
```

### Using Warranty Types

```typescript
import { WarrantyStatus, WarrantyContract } from '@types/warranty';

const checkWarrantyStatus = (warranty: WarrantyContract): boolean => {
  return warranty.status === WarrantyStatus.ACTIVE ||
         warranty.status === WarrantyStatus.EXPIRING_SOON;
};
```

### Using Registration Types

```typescript
import { RegistrationStep, RegistrationState } from '@types/registration';

const [state, setState] = useState<RegistrationState>({
  currentStep: RegistrationStep.PHOTO_CAPTURE,
  completedSteps: [],
  formData: {},
  isLoading: false,
});
```

## Type Compatibility Notes

### Date Handling

Most date fields accept both `Date` objects and `string` representations:

```typescript
interface Product {
  purchaseDate: Date | string; // Flexible
  createdAt: Date | string;
}

// Both are valid
const product1: Product = {
  purchaseDate: new Date(),
  // ...
};
const product2: Product = {
  purchaseDate: '2025-01-01',
  // ...
};
```

### File Types

File types support both browser `File` objects and React Native file objects:

```typescript
interface PhotoFiles {
  receipt?: File | { uri: string; name: string; type: string };
}

// Browser
const browserFile: File = new File([blob], 'receipt.jpg');

// React Native
const rnFile = {
  uri: 'file:///path/to/image.jpg',
  name: 'receipt.jpg',
  type: 'image/jpeg'
};
```

## Best Practices

### 1. Always Import from Main Index

```typescript
// ✅ Good
import { Product, Warranty } from '@types';

// ❌ Avoid
import { Product } from '../types/index';
```

### 2. Use Specific Types

```typescript
// ✅ Good
const status: WarrantyStatus = WarrantyStatus.ACTIVE;

// ❌ Avoid
const status: string = 'ACTIVE';
```

### 3. Type Function Parameters and Returns

```typescript
// ✅ Good
const getProduct = async (id: string): Promise<Product> => {
  // ...
};

// ❌ Avoid
const getProduct = async (id) => {
  // ...
};
```

### 4. Use Type Guards

```typescript
// Type guard for API responses
const isSuccessResponse = <T>(
  response: ApiResponse<T>
): response is ApiResponse<T> & { data: T } => {
  return response.success && response.data !== undefined;
};

// Usage
const response = await fetchProduct('123');
if (isSuccessResponse(response)) {
  // response.data is guaranteed to exist
  console.log(response.data.name);
}
```

### 5. Use Enums for Constants

```typescript
// ✅ Good
if (warranty.status === WarrantyStatus.EXPIRED) {
  // ...
}

// ❌ Avoid
if (warranty.status === 'EXPIRED') {
  // ...
}
```

## Type Maintenance

### Adding New Types

1. Determine the appropriate file based on domain
2. Add the type definition
3. Export from the module file
4. The main `index.ts` will automatically re-export via `export *`

### Updating Existing Types

1. Update the type definition
2. Check all usages with TypeScript compiler
3. Update backend types if shared

### Backend Sync

These types mirror the backend API. When backend types change:

1. Update the corresponding mobile type file
2. Ensure date/file compatibility
3. Test API integration
4. Update this README if needed

## Additional Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React Navigation TypeScript](https://reactnavigation.org/docs/typescript/)
- [Expo TypeScript](https://docs.expo.dev/guides/typescript/)
