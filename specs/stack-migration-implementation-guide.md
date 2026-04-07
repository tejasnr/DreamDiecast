# Stack Migration & Inner Circle — Implementation Guide

> **Continuation of**: `specs/stack-migration-and-inner-circle.md`
> **Purpose**: Exact, per-file migration instructions based on auditing the actual codebase. Covers gaps in the original spec.

---

## 0. Audit Summary — What Already Exists

The original spec assumes all Convex files need creation. In reality, **most Convex backend files already exist** and are functional:

| File | Status | Notes |
|------|--------|-------|
| `convex/schema.ts` | EXISTS (154 lines) | Complete, matches spec |
| `convex/products.ts` | EXISTS (95 lines) | CRUD + markArrived, admin-protected |
| `convex/orders.ts` | EXISTS (147 lines) | create, updateStatus, markCompleted, stock decrement |
| `convex/garage.ts` | EXISTS (38 lines) | byUser query, updateStatus mutation |
| `convex/preOrders.ts` | EXISTS (82 lines) | CRUD + markArrived, updates garageItems |
| `convex/users.ts` | EXISTS (59 lines) | upsertFromWorkOS, getByWorkosId, isAdmin |
| `convex/settings.ts` | EXISTS (62 lines) | getWebsite + updateWebsiteSetting with defaults |
| `convex/assets.ts` | EXISTS (58 lines) | create (URL or base64), remove, list |
| `convex/_utils.ts` | EXISTS (50 lines) | Admin email check, requireUser, requireAdmin |
| `convex/_storage.ts` | EXISTS (15 lines) | Base64 data URL decoder |
| `convex/http.ts` | **MISSING** | Needs creation (file uploads, webhooks) |
| `convex/auth.config.ts` | **MISSING** | Needs creation (WorkOS provider config) |
| `convex/_generated/` | EXISTS | Auto-generated API types |

**Key takeaway**: The Convex backend is ~90% built. The migration is primarily a **frontend wiring** task — replacing Firebase imports/calls with Convex hooks in every page and component.

---

## 1. Files to CREATE (New)

### 1.1 `convex/auth.config.ts`

**Purpose**: Configure Convex auth to accept WorkOS JWTs.

```ts
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [],
});
```

