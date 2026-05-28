# LandlordOS — AI-Powered Rental Management

A modern property management platform built for Indian landlords with 2-50 properties. Track rent, manage tenants, auto-generate agreements, and handle maintenance — all powered by AI.

## Features

- **Tenant Management** — Add tenants via invite link, track documents (Aadhaar, PAN), manage move-in/move-out
- **Rent Collection** — Record payments, send automated reminders via email, track payment history
- **Auto Agreements** — AI-generated rental agreements following Indian tenancy laws
- **Maintenance Tracking** — Tenants raise requests, owners track and resolve
- **Utility Bills** — Track electricity, water, gas bills per unit with payment status
- **AI Assistant** — Ask legal queries, draft notices, calculate rent escalation
- **Dark Mode** — Full dark/light theme support
- **Tenant Portal** — Separate portal for tenants to view rent, raise requests, and manage their unit

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Custom JWT + OTP via email
- **Email**: Resend
- **AI**: External AI endpoint for chat/agreement generation
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
git clone https://github.com/roshanreddy118/AI-Rental-Management.git
cd AI-Rental-Management
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
RESEND_API_KEY=your_resend_key
AI_ENDPOINT=your_ai_endpoint
AI_API_KEY=your_ai_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login, Register, OTP verification
│   ├── (dashboard)/     # Owner dashboard pages
│   ├── (tenant)/        # Tenant portal pages
│   ├── api/             # API routes
│   └── page.tsx         # Landing page
├── components/          # Shared UI components
├── lib/                 # Utilities (auth, email, supabase, AI)
└── types/               # TypeScript types
```

## Deployment

Deployed on Vercel. Push to `main` branch triggers auto-deploy.

## License

MIT
