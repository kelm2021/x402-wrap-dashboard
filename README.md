# AurelianFlo Wrapped Dashboard

Next.js dashboard for `AurelianFlo Wrapped`, the seller-facing UI for registering, verifying, activating, and monitoring wrapped x402 endpoints.

## Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- wagmi + RainbowKit
- Sign-In with Ethereum (SIWE-style nonce + signature flow)
- Upstash Redis

## Core Flow

1. Connect wallet and sign in
2. Create a registration intent for an origin
3. Publish the verification token under `/.well-known/x402-wrap-verification/<token>`
4. Verify ownership from the dashboard
5. Pay the registration fee on Base and activate the endpoint

## Required Environment Variables

- `JWT_SECRET`
- `PROXY_API_URL`
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Production does not silently fall back to localhost or a development JWT secret.

## Local Setup

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

## Scripts

- `npm run dev`
- `npm run build`
- `npm run start`

## Notes

- The dashboard expects the wrap backend to be reachable at `PROXY_API_URL`.
- Endpoint ownership, status, and listing metadata are persisted in Upstash Redis.
- Private endpoints remain unlisted unless explicitly set public.
