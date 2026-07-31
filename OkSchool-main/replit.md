# OkSchool

An Indian educational web platform where students can browse free PDFs and paid editable Word files, take timed mock tests, shop recommended books via Amazon affiliate links, and admins can manage all content from a dashboard.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 18 + Vite (artifacts/okschool, port 25934) with wouter routing
- API: Express 5 (artifacts/api-server, port 8080)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- UI: Tailwind CSS v4, shadcn/ui components
- Fonts: Playfair Display (headings) + Inter (body)

## Where things live

- `lib/db/src/schema/index.ts` — source-of-truth DB schema (documents, amazon_products, mock_tests, questions)
- `lib/api-spec/openapi.yaml` — OpenAPI contract
- `lib/api-client-react/src/` — generated React Query hooks + Zod schemas (via Orval)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/okschool/src/pages/` — 8 frontend pages
- `artifacts/okschool/src/components/layout/` — Navbar, Footer, Marquee
- `.env.example` — required environment variables

## Architecture decisions

- **Contract-first API**: OpenAPI spec → Orval codegen → React Query hooks + Zod schemas. Never write fetch calls manually.
- **Payment simulation**: Razorpay is simulated (fake UPI QR + "I have completed the payment" button). No real SDK. Set `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` to wire in real Razorpay.
- **Admin gate**: `localStorage.adminEmail === 'kartik1911k@gmail.com'`. AdminDashboard redirects to /login if not set.
- **Shared proxy**: Both services run behind the Replit reverse proxy. API is at `/api`, frontend at `/`. Use `localhost:80/api/...` for ad-hoc curl — never hit ports directly.
- **Document access model**: Free docs → PDF download. Paid docs → payment required for Word file. PDF preview always visible.

## Product

- **Home**: Tab-filtered study materials (Notes, Investigatory Projects, Question Papers, Free Book PDFs, Practical Files Class 12). Hero search bar.
- **Study Material Detail**: Document preview with blur paywall, simulated UPI payment modal, download tracking.
- **Mock Tests**: Listing of timed tests. Quiz engine with countdown timer, answer tracking, per-question review + score.
- **Amazon Store**: Affiliate book recommendations with external buy links.
- **Search**: Global search across documents, products, and mock tests.
- **Admin Dashboard**: Sidebar-nav dashboard with overview stats, document CRUD, Amazon product CRUD, settings.

## User preferences

- Admin email: kartik1911k@gmail.com
- Pricing: Free PDF, paid Word files at ₹20–₹30
- Payment: Simulated Razorpay (fake UPI QR)

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `openapi.yaml`.
- Run `pnpm --filter @workspace/db run push` after changing the DB schema.
- Workflows need `PORT` and `BASE_PATH` prepended to the dev command (see artifact.toml or workflow config).
- Do not run `pnpm dev` at workspace root — use `restart_workflow` or the workflow panel.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
