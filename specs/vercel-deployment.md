# Vercel Deployment Spec - DreamDiecast

## Overview

Deploy the DreamDiecast Next.js 15 + Convex e-commerce app to Vercel. The app uses Convex as a hosted backend (no self-hosted DB), WorkOS for auth, Shiprocket for shipping, and PostHog for analytics.

---

## 1. Required File Changes

### 1.1 `package.json` - Add Convex build step

The current `build` script is just `next build`. Convex functions must be deployed before/alongside the Next.js build so the generated client types are available.

**Change:**
```json
"scripts": {
  "build": "npx convex deploy --cmd 'next build'",
  "dev": "npx convex dev & next dev",
  "start": "next start",
  "lint": "eslint ."
}
```

> `convex deploy --cmd 'next build'` deploys Convex functions first, then runs the Next.js build. This is the official Convex + Vercel pattern.

### 1.2 `.env.example` - Update with all required variables

Create/update `.env.example` to document every env var needed in production:

```env
# Convex
NEXT_PUBLIC_CONVEX_URL=
CONVEX_DEPLOY_KEY=

# WorkOS Authentication
WORKOS_CLIENT_ID=
WORKOS_API_KEY=
NEXT_PUBLIC_WORKOS_CLIENT_ID=
NEXT_PUBLIC_WORKOS_REDIRECT_URI=

# PostHog Analytics
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=

# Shiprocket Shipping
SHIPROCKET_EMAIL=
SHIPROCKET_PASSWORD=
SHIPROCKET_PICKUP_POSTCODE=

# Optional
GEMINI_API_KEY=
```

### 1.3 `next.config.ts` - Add Convex image domain

Convex storage URLs serve images from `*.convex.cloud`. Add this to `remotePatterns`:

```ts
{
  protocol: 'https',
  hostname: '*.convex.cloud',
  pathname: '/**',
}
```

Also add the Convex site URL hostname if product images are served from there.

### 1.4 WorkOS Redirect URI - Production URL

The current `NEXT_PUBLIC_WORKOS_REDIRECT_URI` is hardcoded to `http://localhost:3000/api/auth/callback`. For production, this must be set to the Vercel production URL:

```
https://<your-domain>/api/auth/callback
```

This must also be registered in the WorkOS dashboard as an allowed redirect URI.

### 1.5 Convex CORS - Update `convex/http.ts`

The upload endpoint currently allows `Access-Control-Allow-Origin: *`. For production, restrict this to the Vercel production domain:

```ts
"Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_APP_URL || "*",
```

Or keep `*` if the Convex HTTP endpoint is only used from the client and you accept the risk.

---

## 2. Environment Variables to Set in Vercel Dashboard

All env vars must be configured in the Vercel project settings (Settings > Environment Variables). **Do NOT commit `.env` files with secrets.**

| Variable | Scope | Notes |
|----------|-------|-------|
| `NEXT_PUBLIC_CONVEX_URL` | All | Convex deployment URL (keep same for prod) |
| `CONVEX_DEPLOY_KEY` | Production + Preview | **Must be a production deploy key** from Convex dashboard, not the dev one |
| `WORKOS_CLIENT_ID` | All | Same across environments |
| `WORKOS_API_KEY` | All | Server-side only, use production key |
| `NEXT_PUBLIC_WORKOS_CLIENT_ID` | All | Client-side WorkOS ID |
| `NEXT_PUBLIC_WORKOS_REDIRECT_URI` | Production | `https://<your-domain>/api/auth/callback` |
| `NEXT_PUBLIC_WORKOS_REDIRECT_URI` | Preview | `https://<preview-url>/api/auth/callback` (or use `VERCEL_URL`) |
| `NEXT_PUBLIC_POSTHOG_KEY` | All | PostHog project API key |
| `NEXT_PUBLIC_POSTHOG_HOST` | All | `https://us.i.posthog.com` |
| `SHIPROCKET_EMAIL` | All | Server-side only |
| `SHIPROCKET_PASSWORD` | All | Server-side only |
| `SHIPROCKET_PICKUP_POSTCODE` | All | Server-side only |
| `GEMINI_API_KEY` | All | Optional, server-side only |

### Critical: Convex Production Deployment

You need a **production** Convex deployment (not `dev:sleek-coyote-945`):

