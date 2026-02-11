# The Iceberg Method

> Bottom-Up Revenue Scaling for Shopify DTC Brands
> **≥20% revenue lift in 90 days** by fixing lifecycle, funnel, and post-purchase before scaling paid acquisition.

## What is this?

The Iceberg Method is a SaaS platform that implements a diagnostic revenue framework for bootstrapped Shopify direct-to-consumer brands. Instead of scaling traffic first (the visible "tip" of the iceberg), it enforces a bottom-up sequence that stabilizes the 90% of revenue drivers hidden beneath the surface.

**The enforced sequence:**
1. Deliverability (emails reach customers)
2. Core lifecycle flows (6 mandatory high-intent moments)
3. Segmentation (no generic blasts)
4. Funnel measurement & stability
5. CRO observation (identify friction)
6. Revenue activation (existing customer monetization)
7. Offer construction (margin-optimized acquisition mechanism)
8. Paid acquisition (NOW you can scale)

**Gates block progression** until earlier phases pass their thresholds. Paid acquisition features are locked until deliverability, funnel throughput, and backend revenue meet requirements.

## Project Structure

```
/
├── frontend/          # Next.js 14 + React + TypeScript
├── backend/           # NestJS + TypeScript (API & workers)
├── shared/            # Shared types and utilities
├── SPEC.md            # Complete technical specification
├── PRD.md             # Product requirements (business logic)
└── PLAN.md            # Implementation roadmap
```

## Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion (animations)
- React Query (data fetching)
- Recharts (analytics visualization)

**Backend:**
- Node.js + TypeScript
- NestJS framework
- PostgreSQL (dual: OLTP + OLAP)
- Redis (job queues, caching)
- Bull (background jobs)

**Integrations:**
- Shopify (OAuth + webhooks)
- Klaviyo (ESP for lifecycle flows)
- Microsoft Clarity / Hotjar (CRO observation)

**Infrastructure:**
- PaaS deployment (Render/Railway/Heroku)
- Sentry (error tracking)
- Winston (structured logging)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Shopify Partner account (for OAuth credentials)

### Frontend Development

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your credentials
npm run dev
```

Visit http://localhost:3000

### Backend Development

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

API runs on http://localhost:4000

## Key Features

### ✅ Implemented
- [x] Landing page with direct-response copy
- [x] Distinctive UI design system ("deep ocean" aesthetic)
- [x] Project scaffolding

### 🚧 In Progress
- [ ] Shopify OAuth flow
- [ ] Webhook receiver infrastructure
- [ ] Phase 1: Deliverability monitoring

### 📋 Planned
- [ ] Gate enforcement system
- [ ] Baseline calculation engine
- [ ] Monday Ritual dashboard
- [ ] Lifecycle flow orchestration
- [ ] Funnel analytics
- [ ] Integration hub (ESP, CRO tools)

See [PLAN.md](./PLAN.md) for the complete implementation roadmap.

## Design Philosophy

**Copy:** Uses direct-response principles from Hopkins, Ogilvy, Halbert, and Caples. Specific > vague. Benefits > features. Stories > pitches. Every claim backed by proof.

**UI/UX:** Internet-native, not corporate. Atmospheric backgrounds, distinctive typography, strategic animations. Progressive disclosure matches the enforced framework sequence.

**Architecture:** Standalone SaaS with deep Shopify integration. Optimized for 10-50 merchants at launch, architected to scale to hundreds without major refactoring.

## Documentation

- **[SPEC.md](./SPEC.md)** — Complete technical specification (architecture, data models, API design, security)
- **[PRD.md](./PRD.md)** — Product requirements (business logic, metrics, gates, thresholds)
- **[PLAN.md](./PLAN.md)** — Implementation plan (phases, tasks, priorities)

## License

Proprietary. © 2026 The Iceberg Method.

## Contact

Built for bootstrapped DTC brands who are tired of burning cash on ads that amplify leaks.
