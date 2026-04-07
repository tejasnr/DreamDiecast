# DreamDiecast

A premium diecast collectible marketplace built with Next.js 15, Convex, and WorkOS. Features real-time inventory, pre-order workflows, UPI payments, and an admin dashboard.

## Tech Stack

- **Framework:** Next.js 15, React 19, TypeScript
- **Database:** Convex (real-time database + serverless functions + file storage)
- **Auth:** WorkOS (Google OAuth)
- **Styling:** Tailwind CSS 4, Motion (animations), Lucide icons
- **Analytics:** PostHog
- **Shipping:** Shiprocket API

## Features

### Storefront
- Browse by category (JDM, European, Hypercars)
- Product detail modals with specs, reviews, and quick-add to cart
- Category pages: Current Stock, New Arrivals, Pre-Orders, Bundles
- Dynamic shipping rate calculation via Shiprocket

### Pre-Order System
- Customers pay a deposit to reserve upcoming models
- Admin marks products as arrived, triggering balance payment flow
- Status tracking through the customer's Garage

### Checkout & Payments
- UPI payment with QR code display
- Transaction ID + screenshot proof upload
- Admin verification flow with stock auto-deduction on approval

### The Garage (Customer Dashboard)
- **Owned** — Completed purchases
- **Pre-Orders** — Pending arrivals with status tracking
- **Orders** — Full order history with payment and shipping details

### Admin Dashboard
- Product CRUD with image uploads (Convex storage)
- Pre-order management (mark arrived, trigger balance payments)
- Order management and fulfillment queue
- Asset manager for media files
- Role-based access control via admin email allowlist

## Getting Started

### Prerequisites

- Node.js 18+
- A [Convex](https://convex.dev) account
- A [WorkOS](https://workos.com) account
- A [PostHog](https://posthog.com) account (optional)

### Setup

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```

2. Copy the example env file and fill in your keys:
   ```bash
   cp .env.example .env.local
   ```

   Required environment variables:
   ```
   NEXT_PUBLIC_CONVEX_URL=        # Convex deployment URL
   CONVEX_DEPLOY_KEY=             # Convex deploy key

   WORKOS_CLIENT_ID=              # WorkOS client ID
   WORKOS_API_KEY=                # WorkOS API key
   NEXT_PUBLIC_WORKOS_CLIENT_ID=  # Same WorkOS client ID (public)
   NEXT_PUBLIC_WORKOS_REDIRECT_URI=http://localhost:3000/api/auth/callback
   WORKOS_COOKIE_PASSWORD=        # 32+ char random string for session encryption

   NEXT_PUBLIC_POSTHOG_KEY=       # PostHog project key
   NEXT_PUBLIC_POSTHOG_HOST=      # PostHog host URL

   SHIPROCKET_EMAIL=              # Shiprocket account email
   SHIPROCKET_PASSWORD=           # Shiprocket account password
   SHIPROCKET_PICKUP_POSTCODE=    # Origin pincode for shipping calc
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```
   This starts both the Next.js dev server and Convex dev backend concurrently.

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

| Command         | Description                              |
| --------------- | ---------------------------------------- |
| `npm run dev`   | Start Next.js + Convex dev servers       |
| `npm run build` | Production build                         |
| `npm run start` | Start production server                  |
| `npm run lint`  | Run ESLint                               |

## Project Structure

```
app/                  # Next.js app router pages & API routes
  admin/              # Admin dashboard, orders, fulfillment
  checkout/           # Checkout flow (details + payment)
  garage/             # Customer collection dashboard
  api/auth/           # WorkOS OAuth callback, session, logout
  api/shipping/       # Shiprocket rate calculation
components/           # React components (Navbar, Footer, ProductCard, etc.)
context/              # AuthContext, CartContext providers
convex/               # Convex schema, queries, and mutations
hooks/                # Custom hooks (useProducts, useOrders, useGarage, etc.)
lib/                  # Utilities (WorkOS client, PostHog helpers)
specs/                # Technical specification documents
```

## Community

- [Instagram](https://www.instagram.com/dreamdiecastofficial/)
- [WhatsApp Community](https://chat.whatsapp.com/BvgtaCooKYpJpsfDo978Fy?mode=gi_t)
