# WS6 Build Task

Build a complete Next.js 14 (App Router) dashboard project for x402-wrap in the CURRENT directory.

## Project: x402-wrap-dashboard
A dashboard for x402-wrap — a managed reverse proxy that monetizes APIs via x402 USDC payments.

## Stack
- Next.js 14 (App Router, NOT Pages Router)
- TypeScript
- Tailwind CSS
- Clerk (@clerk/nextjs v5) for auth
- Plain Tailwind components (no shadcn needed)
- Target: Vercel deployment

## File Structure to Create
```
├── app/
│   ├── layout.tsx          # ClerkProvider wrapper, global styles
│   ├── globals.css
│   ├── page.tsx            # Landing page
│   ├── sign-in/[[...sign-in]]/page.tsx
│   ├── sign-up/[[...sign-up]]/page.tsx
│   └── dashboard/
│       ├── layout.tsx      # Protected layout with nav
│       ├── page.tsx        # Endpoint list
│       ├── register/
│       │   └── page.tsx    # Register form
│       └── endpoints/
│           └── [id]/
│               └── page.tsx # Endpoint detail
├── components/
│   ├── EndpointCard.tsx
│   ├── RegisterForm.tsx
│   └── UsageChart.tsx      # Simple bar chart with SVG
├── lib/
│   ├── proxy-client.ts     # API calls to x402-wrap proxy
│   └── kv.ts               # Upstash Redis wrapper
├── app/api/
│   ├── endpoints/route.ts          # GET: list user endpoints
│   └── endpoints/register/route.ts # POST: register + store userId mapping
├── middleware.ts            # Clerk auth middleware
├── .env.local.example
├── package.json
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
├── next.config.ts
├── vercel.json
└── README.md
```

## Features

### Landing Page (/)
- Dark theme (#0a0a0a background), clean minimal design
- Hero: "Monetize any API with USDC payments"
- CTA button: "Get Started" → /sign-up
- How it works: 3 steps (Register endpoint → Get proxy URL → Earn USDC)
- Header with logo "x402-wrap" and Sign In link

### Auth (Clerk)
- ClerkProvider wrapping entire app in layout.tsx
- middleware.ts protects /dashboard routes using clerkMiddleware
- Sign in/up pages using Clerk components (<SignIn/>, <SignUp/>)
- After sign in → /dashboard, after sign up → /dashboard

### Dashboard (/dashboard) — Protected
- Fetch from /api/endpoints
- List endpoint cards
- Empty state: "Register your first endpoint" with link to /dashboard/register
- "Register New Endpoint" button → /dashboard/register

### Register Form (/dashboard/register) — Protected  
Client component form fields:
- originUrl (required, URL)
- price (required, number, USDC e.g. 0.01)
- walletAddress (required, 0x... Ethereum address)
- pathPattern (optional, default "/*")
- originHeaders (optional, JSON textarea)
On submit: POST to /api/endpoints/register
Show success with proxyUrl and copy button
Show inline error messages

### Endpoint Detail (/dashboard/endpoints/[id]) — Protected
- Fetch config from /api/endpoints
- Fetch usage from proxy via lib/proxy-client.ts getUsage()
- Simple SVG bar chart for requests/day last 7 days
- Recent events table

## API Routes

### GET /api/endpoints
```typescript
import { auth } from "@clerk/nextjs/server"
// Get userId, fetch from redis key user:{userId}:endpoints
// Return array with usage data merged from proxy
```

### POST /api/endpoints/register
```typescript
import { auth } from "@clerk/nextjs/server"
// Get userId, call proxy /register, store in redis, return endpoint
```

## lib/proxy-client.ts
```typescript
const PROXY_API_URL = process.env.PROXY_API_URL || "http://localhost:3402"

export interface RegisterRequest {
  originUrl: string
  price: string
  walletAddress: string
  pathPattern?: string
  originHeaders?: Record<string, string>
}

export interface RegisterResponse {
  endpointId: string
  proxyUrl: string
  price: string
  walletAddress: string
  originUrl: string
  pathPattern: string
  createdAt: string
}

export interface UsageData {
  totalRequests: number
  totalRevenue: string
  dailyStats: { date: string; requests: number; revenue: string }[]
  recentEvents: { path: string; method: string; amount: string; timestamp: string }[]
}

export async function registerEndpoint(data: RegisterRequest): Promise<RegisterResponse> {
  const res = await fetch(`${PROXY_API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function getUsage(endpointId: string): Promise<UsageData> {
  const res = await fetch(`${PROXY_API_URL}/usage/${endpointId}`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
```

## lib/kv.ts
```typescript
import { Redis } from "@upstash/redis"

const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

export interface StoredEndpoint {
  endpointId: string
  proxyUrl: string
  price: string
  walletAddress: string
  originUrl: string
  pathPattern: string
  createdAt: string
}

export async function getUserEndpoints(userId: string): Promise<StoredEndpoint[]> {
  if (!redis) return []
  const data = await redis.get<StoredEndpoint[]>(`user:${userId}:endpoints`)
  return data || []
}

export async function addEndpointToUser(userId: string, endpoint: StoredEndpoint): Promise<void> {
  if (!redis) return
  const existing = await getUserEndpoints(userId)
  existing.push(endpoint)
  await redis.set(`user:${userId}:endpoints`, existing)
}
```

## middleware.ts
```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/api/endpoints(.*)"])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect()
})

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)","/(api|trpc)(.*)"],
}
```

## package.json
```json
{
  "name": "x402-wrap-dashboard",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.2.29",
    "@clerk/nextjs": "^5.0.0",
    "@upstash/redis": "^1.34.0",
    "react": "^18",
    "react-dom": "^18"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "tailwindcss": "^3.4.0",
    "postcss": "^8",
    "autoprefixer": "^10"
  }
}
```

## .env.local.example
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

PROXY_API_URL=https://x402-wrap.fly.dev
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

## next.config.ts
```typescript
import type { NextConfig } from "next"
const nextConfig: NextConfig = {}
export default nextConfig
```

## vercel.json
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

## Styling Notes
- Dark theme: bg-[#0a0a0a] or bg-gray-950 for page backgrounds
- Accent: purple #7c3aed (text-purple-600, bg-purple-600)
- Cards: bg-gray-900 with gray-800 borders
- Text: white primary, gray-400 secondary
- Responsive, clean, professional

## Done Criteria
- All files created (package.json, tsconfig, tailwind, next.config, middleware, all pages, components, lib, api routes)
- No TypeScript errors in structure (types defined correctly)
- README.md with setup instructions
- .env.local.example with all vars

## When Done
Run: openclaw system event --text "WS6 dashboard build complete: Next.js app scaffolded in x402-wrap-dashboard" --mode now
