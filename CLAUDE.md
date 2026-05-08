# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run lint      # Run ESLint
npm test          # Run tests
npm run test:watch # Run tests in watch mode
```

## Architecture Overview

E-commerce platform for label/sticker customization, built for a Brazilian market. The core differentiator is an interactive product customization feature (text, color, font) with a real-time preview before adding to cart.

**Stack**: Next.js 15 (App Router) · TypeScript · Tailwind CSS · Radix UI (shadcn/ui) · Supabase (PostgreSQL + Auth) · TanStack React Query · React Hook Form + Zod

## Project Structure

```
src/
├── app/
│   ├── api/               # Next.js API routes (REST endpoints)
│   ├── admin/             # Admin dashboard pages (UI in progress)
│   └── [feature]/         # Customer-facing pages (carrinho, checkout, etc.)
├── components/
│   ├── ui/                # shadcn/ui components — do not modify directly
│   ├── home/              # Home page sections
│   └── admin/             # Admin-specific components
├── contexts/              # AuthContext, CartContext (React Context API)
├── hooks/                 # Custom hooks
├── lib/
│   ├── supabaseClient.ts  # Browser Supabase client
│   ├── supabaseServer.ts  # Server-side Supabase client (for API routes)
│   └── supabase/          # Service layer: products, orders, categories, profiles queries
├── types/
│   └── supabase.ts        # Domain model types (Product, Order, Profile, etc.)
└── middleware.ts           # Supabase SSR session refresh on every request
```

Path alias: `@/*` maps to `./src/*`.

## Key Patterns

**Auth**: Supabase Auth (email/password). `middleware.ts` refreshes sessions on every request. Client-side state lives in `AuthContext`. API routes use the server-side Supabase client from `lib/supabaseServer.ts`.

**State management**: `AuthContext` and `CartContext` for local UI state; TanStack React Query for all server data (products, orders, etc.).

**API layer**: RESTful routes under `src/app/api/`. Database queries are encapsulated in `src/lib/supabase/` service files — API routes call those, not Supabase directly.

**Product customization**: Users customize labels (text, font, color) before adding to cart. Customization data is stored alongside `CartItem` in `CartContext` and sent to the `/api/label-customization` endpoint.

**Coupon system**: Hardcoded in `CartContext` — `"ADESIL10"` (10% off) and `"FRETE"` (free shipping).

**Forms**: React Hook Form + Zod. All form schemas use Zod; validation errors are surfaced via `react-hook-form`.

**Notifications**: Sonner for toasts (`import { toast } from "sonner"`).

## Database (Supabase)

Main tables: `products`, `categories`, `product_business_categories` (many-to-many), `orders`, `profiles` (extends auth with address/company/document), `clients`.

Use `supabaseServer.ts` (server context) or `supabaseClient.ts` (browser) — never mix them in the wrong context.

## External Services

- **ViaCEP** (`lib/viaCep.ts`): Brazilian zipcode → address lookup.
- **AbacatePay**: Payment processor. API key in `.env` as `ABACATEPAY_API_KEY`.

## TypeScript Config Notes

`strict` and `strictNullChecks` are disabled. Image optimization is disabled in `next.config.js` (`unoptimized: true`). ESLint has `@typescript-eslint/no-unused-vars` disabled.