1. Go to Convex dashboard > Project > Deployments
2. Create or use an existing production deployment
3. Generate a production `CONVEX_DEPLOY_KEY`
4. Set `NEXT_PUBLIC_CONVEX_URL` to the production Convex URL

---

## 3. Convex + Vercel Integration

### Option A: Manual (Recommended for simplicity)

1. Set `CONVEX_DEPLOY_KEY` in Vercel env vars
2. Use `"build": "npx convex deploy --cmd 'next build'"` in package.json
3. On every Vercel build, Convex functions deploy first, then Next.js builds

### Option B: Convex Vercel Integration

1. Install the Convex integration from Vercel Marketplace
2. It auto-sets `CONVEX_DEPLOY_KEY` and `NEXT_PUBLIC_CONVEX_URL`
3. Same build command still required

---

## 4. WorkOS Production Setup

1. In WorkOS dashboard, add the production redirect URI: `https://<your-domain>/api/auth/callback`
2. Switch from test API key (`sk_test_...`) to production key (`sk_production_...`) if going live
3. Enable the authentication methods you want (Google OAuth, email, etc.)

---

## 5. File Structure - New/Modified Files

```
DreamDiecast/
  package.json              # MODIFY - update build script
  next.config.ts            # MODIFY - add Convex image domain
  .env.example              # MODIFY - document all prod vars
  convex/http.ts            # REVIEW - CORS policy for production
```

No new files are required. The existing `.vercel/` directory (gitignored) will be auto-generated by Vercel CLI or the GitHub integration.

---

## 6. Deployment Steps (in order)

1. **Update `package.json`** build script to `npx convex deploy --cmd 'next build'`
2. **Update `next.config.ts`** to allow Convex image domains
3. **Set up Convex production deployment** and get production deploy key
4. **Register production redirect URI** in WorkOS dashboard
5. **Connect repo to Vercel** (via GitHub integration or `vercel` CLI)
6. **Set all environment variables** in Vercel dashboard (see table above)
7. **Set `NEXT_PUBLIC_WORKOS_REDIRECT_URI`** to production URL
8. **Deploy** - Vercel will run `npx convex deploy --cmd 'next build'`
9. **Verify** auth flow, product loading, cart, checkout, and admin panel

---

## 7. Edge Cases & Gotchas

### Preview Deployments & Auth
- Each Vercel preview deploy gets a unique URL. The WorkOS redirect URI won't match preview URLs unless you:
  - Use `VERCEL_URL` env var dynamically in the callback route, OR
  - Register a wildcard redirect in WorkOS (if supported), OR
  - Accept that auth won't work on preview deploys (common for small teams)

### Convex Dev vs Prod
- **Do NOT use the dev deploy key in production.** Dev deployments have different rate limits and are not meant for production traffic.
- The `CONVEX_DEPLOYMENT` env var (in `.env.local`) is for local dev only. Vercel should use `CONVEX_DEPLOY_KEY` instead.

### Image Optimization
- Vercel's image optimization has usage limits on free/hobby plans. Monitor usage if serving many product images through `next/image`.

### Build Time
- The `convex deploy` step adds ~10-20s to each build. This is normal.

### PostHog
- PostHog works client-side out of the box. No Vercel-specific changes needed. The `posthog-node` server-side usage in API routes will also work as-is.

### Shiprocket API
- The shipping calculate route already has a mock fallback if credentials are missing. This is good for preview environments.

---

## 8. Completion Criteria

- [ ] `npm run build` succeeds locally with production env vars
- [ ] Vercel deployment builds and deploys without errors
- [ ] Home page loads with products from Convex
- [ ] WorkOS auth login/logout flow works on production URL
- [ ] Cart, checkout, and order flow works end-to-end
- [ ] Admin panel accessible to admin users
- [ ] Shipping calculation returns results
- [ ] Images load correctly (Convex storage + external)
- [ ] PostHog events fire on production

---

## 9. Security Notes

- `.env` is already in `.gitignore` - good
- The current `.env` file contains real secrets (WorkOS API key, Shiprocket password, Convex deploy key). These should **never** be committed. Verify git history doesn't contain them.
- Use Vercel's encrypted environment variables for all secrets
- Consider rotating the WorkOS API key and Shiprocket password since they appear in the `.env` file that may have been committed previously
