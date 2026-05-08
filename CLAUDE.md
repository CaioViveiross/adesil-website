# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run lint      # ESLint
npm test          # Run Jest tests
npm run test:watch  # Jest in watch mode
```

Run a single test file: `npx jest src/path/to/file.test.ts`

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ABACATEPAY_API_KEY=
NEXT_PUBLIC_APP_URL=           # Used for payment redirect URLs
```

Optional:
```
ABACATEPAY_API_BASE_URL=       # Defaults to https://api.abacatepay.com/v1
```

## Architecture

**Adesil Print** is a Brazilian e-commerce for custom printed labels/adhesives. Stack: Next.js 15 App Router, TypeScript, Tailwind CSS, shadcn/ui, Supabase (auth + PostgreSQL), AbacatePay (PIX payments).

### Supabase clients — two separate files, must not be mixed

- `src/lib/supabaseClient.ts` — browser client (`createBrowserClient`), for Client Components
- `src/lib/supabaseServer.ts` — server client (`createServerClient` + cookies), for Route Handlers and Server Components

All database helper functions live in `src/lib/supabase/` and always use the **server** client. Do not call these helpers from Client Components — call the API routes instead.

### API layer

All data fetching from the browser goes through Next.js Route Handlers in `src/app/api/`:
- `auth/*` — sign in/up/out, profile
- `products`, `products/[id]` — product CRUD
- `orders`, `orders/[id]` — order CRUD
- `categories`, `business-categories` — category reads
- `clients`, `clients/[id]` — customer management
- `checkout` — creates order + AbacatePay PIX billing
- `contact-messages` — public contact form submission
- `admin/contact-messages`, `admin/profiles/[id]` — admin-only endpoints
- `payments/abacatepay/webhook` — payment webhook handler

### Auth flow

`AuthContext` (`src/contexts/AuthContext.tsx`) is the single source of truth for auth state in the browser. It hydrates by calling `/api/auth/profile` on mount and exposes `user` (a `Profile` object with `role: 'admin' | 'customer'`), `signIn`, `signUp`, `signOut`, `refreshProfile`.

Admin-only UI is gated by `user.role === 'admin'` checks in the Header and Admin pages. The middleware (`src/middleware.ts`) currently only refreshes sessions — it does not enforce route protection.

### Cart

`CartContext` (`src/contexts/CartContext.tsx`) holds cart state in memory (not persisted). Cart supports optional `customization` per item `{ text, color, font }`. Coupon codes are hardcoded: `ADESIL10` (10% off), `FRETE` (R$15 off).

### Checkout / Payment

`/api/checkout` route:
1. Verifies auth via `getCurrentProfile()`
2. Updates the user's profile with shipping/billing info
3. Creates an order in Supabase (`pending` status)
4. If `ABACATEPAY_API_KEY` is set, calls AbacatePay to generate a PIX billing; returns `payment_url`, `pix_qr_code`, `pix_copy_paste`
5. If key is missing, returns `pending_configuration: true` — the UI should handle this gracefully

### Data types

All shared types are in `src/types/supabase.ts`. Key types: `Product`, `Order`, `Profile`, `Category`, `BusinessCategory`, `ContactMessage`. `OrderStatus` = `'pending' | 'processing' | 'shipped' | 'delivered'`. `UserRole` = `'admin' | 'customer'`.

### UI components

`src/components/ui/` contains the full shadcn/ui component library — do not edit these files. Custom components go in `src/components/layout/` (Header, Footer, WhatsAppButton), `src/components/home/`, `src/components/admin/`, and `src/components/products/`.

### Admin panel

`AdminLayout` (`src/components/admin/AdminLayout.tsx`) wraps all `/admin/*` pages with a sidebar. Admin pages fetch data directly from API routes via `fetch()` in `useEffect`.

### Path alias

`@/` maps to `src/` — use it for all imports.
