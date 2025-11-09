# Device Capture System - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Browser                            │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Registration Wizard (React)                  │  │
│  │                                                           │  │
│  │  Step 1: Photo Capture                                   │  │
│  │  Step 2: AI Review                                       │  │
│  │  Step 3: User Info Form  ←─────┐                        │  │
│  │  Step 4: Device Capture  ←─────┼─────┐                  │  │
│  │  Step 5: Submission             │     │                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                     │     │                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Device Detector (Client-Side)                    │  │
│  │  - Browser Detection                                     │  │
│  │  - OS Detection                                          │  │
│  │  - Screen Info            │     │                        │  │
│  │  - Capabilities           │     │                        │  │
│  │  - Fingerprinting         │     │                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                               │     │
                               │     │ HTTPS
                               ▼     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js API Routes                           │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ POST             │  │ POST             │  │ GET          │ │
│  │ /api/device-info │  │ /api/registration│  │ /api/        │ │
│  │                  │  │ /submit          │  │ registration/│ │
│  │ - Validate       │  │ - Create Product │  │ export       │ │
│  │ - Store Device   │  │ - Create Device  │  │              │ │
│  │ - Return ID      │  │ - Create Reg     │  │ - Export     │ │
│  └────────┬─────────┘  └────────┬─────────┘  │ JSON/XML/CSV │ │
│           │                     │             └──────┬───────┘ │
└───────────┼─────────────────────┼────────────────────┼─────────┘
            │                     │                    │
            ▼                     ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Business Logic Services                      │
│                                                                 │
│  ┌──────────────────┐         ┌──────────────────────────────┐ │
│  │ DeviceService    │         │ RegistrationService          │ │
│  │                  │         │                              │ │
│  │ - findOrCreate() │         │ - createRegistration()       │ │
│  │ - getStats()     │         │ - getRegistration()          │ │
│  │ - updateLastSeen │         │ - exportDataPackage()        │ │
│  └────────┬─────────┘         └────────┬─────────────────────┘ │
└───────────┼──────────────────────────────┼──────────────────────┘
            │                              │
            ▼                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Prisma ORM Layer                             │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Prisma Client                               │  │
│  │  - Type-safe queries                                     │  │
│  │  - Migrations                                            │  │
│  │  - Schema validation                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Database (SQLite/PostgreSQL)                 │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ DeviceInfo   │  │ Product      │  │ Registration         │  │
│  │              │  │              │  │                      │  │
│  │ - fingerprint│  │ - deviceId   │  │ - productId          │  │
│  │ - userAgent  │  │ - serialNo   │  │ - deviceId           │  │
│  │ - browser    │  │ - modelNo    │  │ - contactData        │  │
│  │ - os         │  │ ...          │  │ - dataPackage        │  │
│  │ - screen     │  │              │  │ ...                  │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                 │
│  ┌──────────────┐  ┌──────────────────────────────────────┐    │
│  │ User         │  │ WarrantyContract                     │    │
│  │              │  │                                      │    │
│  │ - products   │  │ - userId                             │    │
│  │ - registr.   │  │ - coverageStart/End                  │    │
│  │ ...          │  │ - status                             │    │
│  └──────────────┘  └──────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Registration Flow

```
User Opens Registration Page
        │
        ▼
┌─────────────────────┐
│ Step 1: Photo       │
│ - Serial Number     │
│ - Warranty Card     │
│ - Receipt           │
│ - Product Photo     │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Step 2: AI Review   │
│ - Extract Data      │
│ - User Verification │
│ - Edit if Needed    │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Step 3: User Info   │
│ - Name, Email       │
│ - Phone, Address    │
│ - Validation        │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐     ┌──────────────────────┐
│ Step 4: Device      │────▶│ collectDeviceInfo()  │
│ - Auto-detect       │     │ - Browser            │
│ - Display Info      │     │ - OS                 │
│ - User Approval     │     │ - Screen             │
└──────┬──────────────┘     │ - Capabilities       │
       │                    │ - Fingerprint        │
       │                    └──────────────────────┘
       │                             │
       │                             │
       ▼                             ▼
┌─────────────────────┐     ┌──────────────────────┐
│ Step 5: Submit      │────▶│ POST /api/device-info│
│ - Review Summary    │     └──────────────────────┘
│ - Choose Method     │              │
│ - Export Options    │              ▼
└──────┬──────────────┘     ┌──────────────────────┐
       │                    │ DeviceService        │
       │                    │ .findOrCreate()      │
       │                    └──────────────────────┘
       │                             │
       ▼                             │
┌─────────────────────┐              │
│ POST /api/          │◀─────────────┘
│ registration/submit │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Create Records:     │
│ 1. Product          │
│ 2. Registration     │
│ 3. Link Device      │
│ 4. Generate Package │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Success Response    │
│ - Registration ID   │
│ - Status            │
│ - Export Options    │
└─────────────────────┘
```