> **Note**: Since WorkOS AuthKit uses its own session management (not Convex's built-in auth), this file may be minimal or unnecessary. The actual auth bridge happens through the Next.js API route + Convex `users.upsertFromWorkOS` mutation. See Section 2.

### 1.2 `convex/http.ts`

**Purpose**: HTTP action endpoints for file uploads (payment proofs, product images, asset uploads).

**Architecture**:
- POST `/upload` — accepts multipart file upload, stores via `ctx.storage.store()`, returns storage URL
- Used by: checkout page (payment proof), admin (product images), asset manager

**Required exports**:
```ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

http.route({
  path: "/upload",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const blob = await request.blob();
    const storageId = await ctx.storage.store(blob);
    const url = await ctx.storage.getUrl(storageId);
    return new Response(JSON.stringify({ storageId, url }), {
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
```

### 1.3 `lib/workos.ts`

**Purpose**: WorkOS client initialization (server-side).

```ts
import { WorkOS } from "@workos-inc/node";

export const workos = new WorkOS(process.env.WORKOS_API_KEY!);
export const clientId = process.env.WORKOS_CLIENT_ID!;
```

### 1.4 `app/api/auth/callback/route.ts`

**Purpose**: Handle WorkOS OAuth callback after user authenticates.

**Flow**:
1. Receive `code` query param from WorkOS redirect
2. Exchange code for WorkOS user profile via `workos.userManagement.authenticateWithCode()`
3. Call Convex `users.upsertFromWorkOS` mutation to create/update user record
4. Set HTTP-only session cookie with WorkOS session token
5. Redirect to homepage

**Key data mapping** (WorkOS → Convex users table):
| WorkOS field | Convex field |
|---|---|
| `user.id` | `workosUserId` |
| `user.email` | `email` |
| `user.firstName + lastName` | `name` |
| `user.profilePictureUrl` | `avatarUrl` |
| (determined by `_utils.isAdminEmail`) | `role` |

### 1.5 `app/api/auth/logout/route.ts`

**Purpose**: Clear session cookie, redirect to homepage.

### 1.6 `components/PostHogProvider.tsx`

**Purpose**: Client-side PostHog initialization + Next.js page view tracking.

```tsx
'use client';
import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      capture_pageview: false, // manual capture below
    });
  }, []);

  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname) {
      posthog.capture('$pageview', { path: pathname });
    }
  }, [pathname, searchParams]);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
```

### 1.7 `lib/posthog.ts`

**Purpose**: Shared PostHog helpers (server-side event proxy if needed).

```ts
import posthog from 'posthog-js';

export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (typeof window !== 'undefined') {
    posthog.capture(event, properties);
  }
}

export function identifyUser(email: string, properties?: Record<string, unknown>) {
  if (typeof window !== 'undefined') {
    posthog.identify(email, properties);
  }
}

export function resetUser() {
  if (typeof window !== 'undefined') {
    posthog.reset();
  }
}
```

---

## 2. WorkOS ↔ Convex Auth Bridge (Critical Architecture)

The original spec is vague on how WorkOS sessions integrate with Convex queries. Here is the exact architecture:

### Problem
Convex's `useQuery`/`useMutation` hooks need authenticated context. WorkOS manages sessions externally (via cookies). We need to bridge the two.

### Solution: `ConvexProviderWithAuth` + WorkOS Session

**Option A — Cookie-based (Recommended for this app)**:
1. WorkOS callback sets an HTTP-only cookie containing the WorkOS `accessToken`
2. A custom React hook (`useWorkOSAuth`) reads session state from a `/api/auth/session` endpoint
3. `ConvexProviderWithAuth` uses this hook to pass the token to Convex
4. Convex functions that need auth call `ctx.auth.getUserIdentity()` — but since we're NOT using Convex's native auth, these functions instead accept a `workosUserId` argument and look up the user via `_utils.getUserByWorkosId()`

**Option B — Simpler approach (no Convex native auth)**:
1. WorkOS callback stores session in cookie
2. `AuthContext` reads session via `/api/auth/session` endpoint, stores user in React state
3. Use plain `ConvexProvider` (NOT `ConvexProviderWithAuth`)
4. Pass `userId` (Convex `_id`) as argument to mutations/queries that need it
5. Server-side validation happens in Convex functions via `_utils.requireUser()`

**Recommendation**: Option B is simpler and matches the existing Convex function signatures (which already accept `userId` as a parameter, not from `ctx.auth`). The existing `convex/orders.ts`, `convex/garage.ts`, etc. already take `userId` arguments.

### Required API Route: `app/api/auth/session/route.ts`

Returns current user session (or null) by validating the WorkOS cookie:
```ts
// GET /api/auth/session
// Returns: { user: { id, email, name, avatarUrl, role, convexUserId } } | { user: null }
```

### AuthContext Rewrite Shape

```tsx
interface AuthUser {
  convexUserId: string;    // Convex users._id
  workosUserId: string;    // WorkOS user ID
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: 'admin' | 'user';
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: () => void;       // Redirect to WorkOS AuthKit
  logout: () => Promise<void>;  // Call /api/auth/logout
}
```

**Key difference from current**: Firebase `User` object is replaced with `AuthUser`. All components consuming `useAuth()` must adapt:
- `user.uid` → `user.convexUserId`
- `user.email` → `user.email` (same)
- `user.photoURL` → `user.avatarUrl`
- `user.displayName` → `user.name`

---

## 3. Files to MODIFY — Exact Migration Instructions

### 3.1 `app/layout.tsx` (39 lines)

**Current providers**: `AuthProvider > CartProvider > Navbar + children + Footer`

**New provider tree**:
```tsx
<ConvexProvider client={convex}>
  <PostHogProvider>
    <AuthProvider>
      <CartProvider>
        <Navbar />
        {children}
        <Footer />
      </CartProvider>
    </AuthProvider>
  </PostHogProvider>
</ConvexProvider>
```

**Changes**:
- Add `import { ConvexProvider, ConvexReactClient } from "convex/react"`
- Create `const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)`
- Add `import PostHogProvider from "@/components/PostHogProvider"`
- Keep `"use client"` — this must be a client component for Convex provider

### 3.2 `context/AuthContext.tsx` (66 lines) — **FULL REWRITE**

**Remove**: All Firebase imports (`onAuthStateChanged`, `signInWithPopup`, `GoogleAuthProvider`, `signOut`, `auth`)

**New implementation**:
- On mount, fetch `/api/auth/session` to get current user
- `login()` redirects to WorkOS AuthKit URL: `workos.userManagement.getAuthorizationUrl({ provider: 'authkit', redirectUri, clientId })`
- `logout()` calls `/api/auth/logout` then clears state
- On login/logout, call `posthog.identify()` / `posthog.reset()`
- Export `AuthUser` type for consumers

### 3.3 `context/CartContext.tsx` (197 lines)

**Firebase dependency**: None (cart is localStorage-only).

**Changes needed**:
- Add PostHog event tracking:
  - `addToCart` → `trackEvent('add_to_cart', { productId, name, price, quantity })`
  - `removeFromCart` → `trackEvent('remove_from_cart', { productId })`
- No Convex changes needed — cart stays client-side

### 3.4 `hooks/useProducts.ts` (47 lines) — **FULL REWRITE**

**Remove**: All Firestore imports (`collection`, `onSnapshot`, `query`, `orderBy`, `db`)

**New implementation**:
```ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useProducts() {
  const products = useQuery(api.products.list);
  return {
    products: products ?? [],
    loading: products === undefined,
  };
}
```

**Impact**: `ProductGrid`, `ProductPage`, and all category pages inherit this change automatically.

### 3.5 `hooks/useGarage.ts` (57 lines) — **FULL REWRITE**

**Remove**: All Firestore imports

**New implementation**:
```ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/context/AuthContext";
import { Id } from "@/convex/_generated/dataModel";

export function useGarage() {
  const { user } = useAuth();
  const items = useQuery(
    api.garage.byUser,
    user ? { userId: user.convexUserId as Id<"users"> } : "skip"
  );
  return {
    items: items ?? [],
    loading: items === undefined,
  };
}
```

**GarageItem type**: The existing interface stays, but `id` becomes a Convex `_id` string. `purchasedAt` changes from string to number (Convex uses `v.number()` for timestamps).

### 3.6 `hooks/useOrders.ts` (79 lines) — **FULL REWRITE**

**Remove**: All Firestore imports

**New implementation**: Same pattern as useGarage — `useQuery(api.orders.byUser, { userId })`.

**Order type changes**:
- `createdAt` → `_creationTime` (Convex auto-field, number)
- `transaction_id` → `transactionId` (camelCase in Convex schema)
- `payment_proof_url` → `paymentProofUrl`
- `payment_method` → `paymentMethod`
- `payment_status` → `paymentStatus`
- `order_status` → `orderStatus`
- `shipping_details` → `shippingDetails`

**All consumers of `useOrders()` must update field references to camelCase.**

### 3.7 `lib/settings.ts` (62 lines) — **FULL REWRITE**

**Remove**: All Firestore imports, `subscribeToWebsiteSettings`, `getWebsiteSettings`, `updateWebsiteSetting`.

**Replace with Convex hook** (used inline in consuming components):
```ts
// Consumers will use directly:
// const settings = useQuery(api.settings.getWebsite);
```

**Or create a thin wrapper hook** `hooks/useSettings.ts`:
```ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useSettings() {
  const settings = useQuery(api.settings.getWebsite);
  return settings ?? null;
}
```

**Impacted consumers**:
- `app/page.tsx` — replace `subscribeToWebsiteSettings` with `useSettings()`
- `components/Hero.tsx` — replace `subscribeToWebsiteSettings` with `useSettings()`
- `components/AssetManager.tsx` — replace `subscribeToWebsiteSettings` with `useSettings()`
- `components/CategoryGrid.tsx` — if it reads settings

**Field name mapping** (Firestore → Convex):
| Firestore (snake_case) | Convex (camelCase) |
|---|---|
| `hero_background` | `heroBackground` |
| `vault_image` | `vaultImage` |
| `footer_background` | `footerBackground` |
| `category_jdm` | `categoryJdm` |
| `category_european` | `categoryEuropean` |
| `category_hypercars` | `categoryHypercars` |

### 3.8 `lib/firebase.ts` (82 lines) — **DELETE**

Remove entirely after all imports are migrated.

### 3.9 `lib/data.ts` (29 lines)

**Changes**:
- Remove `createdAt?: any` field (Convex has `_creationTime`)
- Keep `Product` interface but ensure it aligns with Convex schema
- `id` field becomes `_id` from Convex (string format `Id<"products">`)
- Add compatibility: `export type ProductId = Id<"products">;`

### 3.10 `components/Hero.tsx` (355 lines)

**Changes**:
1. **Remove hardcoded admin login** (lines 125-133): Delete `handleLogin`, `username`, `password`, `error` state, and the entire login modal JSX (lines 278-351)
2. **Replace admin auth**: Admin wheel click → check `user?.role === 'admin'` → redirect to `/admin` directly (or show "unauthorized" toast)
3. **Replace settings subscription**: `subscribeToWebsiteSettings` → `useSettings()` hook
4. **Remove imports**: `Lock`, `User as UserIcon`, `AlertCircle` (only used in login modal)
5. **Remove**: `localStorage.setItem('admin_auth', 'true')` — admin access is role-based

### 3.11 `components/AuthModal.tsx` (87 lines) — **REWRITE**

**Remove**: Google sign-in button with `loginWithGoogle()`

**Replace with**:
```tsx
<button onClick={() => login()}>
  Continue with AuthKit
</button>
```

Where `login()` from `useAuth()` redirects to WorkOS AuthKit (which handles Google OAuth, email/password, etc. internally).

**Keep**: Modal animation, styling, terms text.

### 3.12 `components/Navbar.tsx` (189 lines)

**Changes**:
- `user.photoURL` → `user.avatarUrl`
- `user.displayName` → `user.name`
- `logout()` now calls WorkOS logout endpoint
- UI-avatars fallback: update `user.displayName` reference

### 3.13 `components/AssetManager.tsx` (504 lines) — **MAJOR REWRITE**

**Remove**: All Firebase Storage imports (`ref`, `uploadBytesResumable`, `getDownloadURL`, `storage`)
**Remove**: All Firestore imports (`collection`, `addDoc`, `getDocs`, `deleteDoc`, `doc`, `query`, `orderBy`, `serverTimestamp`)

**Replace with Convex**:
- `fetchAssets()` → `useQuery(api.assets.list)`
- `handleSubmit()` (add asset) → `useMutation(api.assets.create)` with URL or upload to `convex/http.ts` endpoint
- `handleDelete()` → `useMutation(api.assets.remove)`
- `handleUpdateWebsiteAsset()` → `useMutation(api.settings.updateWebsiteSetting)`
- `handleSlotFileUpload()` → upload file to Convex HTTP endpoint, then call `updateWebsiteSetting` mutation

**File upload pattern** (replaces Firebase Storage):
```ts
const uploadToConvex = async (file: File) => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_CONVEX_URL!.replace('.cloud', '.site')}/upload`, {
    method: 'POST',
    body: file,
  });
  const { url } = await res.json();
  return url;
};
```

> **Note**: Convex HTTP actions don't support `uploadBytesResumable`-style progress tracking. For progress, use `XMLHttpRequest` with `upload.onprogress`. Alternatively, accept no progress bar for small image uploads.

### 3.14 `components/ProductCard.tsx` (106 lines)

**Changes**: Minimal. The component receives `Product` as props — no direct Firestore calls. Update `Product` type import if `id` → `_id`.

### 3.15 `components/ProductDetailModal.tsx` (243 lines)

**Changes**:
- Add PostHog: `trackEvent('product_viewed', { productId, name, category, price })` on modal open
- Update `Product` type if `id` → `_id`

### 3.16 `components/ProductGrid.tsx` (112 lines)

**Changes**: Uses `useProducts()` hook — inherits migration from 3.4. No direct Firebase imports.

### 3.17 `components/ProductPage.tsx` (83 lines)

**Changes**: Uses `useProducts()` hook — inherits migration from 3.4. No direct Firebase imports.

### 3.18 `components/Footer.tsx` (83 lines)

**Changes**: None needed. Footer has no Firebase dependencies. Social links are static.

### 3.19 `components/CartDrawer.tsx` (165 lines)

**Changes**: None needed. Uses `useCart()` and `useAuth()` — both will be updated at their source.

### 3.20 `app/page.tsx` (59 lines) — Inner Circle + Settings

**Changes**:
1. Replace `subscribeToWebsiteSettings` with `useSettings()` hook
2. Remove `useEffect` subscription pattern — Convex `useQuery` is reactive
3. **Replace newsletter section** (lines 25-56) with WhatsApp + Instagram CTAs (see Section 5)

### 3.21 `app/admin/page.tsx` (902 lines) — **MAJOR REWRITE**

This is the largest file. All Firebase CRUD operations must be replaced.

**Remove**: All Firestore imports (`collection`, `addDoc`, `updateDoc`, `deleteDoc`, `getDocs`, `doc`, `query`, `orderBy`, `where`, `serverTimestamp`)
**Remove**: All Firebase Storage imports
**Remove**: `localStorage.getItem('admin_auth')` check — use `useAuth()` role check

**Replace with Convex mutations/queries**:

| Current Firebase call | Convex replacement |
|---|---|
| `addDoc(collection(db, 'products'), ...)` | `useMutation(api.products.create)` |
| `updateDoc(doc(db, 'products', id), ...)` | `useMutation(api.products.update)` |
| `deleteDoc(doc(db, 'products', id))` | `useMutation(api.products.remove)` |
| `getDocs(query(collection(db, 'products'), ...))` | `useQuery(api.products.list)` |
| `getDocs(query(collection(db, 'pre_orders'), ...))` | `useQuery(api.preOrders.listAll)` |
| `updateDoc(doc(db, 'pre_orders', id), ...)` | `useMutation(api.preOrders.markArrived)` |
| Firebase Storage upload | Convex HTTP upload endpoint |

**Admin auth**:
```tsx
const { user } = useAuth();
if (!user || user.role !== 'admin') return <Unauthorized />;
```

### 3.22 `app/admin/orders/page.tsx` (473 lines) — **MAJOR REWRITE**

**Replace with Convex**:
| Current | Convex |
|---|---|
| `getDocs(query(collection(db, 'orders')))` | `useQuery(api.orders.listAll)` |
| `updateDoc(doc(db, 'orders', id), { payment_status })` | `useMutation(api.orders.updateStatus)` |
| `deleteDoc(doc(db, 'orders', id))` | Need new mutation: `api.orders.remove` |
| `updateDoc(doc(db, 'products', id), { stock: stock - qty })` | Already handled in `orders.updateStatus` |

**Field renames**: All `snake_case` → `camelCase` (see 3.6).

**Missing Convex mutation**: `orders.remove` — needs to be added to `convex/orders.ts`.

### 3.23 `app/admin/fulfillment/page.tsx` (265 lines) — **REWRITE**

**Not listed in original spec** but needs migration.

**Replace with**:
| Current | Convex |
|---|---|
| Firestore query for verified orders | `useQuery(api.orders.listForFulfillment)` |
| `updateDoc(doc(db, 'orders', id), { order_status: 'completed' })` | `useMutation(api.orders.markCompleted)` |

### 3.24 `app/checkout/page.tsx` (381 lines) — **MAJOR REWRITE**

**Current flow**: Compresses payment screenshot to base64, stores in Firestore document, creates order.

**New flow**: Upload payment screenshot to Convex HTTP endpoint → get storage URL → create order with URL.

**Replace**:
| Current | Convex |
|---|---|
| `addDoc(collection(db, 'orders'), ...)` | `useMutation(api.orders.create)` |
| `addDoc(collection(db, 'users/${uid}/garage'), ...)` | Handled inside `orders.create` or separate `garage.add` mutation |
| `addDoc(collection(db, 'pre_orders'), ...)` | `useMutation(api.preOrders.create)` |
| Base64 image storage in Firestore | Upload to Convex storage, pass URL |
| `user.uid` | `user.convexUserId` |

**PostHog**: Add `trackEvent('payment_submitted', { orderId, totalAmount })` on successful submission.

**Missing Convex mutation**: Need `garage.add` mutation for adding items to user's garage after order. Currently `convex/garage.ts` only has `byUser` and `updateStatus`. **Add a `create` mutation**.

### 3.25 `app/checkout/details/page.tsx` (313 lines)

**Firebase dependency**: None directly (uses CartContext + shipping API).

**Changes**:
- PostHog: `trackEvent('checkout_started', { cartTotal, itemCount })` on mount
- PostHog: `trackEvent('shipping_calculated', { pincode, shippingCost })` when shipping rate returns

### 3.26 `app/garage/page.tsx` (362 lines) — **REWRITE**

**Replace**:
- `useGarage()` — inherits from 3.5
- `useOrders()` — inherits from 3.6
- All field references: `payment_status` → `paymentStatus`, etc.
- `user.uid` → `user.convexUserId`
- Balance payment flow: Update `garageItemId` references for Convex IDs

### 3.27 `app/garage/pre-orders/page.tsx` (166 lines)

**Replace**: Same as 3.26 — inherits from hook rewrites. Update field names.

### 3.28 `app/order-success/page.tsx` (77 lines)

**Changes**:
- PostHog: `trackEvent('order_completed', { orderId, totalAmount, itemCount })` on mount
- No Firebase dependency

### 3.29 Category Pages

These pages use `ProductPage` component which uses `useProducts()`:
- `app/pre-orders/page.tsx`
- `app/current-stock/page.tsx`
- `app/new-arrivals/page.tsx`
- `app/bundles/page.tsx`

**Changes**: None needed if `useProducts()` and `ProductPage` are migrated.

---

## 4. Missing Convex Mutations (Must Add)

The existing Convex backend is missing a few mutations needed by the frontend:

### 4.1 `convex/orders.ts` — Add `remove` mutation

```ts
export const remove = mutation({
  args: { orderId: v.id("orders") },
  handler: async (ctx, { orderId }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(orderId);
  },
});
```

### 4.2 `convex/garage.ts` — Add `create` mutation

```ts
export const create = mutation({
  args: {
    userId: v.id("users"),
    productId: v.id("products"),
    name: v.string(),
    price: v.number(),
    originalPrice: v.optional(v.number()),
    image: v.string(),
    category: v.string(),
    brand: v.string(),
    scale: v.string(),
    purchasedAt: v.number(),
    status: v.union(v.literal("owned"), v.literal("pre-ordered"), v.literal("arrived")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("garageItems", args);
  },
});
```

### 4.3 `convex/products.ts` — Verify `list` query returns `_id`

Ensure the list query returns products with `_id` field (Convex does this by default). Consumers will use `product._id` instead of `product.id`.

### 4.4 `convex/settings.ts` — Field name alignment

Verify that `getWebsite` returns fields matching the new camelCase convention. The existing implementation already uses camelCase (`heroBackground`, etc.) — this aligns with Convex schema.

**But the frontend (`WebsiteSettings` interface) uses snake_case** (`hero_background`). Either:
- A) Update all frontend references to camelCase (recommended — cleaner)
- B) Map in the Convex query (adds complexity)

**Recommendation**: Option A — update `WebsiteSettings` interface and all consumers to camelCase.

---

## 5. Inner Circle Redesign — Exact Implementation

### Current Code (app/page.tsx lines 25-56)
```tsx
{/* Newsletter Section */}
<section className="py-24 border-y border-white/5 relative overflow-hidden">
  {/* ... background image + tire-tread pattern ... */}
  <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
    <h2>Join the <span>Inner Circle</span></h2>
    <p>Be the first to know...</p>
    <form>
      <input type="email" ... />
      <button>Subscribe</button>
    </form>
  </div>
</section>
```

### Replacement
```tsx
{/* Inner Circle Section */}
<section className="py-24 border-y border-white/5 relative overflow-hidden">
  {/* Keep: background image, gradient overlays, tire-tread pattern — unchanged */}
  <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
    <h2 className="text-4xl font-display font-bold uppercase tracking-tighter mb-6">
      Join the <span className="text-accent italic">Inner Circle</span>
    </h2>
    <p className="text-white/40 text-sm uppercase tracking-widest mb-10 leading-relaxed">
      Get instant updates on exclusive drops, pre-order windows, and member-only deals. Follow us for the latest.
    </p>
    <div className="flex flex-col md:flex-row gap-4 justify-center">
      <a
        href="https://chat.whatsapp.com/BvgtaCooKYpJpsfDo978Fy?mode=gi_t"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-[#25D366] hover:bg-[#1da851] text-white px-8 py-4 rounded-full font-bold flex items-center justify-center gap-3 transition-all"
      >
        {/* WhatsApp SVG icon (20x20) */}
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        Join WhatsApp Community
      </a>
      <a
        href="https://www.instagram.com/dreamdiecastofficial/"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:opacity-90 text-white px-8 py-4 rounded-full font-bold flex items-center justify-center gap-3 transition-all"
      >
        {/* Instagram SVG icon (20x20) */}
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
        </svg>
        Follow on Instagram
      </a>
    </div>
  </div>
</section>
```

---

## 6. Package Changes (Exact)

### Install
```bash
npm install convex @workos-inc/node posthog-js posthog-node
```

### Remove
```bash
npm uninstall firebase firebase-tools
```

### Verify `package.json` devDependencies
Remove `"firebase-tools": "^15.0.0"` from devDependencies.

---

## 7. Files to DELETE

| File | Reason |
|------|--------|
| `lib/firebase.ts` | Replaced by Convex |
| `lib/settings.ts` | Replaced by `convex/settings.ts` + `hooks/useSettings.ts` |
| `firestore.rules` | Convex uses function-level auth |
| `storage.rules` | Convex handles storage auth in functions |
| `firebase-applet-config.json` | No longer needed |
| `firebase-blueprint.json` | No longer needed |

---

## 8. Environment Variables — Final `.env.example`

```env
# Convex
NEXT_PUBLIC_CONVEX_URL=https://sleek-coyote-945.convex.cloud
CONVEX_DEPLOY_KEY=

# WorkOS
WORKOS_CLIENT_ID=client_01KMGCN6V0P6BNN8XNYB9EVW0Q
WORKOS_API_KEY=
WORKOS_REDIRECT_URI=http://localhost:3000/api/auth/callback
WORKOS_COOKIE_PASSWORD=

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Shiprocket (unchanged)
SHIPROCKET_EMAIL=
SHIPROCKET_PASSWORD=
SHIPROCKET_PICKUP_POSTCODE=

# Gemini (if still needed)
GEMINI_API_KEY=
```

---

## 9. Product `id` → `_id` Migration Strategy

Convex documents use `_id` (auto-generated), not `id`. This affects every component that references `product.id`.

### Options

**Option A — Alias in query (Recommended)**:
In `convex/products.ts` list query, map results:
```ts
return products.map(p => ({ ...p, id: p._id }));
```
This preserves the `product.id` pattern across the entire frontend with zero component changes.

**Option B — Update all references**:
Find-and-replace `product.id` → `product._id` across ~15 files. More correct but higher blast radius.

**Recommendation**: Option A for products (most referenced). For orders, garage items, etc., the Convex queries already return `_id` and the frontend can be updated since fewer components reference those IDs directly.

---

## 10. Implementation Order (Revised)

Based on dependency analysis:

1. **Install packages** — `npm install convex @workos-inc/node posthog-js posthog-node && npm uninstall firebase firebase-tools`
2. **Add missing Convex mutations** — `orders.remove`, `garage.create`, product `id` aliasing
3. **Create `convex/http.ts`** — file upload endpoint
4. **Create WorkOS auth routes** — `/api/auth/callback`, `/api/auth/logout`, `/api/auth/session`
5. **Create `lib/workos.ts`** and `lib/posthog.ts`
6. **Rewrite `context/AuthContext.tsx`** — WorkOS session management
7. **Create `components/PostHogProvider.tsx`**
8. **Rewrite `app/layout.tsx`** — new provider tree
9. **Rewrite hooks** — `useProducts.ts`, `useGarage.ts`, `useOrders.ts`, create `useSettings.ts`
10. **Migrate components** — Hero (remove hardcoded login), AuthModal (WorkOS redirect), Navbar (user fields), AssetManager (Convex storage)
11. **Migrate pages** — admin/page.tsx, admin/orders, admin/fulfillment, checkout, garage
12. **Inner Circle redesign** — Replace email form in `app/page.tsx`
13. **Add PostHog events** — instrument across components per Section 3 of original spec
14. **Delete Firebase files** — `lib/firebase.ts`, `lib/settings.ts`, `firestore.rules`, `storage.rules`, `firebase-applet-config.json`, `firebase-blueprint.json`
15. **Update `.env.example`**
16. **Test** — Full E2E

---

## 11. Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Convex `useQuery` returns `undefined` during loading (not `[]`) | Components may crash if they call `.map()` on undefined | Always use `?? []` fallback pattern |
| WorkOS session cookie not set on callback | Users appear logged out | Test callback route independently with curl |
| Convex HTTP upload endpoint CORS | Asset uploads fail from browser | Configure CORS headers in `http.ts` response |
| Product `id` vs `_id` mismatch | Cart breaks (uses `product.id` for matching) | Use aliasing (Section 9, Option A) |
| Settings field casing (`snake_case` vs `camelCase`) | Settings don't display | Unified rename to camelCase across all consumers |
| `firebase-applet-config.json` imported in `lib/firebase.ts` — other files may import it | Build error after deletion | Grep for all `firebase` imports before deleting |
| Base64 payment proof images in existing orders | Old order images break after Firebase teardown | Migration script must re-upload to Convex storage |
| Admin email check is duplicated | Convex `_utils.ts` and potential frontend checks diverge | Single source of truth in Convex; frontend just reads `user.role` |

---

## 12. Completion Criteria (Updated)

All items from original spec, plus:

- [ ] `convex/http.ts` created with file upload endpoint
- [ ] `convex/orders.ts` has `remove` mutation
- [ ] `convex/garage.ts` has `create` mutation
- [ ] WorkOS auth routes created (`/api/auth/callback`, `/api/auth/logout`, `/api/auth/session`)
- [ ] `lib/workos.ts` created
- [ ] `components/PostHogProvider.tsx` created
- [ ] `hooks/useSettings.ts` created
- [ ] All `snake_case` field references updated to `camelCase`
- [ ] Product `id` → `_id` compatibility resolved
- [ ] `app/admin/fulfillment/page.tsx` migrated (was missing from original spec)
- [ ] `components/CategoryGrid.tsx` migrated if it reads settings
- [ ] `firebase-applet-config.json` and `firebase-blueprint.json` deleted
- [ ] No `localStorage.getItem('admin_auth')` references remain
- [ ] `.env.example` updated with all new variables
