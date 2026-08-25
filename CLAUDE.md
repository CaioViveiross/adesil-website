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
│   ├── mercadoPago.ts     # Mercado Pago payment gateway integration
│   ├── bling.ts           # Bling ERP integration — OAuth + automatic NF-e emission
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
2. Checkout route: saves address to `profiles`, creates `Order` (status=`pending`), then calls Mercado Pago to create a Checkout Pro preference (PIX + card + boleto)
3. Mercado Pago flow: `createMercadoPagoCheckout()` builds a `/checkout/preferences` request with items priced server-side (coupon discount applied proportionally across items — Mercado Pago has no separate "discount" field) → returns `checkout_url` (`init_point`) to redirect user
4. User is redirected back to `/meus-pedidos/[id]?payment=success` (or `?payment=pending`/`?payment=failure`)
5. Mercado Pago sends a lightweight webhook (`{ type: "payment", data: { id } }`) to `POST /api/payments/mercadopago/webhook` → the route fetches the full payment via `GET /v2/payments/{id}` and updates order status (`approved` → `processing`, `refunded` → `refunded`, `rejected`/`charged_back` → `failed`, `cancelled` → `cancelled`)
6. If payment failed, user can retry from `/meus-pedidos/[id]` → `POST /api/orders/[id]/retry-payment` (re-derives the original discount from `order.total` so the retry charges the same amount)
7. When the webhook maps the payment to `processing` (approved), it also calls `emitNfeForOrder()` (`lib/bling.ts`) to emit a NF-e in Bling — non-fatal: failure is logged and saved to `orders.bling_nfe_error`, never blocks the webhook response. Admins can emit/reemit manually from `/admin/pedidos/[id]` (`POST /api/orders/[id]/emit-nfe`) or refresh the SEFAZ status (`GET` same route).

Webhook validation: HMAC-SHA256 (hex) against `MERCADOPAGO_WEBHOOK_SECRET`, over the manifest `id:{data.id};request-id:{x-request-id};ts:{ts};` (per Mercado Pago's `x-signature`/`x-request-id` headers). If secret is not set, all webhooks are accepted (dev mode).

## Bling Integration (NF-e)

`lib/bling.ts` emits NF-e (modelo 55) directly via `POST /nfe` — items are embedded inline in the request (`codigo`, `descricao`, `classificacaoFiscal` = NCM, `quantidade`, `valor`); **products are not registered/synced in Bling**. After creation, the note is transmitted with `POST /nfe/{id}/enviar`; status/DANFE link come from `GET /nfe/{id}`.

Auth is OAuth 2.0 (`authorization_code` + `refresh_token`, the only grant Bling supports). `BLING_CLIENT_ID`/`BLING_CLIENT_SECRET` come from `.env` (never the DB); the resulting `access_token`/`refresh_token`/expiry are persisted in the `settings` table under `bling_access_token`/`bling_refresh_token`/`bling_token_expires_at` — these keys are deliberately excluded from `ALLOWED_KEYS` in `/api/admin/settings`, so they're never exposed to the admin UI. Admin connects via `/api/admin/bling/connect` → Bling consent screen → `/api/admin/bling/callback` (state validated against an httpOnly cookie).

Required setup in Bling's dev panel (`developer.bling.com.br/aplicativos`): register an app with the NF-e scope, and set its Redirect URI to exactly `${NEXT_PUBLIC_APP_URL}/api/admin/bling/callback` (Bling always uses the value registered on the app, ignoring anything sent in the authorize request). Required admin config (`/admin/configuracoes`): Natureza de Operação, Forma de Pagamento, and a default NCM (`bling_ncm_padrao`) — each product can override the NCM via `products.ncm`.

## Database (Supabase)

Main tables: `products`, `categories`, `product_categories` (many-to-many product↔category), `orders`, `order_items`, `profiles` (extends `auth.users` with address/company/document), `contact_messages`, `coupons`, `payment_attempts`, `settings`.

Key DB behaviors:
- `handle_new_user` trigger auto-creates a `profiles` row on `auth.users` INSERT
- `is_admin()` SQL function used in RLS policies — checks `profiles.role = 'admin'`
- Orders RLS allows users to read/write only their own orders; admins bypass via `is_admin()`
- `profiles.updated_at` auto-updates via trigger
- `product_categories` holds a product's categories. `products.category_id` is a denormalized copy of the *first* one, used solely for the "Voltar ao catálogo" link on the product page — the product URL is `/produto/[id]` and does **not** include the category. The admin writes both; the ordering is not surfaced in the UI.

Use `supabaseServer.ts` (server context) or `supabaseClient.ts` (browser) — never mix them in the wrong context. API routes always use the server client which has elevated privileges and bypasses RLS correctly.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # Project Settings → API → service_role. Server-only — bypasses RLS; used by lib/supabaseAdmin.ts (webhooks, admin routes, lib/bling.ts)
MERCADOPAGO_ACCESS_TOKEN=    # Access Token from the Mercado Pago Developers panel (test or production)
MERCADOPAGO_WEBHOOK_SECRET=  # optional; if unset, webhooks skip signature check
BLING_CLIENT_ID=             # OAuth client id from a Bling app (developer.bling.com.br/aplicativos)
BLING_CLIENT_SECRET=         # OAuth client secret — never stored in the DB
NEXT_PUBLIC_APP_URL=         # used for Mercado Pago back_urls/notification_url and the Bling OAuth redirect_uri
```

PIX, card, and boleto must each be individually enabled on the Mercado Pago account — the Checkout Pro preference doesn't exclude any payment type, so availability depends entirely on account configuration.

## External Services

- **ViaCEP** (`lib/viaCep.ts`): Brazilian zipcode → address lookup.
- **Mercado Pago** (`lib/mercadoPago.ts`): Payment processor (PIX + card + boleto), Checkout Pro. API base: `https://api.mercadopago.com`. Checkout flow: create a preference (`/checkout/preferences`) with items priced inline — no separate product-registration step. Prices are sent in BRL (not centavos).
- **Bling** (`lib/bling.ts`): ERP used solely for NF-e emission. OAuth 2.0, API base `https://api.bling.com.br/Api/v3`, OAuth base `https://www.bling.com.br/Api/v3`. See "Bling Integration (NF-e)" above.

## TypeScript Config Notes

`strict` and `strictNullChecks` are disabled. Image optimization is disabled in `next.config.js` (`unoptimized: true`). ESLint has `@typescript-eslint/no-unused-vars` disabled.
