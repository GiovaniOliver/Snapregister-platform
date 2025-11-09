# SnapRegister.com 📸

> AI-powered product registration that turns 20 minutes of tedious form-filling into 30 seconds of photo-snapping.

## 🎯 What is SnapRegister?

SnapRegister uses AI to automatically register your products and activate warranties by simply taking 4 photos:
1. 📷 Serial number
2. 📄 Warranty card
3. 🧾 Receipt
4. 🎁 Product photo

Our AI extracts all the information and registers your product automatically with the manufacturer - no typing required!

---

## ✨ Features

### MVP (Current Version)
- ✅ AI-powered OCR using Claude 3.5 Sonnet
- ✅ Photo capture with guided overlays
- ✅ Automatic data extraction (serial numbers, warranty info)
- ✅ Manual review with confidence scoring
- ✅ Product dashboard
- ✅ Assisted manual registration (pre-filled PDFs)

### Coming Soon
- 🔄 Automatic registration for top 20 manufacturers
- 📧 Email notifications
- ⏰ Warranty expiration reminders
- 📱 Mobile PWA
- 🤝 API integrations with Samsung, LG, Apple, etc.

---

## 🏗️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Database**: Prisma ORM + SQLite (MVP) → PostgreSQL (production)
- **AI/OCR**: Anthropic Claude 3.5 Sonnet
- **Queue**: BullMQ + Redis
- **Automation**: Playwright
- **Storage**: Cloudflare R2
- **Email**: Resend
- **Auth**: NextAuth.js

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Redis (for job queue)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/snapregister.git
cd snapregister
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.sample .env.local
```

Edit `.env.local` and add your API keys:
- `ANTHROPIC_API_KEY`: Get from https://console.anthropic.com
- `RESEND_API_KEY`: Get from https://resend.com
- `R2_*`: Cloudflare R2 credentials

4. **Set up the database**
```bash
npm run prisma:migrate
```

5. **Seed manufacturers database** (optional)
```bash
npx prisma db seed
```

6. **Start Redis** (in a separate terminal)
```bash
# macOS
brew services start redis

# Windows (WSL)
sudo service redis-server start

# Docker
docker run -d -p 6379:6379 redis:alpine
```

7. **Run the development server**
```bash
npm run dev
```

8. **Start the workers** (in a separate terminal)
```bash
npm run worker:dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app!

---

## 📁 Project Structure

```
snapregister/
├── src/
│   ├── app/                  # Next.js 14 app directory
│   │   ├── (auth)/          # Auth pages (login, signup)
│   │   ├── (dashboard)/     # Protected dashboard routes
│   │   ├── api/             # API routes
│   │   └── layout.tsx       # Root layout
│   ├── components/          # React components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── camera/         # Camera capture components
│   │   ├── products/       # Product-related components
│   │   └── layout/         # Layout components
│   ├── lib/                # Utility libraries
│   │   ├── prisma.ts       # Prisma client
│   │   ├── storage.ts      # R2/S3 operations
│   │   └── auth.ts         # Auth utilities
│   ├── services/           # Business logic services
│   │   ├── ocr.service.ts  # Claude OCR integration
│   │   ├── automation.service.ts
│   │   └── email.service.ts
│   ├── workers/            # Background job workers
│   │   ├── ocr.worker.ts
│   │   └── registration.worker.ts
│   ├── queues/             # Job queue definitions
│   └── emails/             # Email templates
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── migrations/         # Database migrations
├── public/                 # Static assets
└── scripts/                # Utility scripts
    └── manufacturers/      # Automation scripts
```

---

## 🔑 API Keys Required

### Required for MVP:
1. **Anthropic Claude API** (https://console.anthropic.com)
   - Used for: AI-powered OCR and data extraction
   - Cost: ~$3-12 per 1000 images

2. **Cloudflare R2** (https://dash.cloudflare.com)
   - Used for: Image storage
   - Cost: $0.015/GB/month (practically free for MVP)

3. **Resend** (https://resend.com)
   - Used for: Sending emails
   - Free tier: 3,000 emails/month

### Optional:
- **OpenAI API**: Fallback OCR
- **Sentry**: Error tracking
- **Stripe**: Payments (for premium features)

---

## 📊 Database Schema

The database includes:
- **Users**: Authentication and profiles
- **Products**: User-registered products
- **Manufacturers**: Manufacturer database with automation scripts
- **Registrations**: Registration attempts and status
- **Notifications**: In-app notifications
- **EmailLog**: Email delivery tracking
- **Analytics**: OCR metrics and system health

See `prisma/schema.prisma` for full schema.

---

## 🧪 Development Workflow

### Running Tests
```bash
npm run test
```

### Linting
```bash
npm run lint
```

### Database Management
```bash
# Create a new migration
npm run prisma:migrate

# Open Prisma Studio (DB GUI)
npm run prisma:studio

# Reset database
npx prisma migrate reset
```

### Building for Production
```bash
npm run build
npm start
```

---

## 🔒 Security

- Serial numbers are encrypted at rest
- Images are stored in private S3 buckets with signed URLs
- Rate limiting on all API endpoints
- GDPR-compliant with data export and deletion

---

## 🚢 Deployment

### Vercel (Recommended for MVP)
```bash
npm install -g vercel
vercel
```

### Environment Variables on Vercel:
Add all variables from `.env.sample` to your Vercel project settings.

### Workers:
Deploy workers separately to:
- Fly.io (recommended)
- AWS Lambda
- Railway

---

## 📈 Roadmap

### Phase 1: MVP (Weeks 1-4) ✅
- ✅ Basic auth and user management
- ✅ Photo upload and OCR
- ✅ Manual registration flow
- ✅ Product dashboard

### Phase 2: Automation (Weeks 5-8) 🔄
- 🔄 Top 10 manufacturer automation
- 🔄 Email notifications
- 🔄 Status tracking
- 🔄 Admin dashboard

### Phase 3: Scale (Weeks 9-12)
- ⏳ 20+ manufacturer automation
- ⏳ Mobile PWA
- ⏳ API integrations
- ⏳ Warranty reminders

### Phase 4: Growth (Months 4-12)
- ⏳ 100+ manufacturers
- ⏳ B2B white-label
- ⏳ Premium features
- ⏳ Mobile apps

---

## 🤝 Contributing

This is currently a private project. If you're interested in contributing, please contact the team.

---

## 📜 License

Copyright © 2024 SnapRegister. All rights reserved.

---

## 💬 Support

- **Documentation**: See `/docs` folder
- **Issues**: Create a GitHub issue
- **Email**: support@snapregister.com

---

## 🙏 Acknowledgments

- Anthropic for Claude 3.5 Sonnet
- Vercel for Next.js and hosting
- shadcn for beautiful UI components

---

**Built with ❤️ to make warranty registration suck less.**