## Component Hierarchy

```
RegistrationWizard
│
├── RegistrationProgress
│   ├── Step 1 (Photo)
│   ├── Step 2 (Review)
│   ├── Step 3 (User) ◀── Current
│   ├── Step 4 (Device)
│   └── Step 5 (Submit)
│
├── [Step 1: PhotoCapture]
│   ├── CameraComponent
│   ├── FileUpload
│   └── PreviewGrid
│
├── [Step 2: DataReview]
│   ├── ExtractedDataDisplay
│   ├── EditableFields
│   └── ConfidenceScore
│
├── [Step 3: UserInfoForm]
│   ├── NameFields
│   ├── ContactFields
│   ├── AddressFields
│   └── ValidationErrors
│
├── [Step 4: DeviceCapture]
│   ├── DetectionSpinner
│   ├── DeviceInfoDisplay
│   │   ├── BrowserInfo
│   │   ├── OSInfo
│   │   ├── ScreenInfo
│   │   └── CapabilitiesBadges
│   └── PrivacyNotice
│
└── [Step 5: SubmissionReview]
    ├── SummaryPanel
    │   ├── ProductSummary
    │   ├── UserSummary
    │   └── DeviceSummary
    ├── MethodSelector
    │   ├── AutomaticOption
    │   └── ManualOption
    ├── ExportButtons
    │   ├── DownloadJSON
    │   ├── DownloadXML
    │   └── DownloadCSV
    └── SubmitButton
```

## Service Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Service Layer                           │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              DeviceService                            │ │
│  │                                                       │ │
│  │  Public Methods:                                     │ │
│  │  • findByFingerprint(fingerprint: string)            │ │
│  │  • create(deviceInfo: Partial<DeviceInfo>)           │ │
│  │  • updateLastSeen(id: string)                        │ │
│  │  • findOrCreate(deviceInfo: Partial<DeviceInfo>)     │ │
│  │  • getStatistics()                                   │ │
│  │  • getByType(type: DeviceType)                       │ │
│  │  • getRecentDevices(limit: number)                   │ │
│  │  • deleteOldDevices(daysOld: number)                 │ │
│  │                                                       │ │
│  │  Database: Prisma → DeviceInfo table                 │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │           RegistrationService                         │ │
│  │                                                       │ │
│  │  Public Methods:                                     │ │
│  │  • createRegistration(data)                          │ │
│  │  • getRegistration(id: string)                       │ │
│  │  • getUserRegistrations(userId: string)              │ │
│  │  • updateStatus(id, status, message)                 │ │
│  │  • getStatistics(userId?)                            │ │
│  │  • exportDataPackage(id, format)                     │ │
│  │  • markManuallyCompleted(id, code)                   │ │
│  │  • getPendingRegistrations(limit)                    │ │
│  │                                                       │ │
│  │  Private Methods:                                    │ │
│  │  • encryptContactData(userInfo)                      │ │
│  │  • decryptContactData(encrypted)                     │ │
│  │                                                       │ │
│  │  Database: Prisma → Registration, Product tables     │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Data Package Structure

```
ManufacturerDataPackage
│
├── product
│   ├── productName: string
│   ├── manufacturer: string
│   ├── modelNumber?: string
│   ├── serialNumber?: string
│   ├── sku?: string
│   ├── upc?: string
│   ├── purchaseDate?: string
│   ├── purchasePrice?: number
│   ├── retailer?: string
│   └── category?: string
│
├── user
│   ├── firstName: string
│   ├── lastName: string
│   ├── email: string
│   ├── phone?: string
│   ├── address?: string
│   ├── addressLine2?: string
│   ├── city?: string
│   ├── state?: string
│   ├── zipCode?: string
│   └── country: string
│
├── device
│   ├── type: string (MOBILE|TABLET|DESKTOP)
│   ├── os: string (e.g., "Windows 10")
│   ├── browser: string (e.g., "Chrome 120.0")
│   └── model?: string (e.g., "MacBook Pro")
│
├── registration
│   ├── registrationDate: string (ISO 8601)
│   ├── registrationId: string
│   ├── source: "snapregister"
│   └── version: "1.0.0"
│
└── warranty? (optional)
    ├── warrantyDuration?: number
    ├── warrantyStartDate?: string
    ├── warrantyExpiry?: string
    └── warrantyType?: string
```

