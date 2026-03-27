# x402-wrap-dashboard

A Next.js 14 dashboard for `x402-wrap`, a managed reverse proxy that monetizes APIs via x402 USDC payments.

## Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Clerk v5
- Upstash Redis

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the example env file and fill in your values:

```bash
cp .env.local.example .env.local
```

3. Start the dev server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`
- `PROXY_API_URL`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

If Upstash variables are omitted, endpoint storage falls back to an empty in-memory result from the wrapper and the UI will still render.

## Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`

## Routes

- `/` landing page
- `/sign-in`
- `/sign-up`
- `/dashboard`
- `/dashboard/register`
- `/dashboard/endpoints/[id]`

## Notes

- `/dashboard` and `/api/endpoints` are protected by Clerk middleware.
- Endpoint registration is forwarded to the upstream x402-wrap proxy and persisted per user in Upstash Redis.
