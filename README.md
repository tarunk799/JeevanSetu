# JeevanSetu — Emergency Medical Profile Builder

**Live:** https://jeevansetu-777556442909.asia-south1.run.app

JeevanSetu is a Gemini-powered web app that takes messy, real-world medical inputs — prescription photos, lab reports, medicine photos, or plain text — and converts them into a structured emergency medical profile, shareable instantly via QR code.

## Problem

In India, medical records are fragmented across hospitals, clinics, and labs. In emergencies, critical information (allergies, medications, blood type) is unavailable. People carry stacks of papers, WhatsApp photos of prescriptions, and verbal history in multiple languages. This fragmentation costs lives.

## Solution

Upload anything medical. Gemini AI extracts and structures it. Share via QR code. Emergency responders scan and see what matters — instantly.

## Features

- **Multimodal Analysis** — Upload prescription images, lab reports, medicine photos, or type medical history. Gemini 2.5 Flash extracts medications, allergies, conditions, and lab values with confidence scores.
- **Unified Medical Profile** — All inputs merge into one structured profile with medications, allergies (severity-tagged), conditions, lab results (normal/warning/critical), blood type, and emergency contacts.
- **QR Code Sharing** — Generate a QR code linking to a public emergency view. No login needed to view.
- **Emergency View** — High-contrast dark UI, allergies first, one-tap call buttons for emergency contacts.
- **Hospital Finder** — Geolocation-based nearby hospital search with Google Maps directions.
- **Telugu/Hindi** — Language detection built in. Shown as "Coming Soon" — English fully working.

## Google Cloud Services (6)

| Service | Usage |
|---------|-------|
| Gemini 2.5 Flash | Core AI — multimodal medical document analysis |
| Cloud Firestore | Persistent profile storage with 30s cache |
| Cloud Run | App hosting (asia-south1) |
| Cloud Build | Docker image builds |
| Artifact Registry | Container image storage |
| Google Maps Places | Hospital finder with directions |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| AI | Gemini 2.5 Flash via `@google/generative-ai` |
| Database | Cloud Firestore via `@google-cloud/firestore` |
| Validation | Zod v4 |
| QR Code | qrcode.react |
| Testing | Vitest (38 tests) |
| Deploy | Docker, Cloud Build, Cloud Run |

## Security

- Zod validation on all API inputs
- Rate limiting (10 req/min per IP on analysis)
- Input sanitization (HTML stripping, prompt injection prevention)
- Security headers: CSP, HSTS, X-Frame-Options, X-XSS-Protection, Permissions-Policy
- PII redaction in logs
- Firestore security rules (owner-only access, UUID share tokens)
- Secrets in environment variables, never committed

## Accessibility (WCAG 2.1 AA)

- Skip-to-content link
- Semantic HTML with proper heading hierarchy
- ARIA: `aria-live` regions, `aria-invalid`, `aria-labelledby`, `role="alert"`
- Keyboard navigation with visible focus indicators
- `prefers-reduced-motion` support
- 44px minimum touch targets
- Table captions and column scope headers
- High-contrast emergency view

## Testing

38 unit tests covering:
- **store** — Firestore CRUD, shareToken lookup, cache, fallback
- **validation** — Zod schemas for analyze and profile requests
- **sanitize** — XSS, prompt injection, image format, PII redaction
- **rate-limit** — Per-IP throttling, independent tracking

```bash
npm test          # run all tests
npm run test:watch   # watch mode
npm run test:coverage # with coverage
```

## Setup

### Prerequisites

- Node.js 20+
- Google Cloud account with billing enabled

### Local Development

```bash
git clone <repo-url>
cd JeevanSetu
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your Gemini API key from https://aistudio.google.com/apikey

npm run dev
# Open http://localhost:3000
```

### Deploy to Cloud Run

```bash
# Set project
gcloud config set project YOUR_PROJECT_ID

# Enable APIs
gcloud services enable \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  run.googleapis.com \
  firestore.googleapis.com

# Create Artifact Registry repo
gcloud artifacts repositories create jeevansetu \
  --repository-format=docker --location=asia-south1

# Create Firestore database
gcloud firestore databases create --location=asia-south1

# Build and deploy
gcloud builds submit \
  --tag asia-south1-docker.pkg.dev/YOUR_PROJECT_ID/jeevansetu/app:latest

gcloud run deploy jeevansetu \
  --image asia-south1-docker.pkg.dev/YOUR_PROJECT_ID/jeevansetu/app:latest \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars "GEMINI_API_KEY=your_key,GCP_PROJECT_ID=YOUR_PROJECT_ID" \
  --memory 512Mi --cpu 1
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── layout.tsx                  # Root layout with nav, skip link
│   ├── upload/page.tsx             # Upload & analyze medical records
│   ├── dashboard/page.tsx          # Profile list
│   ├── profile/[id]/page.tsx       # Full profile view + QR sharing
│   ├── emergency/[id]/page.tsx     # Public emergency view (no auth)
│   └── api/
│       ├── analyze/route.ts        # POST: Gemini analysis
│       ├── profile/route.ts        # GET/POST: profiles
│       ├── profile/[id]/route.ts   # GET/PUT/DELETE: single profile
│       └── hospitals/route.ts      # GET: nearby hospitals
├── components/
│   └── HospitalFinder.tsx          # Geolocation hospital finder
├── hooks/
│   └── useAuth.ts                  # Firebase Auth hook
└── lib/
    ├── gemini.ts                   # Gemini client + prompt templates
    ├── store.ts                    # Firestore with cache + fallback
    ├── validation.ts               # Zod schemas
    ├── sanitize.ts                 # Input sanitization + PII redaction
    ├── rate-limit.ts               # In-memory rate limiter
    ├── logger.ts                   # Structured JSON logger
    ├── firebase.ts                 # Firebase client config
    └── types.ts                    # TypeScript interfaces
tests/
└── unit/
    ├── store.test.ts               # 10 tests
    ├── validation.test.ts          # 14 tests
    ├── sanitize.test.ts            # 9 tests
    └── rate-limit.test.ts          # 5 tests
```

## Cost

Runs entirely within Google Cloud free tiers for hackathon usage:

| Service | Free Tier | Hackathon Usage | Cost |
|---------|-----------|-----------------|------|
| Gemini 2.5 Flash | 500 req/day | ~200-300 total | $0 |
| Firestore | 50K reads/day | ~1K total | $0 |
| Cloud Run | 2M req/month | ~1K total | $0 |
| Cloud Build | 120 min/day | ~15 min total | $0 |
| Artifact Registry | 500MB | ~200MB | $0 |

## License

See [LICENSE](LICENSE) for details.