## Database Relationships

```
User ──┬── 1:N ──▶ Product
       │
       ├── 1:N ──▶ Registration
       │
       └── 1:N ──▶ WarrantyContract

Product ──┬── N:1 ──▶ User
          │
          ├── N:1 ──▶ Manufacturer
          │
          ├── N:1 ──▶ DeviceInfo
          │
          ├── 1:1 ──▶ WarrantyContract
          │
          └── 1:N ──▶ Registration

Registration ──┬── N:1 ──▶ User
               │
               ├── N:1 ──▶ Product
               │
               ├── N:1 ──▶ Manufacturer
               │
               └── N:1 ──▶ DeviceInfo

DeviceInfo ──┬── 1:N ──▶ Product
             │
             └── 1:N ──▶ Registration

WarrantyContract ──┬── N:1 ──▶ User
                   │
                   └── 1:1 ──▶ Product
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Security Layers                         │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 1. Transport Security                                 │ │
│  │    • HTTPS/TLS encryption                             │ │
│  │    • Secure headers (HSTS, CSP)                       │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 2. Input Validation                                   │ │
│  │    • Zod schema validation                            │ │
│  │    • Type checking (TypeScript)                       │ │
│  │    • SQL injection prevention (Prisma ORM)            │ │
│  │    • XSS protection (React)                           │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 3. Data Encryption                                    │ │
│  │    • Contact data encryption (AES-256)                │ │
│  │    • Serial number encryption                         │ │
│  │    • Secure key storage (env variables)               │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 4. Authentication & Authorization                     │ │
│  │    • User authentication (NextAuth)                   │ │
│  │    • Session management                               │ │
│  │    • Role-based access control                        │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 5. Privacy Protection                                 │ │
│  │    • Non-invasive fingerprinting                      │ │
│  │    • User consent notices                             │ │
│  │    • GDPR/CCPA compliance                             │ │
│  │    • Data retention policies                          │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Performance Optimization

```
┌─────────────────────────────────────────────────────────────┐
│                  Performance Strategy                       │
│                                                             │
│  Frontend:                                                  │
│  • React.memo for expensive components                     │
│  • useMemo/useCallback for computations                    │
│  • Code splitting (dynamic imports)                        │
│  • Image optimization (Next.js Image)                      │
│  • Local state management (avoid prop drilling)            │
│  • Auto-save debouncing                                    │
│                                                             │
│  Backend:                                                   │
│  • Database indexes on fingerprint, userId, etc.           │
│  • Prisma query optimization                               │
│  • Connection pooling                                      │
│  • API response caching                                    │
│  • Lazy loading of relations                               │
│                                                             │
│  Database:                                                  │
│  • Compound indexes for common queries                     │
│  • VACUUM for SQLite maintenance                           │
│  • Query explain/analyze                                   │
│  • Archival of old device records                          │
│                                                             │
│  Monitoring:                                                │
│  • Performance metrics collection                          │
│  • Slow query logging                                      │
│  • Error tracking (Sentry)                                 │
│  • User analytics (PostHog)                                │
└─────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Production Deployment                    │
│                                                             │
│  CDN (CloudFlare/Vercel Edge)                              │
│  ├── Static assets                                         │
│  ├── Images                                                │
│  └── JavaScript bundles                                    │
│                                                             │
│  Application Server (Vercel/Railway)                       │
│  ├── Next.js server                                        │
│  ├── API routes                                            │
│  └── Server-side rendering                                 │
│                                                             │
│  Database (Vercel Postgres/Railway)                        │
│  ├── PostgreSQL primary                                    │
│  ├── Read replicas                                         │
│  └── Automated backups                                     │
│                                                             │
│  File Storage (S3/Vercel Blob)                             │
│  ├── Product photos                                        │
│  ├── Documents                                             │
│  └── Exported data packages                                │
│                                                             │
│  Monitoring & Logging                                      │
│  ├── Application logs (Datadog/Sentry)                     │
│  ├── Error tracking                                        │
│  ├── Performance monitoring                                │
│  └── Analytics (PostHog)                                   │
└─────────────────────────────────────────────────────────────┘
```

This architecture provides a scalable, secure, and maintainable system for device information capture and warranty registration.
