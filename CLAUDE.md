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

**Stack**: Next.js 15 (App Router) · TypeScript · Tailwind CSS · Radix UI (shadcn/ui) · Supabase (PostgreSQL + Auth) · TanStack React Query · React Hook Form + Zod · Framer Motion

## Project Structure

```
src/
├── app/
│   ├── api/               # Next.js API routes (REST endpoints)
│   ├── admin/             # Admin dashboard pages (UI in progress)
│   └── [feature]/         # Customer-facing pages (carrinho, checkout, meus-pedidos, etc.)
├── components/
│   ├── ui/                # shadcn/ui components — do not modify directly
│   ├── home/              # Home page sections
│   └── admin/             # Admin-specific components
├── contexts/              # AuthContext, CartContext (React Context API)
├── hooks/                 # Custom hooks
├── lib/
│   ├── supabaseClient.ts  # Browser Supabase client
│   ├── supabaseServer.ts  # Server-side Supabase client (for API routes)
│   ├── abacatePay.ts      # AbacatePay payment gateway integration
│   └── supabase/          # Service layer: products, orders, categories, profiles, contactMessages
├── types/
│   └── supabase.ts        # Domain model types (Product, Order, Profile, etc.) + statusLabels
└── middleware.ts           # Supabase SSR session refresh on every request
```

Path alias: `@/*` maps to `./src/*`.

## Key Patterns

**Auth**: Supabase Auth (email/password + Google OAuth). `middleware.ts` refreshes sessions on every request. Client-side state lives in `AuthContext` — `user` is typed as `Profile` (not raw Supabase user). API routes call `getCurrentProfile()` from `lib/supabase/auth.ts` to get the authenticated user server-side.

**State management**: `AuthContext` and `CartContext` for local UI state; TanStack React Query for all server data (products, orders, etc.).

**API layer**: RESTful routes under `src/app/api/`. Database queries are encapsulated in `src/lib/supabase/` service files — API routes call those, not Supabase directly. Service files always use `supabaseServer.ts`.

**Product customization**: Users customize labels (text, font, color) before adding to cart. Customization data is stored alongside `CartItem` in `CartContext`.

**Coupon system**: Hardcoded in `CartContext` — `"ADESIL10"` (10% off) and `"FRETE"` (free shipping).

**Forms**: React Hook Form + Zod. All form schemas use Zod; validation errors are surfaced via `react-hook-form`.

**Notifications**: Sonner for toasts (`import { toast } from "sonner"`).

**Animations**: Framer Motion is used throughout for page/list entry animations.

## Order & Payment Flow

1. User fills checkout form → `POST /api/checkout`
2. Checkout route: saves address to `profiles`, creates `Order` (status=`pending`), then calls AbacatePay to create a hosted checkout (PIX + card)
3. AbacatePay flow: `createProduct()` per item → `createAbacatePayCheckout()` → returns `checkout_url` to redirect user
4. User is redirected back to `/meus-pedidos/[id]?payment=success` (or `?payment=pending`)
5. AbacatePay sends webhook to `POST /api/payments/abacatepay/webhook` → updates order status (`checkout.completed` → `processing`)
6. If payment failed, user can retry from `/meus-pedidos/[id]` → `POST /api/orders/[id]/retry-payment`

Webhook validation: HMAC-SHA256 against `ABACATEPAY_WEBHOOK_SECRET` (tries base64 then hex). If secret is not set, all webhooks are accepted (dev mode).

## Database (Supabase)

Main tables: `products`, `categories`, `product_business_categories` (many-to-many), `orders`, `profiles` (extends `auth.users` with address/company/document), `contact_messages`, `clients`.

Key DB behaviors:
- `handle_new_user` trigger auto-creates a `profiles` row on `auth.users` INSERT
- `is_admin()` SQL function used in RLS policies — checks `profiles.role = 'admin'`
- Orders RLS allows users to read/write only their own orders; admins bypass via `is_admin()`
- `profiles.updated_at` auto-updates via trigger

Use `supabaseServer.ts` (server context) or `supabaseClient.ts` (browser) — never mix them in the wrong context. API routes always use the server client which has elevated privileges and bypasses RLS correctly.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ABACATEPAY_API_KEY=
ABACATEPAY_WEBHOOK_SECRET=   # optional; if unset, webhooks skip signature check
NEXT_PUBLIC_APP_URL=         # used for AbacatePay return/completion URLs
```

## External Services

- **ViaCEP** (`lib/viaCep.ts`): Brazilian zipcode → address lookup.
- **AbacatePay** (`lib/abacatePay.ts`): Payment processor (PIX + card). API base: `https://api.abacatepay.com/v2`. Checkout flow: register each product (`/products/create`), then create checkout (`/checkouts/create`). Prices are sent in centavos (multiply BRL by 100).

## TypeScript Config Notes

`strict` and `strictNullChecks` are disabled. Image optimization is disabled in `next.config.js` (`unoptimized: true`). ESLint has `@typescript-eslint/no-unused-vars` disabled.
