# Technical Specification
## The Iceberg Method — Revenue Scaling Platform for Shopify DTC Brands

**Version:** v1.0
**Date:** 2026-01-31
**Status:** Technical Blueprint
**Source Documents:** PRD.md v1.3, PLAN.md
**Rule:** If this spec conflicts with PRD.md, PRD.md wins.

---

## 1. System Overview

### 1.1 Architecture Pattern
**Standalone SaaS platform** with deep Shopify integration via OAuth and webhooks.

**Rationale:**
- Separate platform provides flexibility for complex UI/UX requirements
- Own database enables sophisticated analytics without Shopify API limitations
- Easier to add non-Shopify features in future if needed
- Better control over performance and scaling

**Trade-offs:**
- More complex setup than embedded Shopify app
- Requires OAuth flow and separate login
- Hosting and infrastructure management responsibility

---

## 2. Technology Stack

### 2.1 Backend
**Runtime:** Node.js + TypeScript
**Framework:** NestJS (or Express if lighter weight preferred)

**Rationale:**
- TypeScript shared with frontend reduces context switching
- Excellent ecosystem for API integrations (Shopify, Klaviyo, etc.)
- Strong async I/O performance for webhook processing
- Great tooling and community support

**Key Libraries:**
- `@shopify/shopify-api` - Shopify SDK
- `bull` or `bullmq` - Job queue management
- `node-postgres` - Database driver
- `ioredis` - Redis client
- `@sentry/node` - Error tracking
- `winston` - Structured logging

### 2.2 Frontend
**Framework:** React + Next.js
**Language:** TypeScript
**Styling:** TailwindCSS (or CSS-in-JS if preferred)

**Rationale:**
- Next.js provides SSR for fast initial loads and SEO
- Industry standard for B2B SaaS dashboards
- Rich ecosystem of data visualization libraries
- Strong TypeScript support

**Key Libraries:**
- `recharts` or `visx` - Analytics charts
- `tanstack/react-query` - Data fetching and caching
- `react-hook-form` - Form management
- `zod` - Runtime validation

### 2.3 Data Layer

#### Primary Database (OLTP)
**Technology:** PostgreSQL 15+

**Purpose:**
- Transactional data (merchants, integrations, configurations)
- Real-time operational state (gates, alerts, locks)
- Event ingestion staging

#### Analytics Database (OLAP)
**Technology:** PostgreSQL 15+ (separate instance)

**Purpose:**
- Time-series metrics and aggregations
- Dashboard query optimization
- Historical analytics
- Reporting and exports

**Data Flow:**
```
Webhooks → OLTP DB → Hourly ETL → OLAP DB → Dashboard Queries
```

**Rationale for dual Postgres:**
- Simpler stack (one technology to master)
- Lower infrastructure cost for 10-50 merchant scale
- Easier migrations and operations
- Can migrate to specialized warehouse (ClickHouse, BigQuery) if needed at scale

#### Cache & Queue
**Technology:** Redis 7+

**Purpose:**
- Job queues (webhook processing, ETL, alerts)
- Session storage
- Pre-computed segment cache
- Rate limiting state

### 2.4 Infrastructure & Hosting
**Platform:** PaaS (Heroku, Render, or Railway)

**Rationale:**
- Optimized for speed-to-market at 10-50 merchant scale
- Managed infrastructure (DB, Redis, deployments)
- Built-in scaling and monitoring
- Lower ops burden for early stage

**Required Services:**
- Web dyno/service (Next.js app)
- API dyno/service (NestJS backend)
- Worker dyno/service (background jobs)
- Postgres database (2 instances: OLTP + OLAP)
- Redis instance
- Object storage (S3-compatible for exports, logs)

---

## 3. Data Architecture

### 3.1 Multi-Tenancy Model
**Pattern:** Shared database with `tenant_id` (merchant_id) in all tables

**Implementation:**
- Every table includes `merchant_id` column (indexed)
- Row-Level Security (RLS) policies on all tables
- Application-level query filters as safety layer
- Connection pooling with tenant context

**Example Schema:**
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id),
  shopify_order_id BIGINT NOT NULL,
  revenue DECIMAL(10,2),
  device_type VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(merchant_id, shopify_order_id)
);

CREATE INDEX idx_orders_merchant_created
  ON orders(merchant_id, created_at DESC);

-- Row-level security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON orders
  USING (merchant_id = current_setting('app.current_merchant_id')::UUID);
```

**Data Isolation Safeguards:**
- TypeScript types enforce merchant_id in all queries
- Integration tests verify tenant isolation
- Audit logging for cross-tenant access attempts

### 3.2 Timezone Handling
**Storage:** All timestamps in UTC
**Display:** Convert to merchant's configured timezone in UI layer

**Implementation:**
```typescript
interface Merchant {
  id: string;
  timezone: string; // IANA timezone (e.g., "America/Los_Angeles")
  // ...
}

// Backend: always store UTC
const order = {
  created_at: new Date(), // UTC
};

// Frontend: display in merchant TZ
const displayDate = formatInTimeZone(
  order.created_at,
  merchant.timezone,
  'MMM dd, yyyy HH:mm'
);
```

**Daily Rollover:**
- Dashboard "daily" metrics roll over at midnight in merchant's timezone
- Background jobs calculate daily aggregates per merchant timezone
- Monday Ritual report uses merchant's Monday (not UTC Monday)

### 3.3 Historical Data & Backfill
**Onboarding Strategy:**
- Pull 90 days of historical orders from Shopify on initial connection
- Background job processes in batches (respect rate limits)
- Show "provisional" baseline until 30 days of connected data
- Mark dashboards as "backfill in progress" during initial load

**Backfill Process:**
1. Merchant authorizes Shopify OAuth
2. Queue `BackfillHistoricalDataJob` with merchant_id
3. Job fetches orders in 30-day chunks (oldest to newest)
4. Process each order through standard webhook handler
5. Update backfill progress in UI
6. Mark merchant as "fully backfilled" when complete

---

## 4. Integration Architecture

### 4.1 Shopify Integration

#### Authentication
**Method:** Shopify OAuth 2.0

**Flow:**
1. User clicks "Connect Shopify Store"
2. Redirect to Shopify OAuth consent screen
3. Shopify redirects back with authorization code
4. Exchange code for access token
5. Store encrypted access token in database
6. Use merchant's Shopify domain as single-sign-on (SSO) for platform

**Token Management:**
- Encrypt access tokens at rest (AES-256)
- Refresh tokens not needed (Shopify tokens don't expire unless revoked)
- Handle token revocation gracefully (graceful degradation)

#### Webhook Subscriptions
**Required Webhooks:**
- `orders/create` - New purchase
- `orders/updated` - Order modifications
- `checkouts/create` - Checkout initiated
- `checkouts/update` - Checkout progress
- `carts/create` - Cart created
- `carts/update` - Cart modifications
- `customers/create` - New customer
- `customers/update` - Customer profile changes
- `app/uninstalled` - Merchant disconnects

**Webhook Infrastructure:**

```typescript
// Webhook receiver endpoint
POST /webhooks/shopify

// Processing pipeline
┌─────────────────┐
│  Shopify sends  │
│    webhook      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Verify HMAC     │
│ signature       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Immediate ACK   │
│ (200 OK)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Push to Redis   │
│ queue with      │
│ idempotency key │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Background      │
│ worker processes│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Dedupe check    │
│ (event ID)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Process &       │
│ persist to DB   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Update segments,│
│ trigger flows   │
└─────────────────┘
```

**Idempotency:**
- Store webhook event ID in `processed_webhooks` table
- Check before processing: `SELECT 1 FROM processed_webhooks WHERE event_id = $1`
- At-least-once delivery with deduplication
- TTL: purge event IDs older than 30 days

**Dead Letter Queue:**
- Failed webhooks move to DLQ after 3 retries
- Manual review queue in admin dashboard
- Alerts on DLQ threshold (>100 events)

#### Polling Fallback (Reconciliation)
**Purpose:** Catch webhooks missed due to downtime or delivery failures

**Schedule:** Every 6 hours per merchant (offset to spread load)

**Scope:**
- Fetch orders updated in last 24 hours
- Compare against local database
- Queue missing orders for processing
- Alert if significant drift detected (>5% of orders missing)

**Rate Limit Management:**
```typescript
// Per-merchant queue with Shopify rate limits
// Shopify: 2 requests/second, burst allowance of 40

interface RateLimitQueue {
  merchantId: string;
  maxRequestsPerSecond: 2;
  priorityQueue: PriorityQueue<ApiRequest>;
}

// High-priority: gate checks, real-time alerts
// Medium-priority: webhook processing
// Low-priority: backfill, reconciliation
```

#### Device Tracking
**Source:** Shopify order webhook includes `browser_ip`, `user_agent`, `checkout_token`

**Implementation:**
- Extract device type from order data: `order.client_details.browser_width`
- Shopify provides: `desktop`, `mobile`, `tablet`, `unknown`
- Store in `orders.device_type` for segmented reporting
- No additional client-side tracking needed

### 4.2 ESP Integration (Email Service Providers)

#### Supported ESPs
**Phase 1:** Klaviyo (primary DTC ESP)
**Phase 2+:** Attentive (SMS), Mailchimp, others

#### Integration Pattern
**Method:** Read-only API integration + flow orchestration

**Capabilities:**
1. **Deliverability Monitoring** (read-only)
   - Pull bounce rates, spam complaints via API
   - Endpoint: `GET /api/v2/metrics/aggregate`
   - Frequency: Hourly batch job

2. **Flow Orchestration** (write)
   - Trigger lifecycle flows via API
   - Endpoint: `POST /api/v2/flows/{flow_id}/messages`
   - Add customer to flow, ESP handles delivery

3. **Flow State Tracking** (webhooks)
   - Subscribe to ESP webhooks: `email_sent`, `email_opened`, `email_clicked`
   - Track customer journey state in our database
   - Calculate RPR (revenue-per-recipient)

**Klaviyo Implementation Example:**

```typescript
// Deliverability check (hourly job)
async function checkDeliverabilityHealth(merchantId: string) {
  const integration = await getESPIntegration(merchantId, 'klaviyo');

  const metrics = await klaviyoAPI.getMetrics({
    startDate: subDays(new Date(), 7),
    endDate: new Date(),
    metrics: ['bounced', 'bounced_permanently', 'spam_complaint']
  });

  const hardBounceRate = metrics.bounced_permanently / metrics.sent;
  const softBounceRate = (metrics.bounced - metrics.bounced_permanently) / metrics.sent;
  const spamRate = metrics.spam_complaint / metrics.sent;

  // Evaluate gates (see Section 6)
  await evaluateDeliverabilityGate(merchantId, {
    hardBounceRate,
    softBounceRate,
    spamRate
  });
}

// Trigger abandoned cart flow
async function triggerAbandonedCartFlow(
  merchantId: string,
  customerId: string,
  cartData: CartData
) {
  const integration = await getESPIntegration(merchantId, 'klaviyo');
  const flowId = await getFlowId(merchantId, 'abandoned_cart');

  await klaviyoAPI.triggerFlow({
    flowId,
    email: cartData.customer.email,
    customProperties: {
      cart_url: cartData.checkout_url,
      cart_value: cartData.total_price,
      items: cartData.line_items
    }
  });

  // Track that we triggered this flow
  await db.query(`
    INSERT INTO flow_triggers (merchant_id, flow_type, customer_id, triggered_at)
    VALUES ($1, $2, $3, NOW())
  `, [merchantId, 'abandoned_cart', customerId]);
}
```

**Rate Limiting:**
- Per-tenant queue (see 4.1)
- Klaviyo: varies by plan (track per merchant)
- Adaptive backoff on 429 responses
- Circuit breaker after 5 consecutive failures

**Graceful Degradation:**
- If ESP disconnected: disable email-dependent features
- Show integration health banner in dashboard
- Lifecycle flows pause (don't delete state)
- Continue showing Shopify analytics and CRO features
- Alert merchant with reconnection instructions

### 4.3 CRO Tool Integration (Heatmaps & Session Recording)

#### Recommended Tools
**Primary:** Microsoft Clarity (free, generous limits)
**Alternative:** Hotjar (established, paid)

**Integration Type:** Read-only API (pull insights)

**Capabilities:**
- Detect rage clicks, dead clicks
- Pull session recording URLs for checkout abandonment events
- Aggregate heatmap data for money pages (homepage, PDP, checkout)

**Implementation Approach:**
```typescript
// Check if merchant has Clarity installed
async function checkCROToolInstallation(merchantId: string) {
  const merchant = await getMerchant(merchantId);
  const storefront = await fetchStorefrontHTML(merchant.shopifyDomain);

  // Look for Clarity tracking snippet
  const hasClarityPixel = storefront.includes('clarity.ms');

  if (!hasClarityPixel) {
    return {
      installed: false,
      recommendation: 'Install Microsoft Clarity for CRO insights',
      setupGuideUrl: '/docs/clarity-setup'
    };
  }

  return { installed: true };
}

// Pull rage click data for checkout pages
async function getCROInsights(merchantId: string) {
  const integration = await getCROIntegration(merchantId);

  if (integration.provider === 'clarity') {
    const rageClicks = await clarityAPI.getRageClicks({
      projectId: integration.projectId,
      startDate: subDays(new Date(), 7),
      pageFilter: '/checkout'
    });

    return {
      checkoutFrictionPoints: rageClicks.map(rc => ({
        element: rc.selector,
        occurrences: rc.count,
        sessionUrls: rc.sessions.map(s => s.recordingUrl)
      }))
    };
  }
}
```

**No Integration Fallback:**
- CRO observation phase shows "Recommended Setup" instead of metrics
- Provide one-click guide to install Clarity
- Framework phase can be marked complete without CRO tool (with warning)
- Focus on checkout abandonment rate as proxy metric

### 4.4 Integration Management UI

**Unified Integration Hub:**
```
/dashboard/integrations

┌─────────────────────────────────────────┐
│  Integrations                            │
├─────────────────────────────────────────┤
│                                          │
│  ✅ Shopify                              │
│     Connected: mystore.myshopify.com     │
│     Last sync: 2 minutes ago             │
│     [View Details] [Disconnect]          │
│                                          │
│  ✅ Klaviyo                              │
│     Connected: API Key ending in ...xyz  │
│     Last sync: 15 minutes ago            │
│     Deliverability: ✅ Healthy           │
│     [View Details] [Disconnect]          │
│                                          │
│  ⚠️  CRO Tools (Recommended)             │
│     Not connected                        │
│     [Setup Microsoft Clarity] [Learn More]│
│                                          │
│  Connection Health                       │
│  ┌────────────────────────────────────┐ │
│  │ All integrations operational       │ │
│  │ Last health check: 5 min ago       │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Health Monitoring:**
- Background job checks integration health every 15 minutes
- Track: last successful API call, error rate, rate limit status
- Status states: `healthy`, `degraded`, `failed`, `disconnected`
- Show health badge in main navigation if any integration unhealthy

---

## 5. Segmentation & Journey Engine

### 5.1 Segment Types

#### Pre-Purchase vs Post-Purchase
**Definition:**
- **Post-purchase:** Customer has at least one completed order (permanent status)
- **Pre-purchase:** Customer exists in Shopify but has never completed an order

**Storage:** Computed field on `customers` table

```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY,
  merchant_id UUID NOT NULL,
  shopify_customer_id BIGINT,
  email VARCHAR(255),
  is_post_purchase BOOLEAN DEFAULT FALSE,
  first_purchase_at TIMESTAMPTZ,
  last_purchase_at TIMESTAMPTZ,
  total_orders INTEGER DEFAULT 0,
  lifetime_value DECIMAL(10,2) DEFAULT 0,
  -- ...
);

-- Update on order webhook
UPDATE customers
SET
  is_post_purchase = TRUE,
  first_purchase_at = COALESCE(first_purchase_at, $1),
  last_purchase_at = $1,
  total_orders = total_orders + 1,
  lifetime_value = lifetime_value + $2
WHERE merchant_id = $3 AND shopify_customer_id = $4;
```

**Event-Driven Updates:**
- `orders/create` webhook triggers update
- Once `is_post_purchase = TRUE`, never reverts to FALSE
- Pre-computed, cached value (no runtime calculation)

#### Product Progression Segments

**Configuration Model:**
```typescript
interface ProductLadder {
  merchantId: string;
  steps: Array<{
    stepNumber: number; // 1, 2, 3
    productIds: string[]; // Shopify product IDs
    name: string; // e.g., "Starter Kit", "Premium Bundle"
  }>;
}

// Example:
{
  merchantId: "abc-123",
  steps: [
    { stepNumber: 1, productIds: ["123", "456"], name: "Entry Product" },
    { stepNumber: 2, productIds: ["789"], name: "Mid-Tier" },
    { stepNumber: 3, productIds: ["999"], name: "Premium" }
  ]
}
```

**Customer Progression State:**
```sql
CREATE TABLE customer_product_progression (
  customer_id UUID REFERENCES customers(id),
  merchant_id UUID NOT NULL,
  current_step INTEGER DEFAULT 0, -- 0 = no purchases, 1-3 = on ladder
  highest_step_reached INTEGER DEFAULT 0,
  last_step_purchase_at TIMESTAMPTZ,

  PRIMARY KEY (customer_id)
);

-- Update on order
-- Check if ordered products are in ladder
-- Determine step, update customer progression
```

**Merchant Configuration UI:**
```
/dashboard/settings/product-ladder

┌─────────────────────────────────────────┐
│  Product Ladder Configuration           │
├─────────────────────────────────────────┤
│                                          │
│  Step 1: Entry Product                   │
│  [Select Products ▼] (2 selected)        │
│  - Starter Serum ($29)                   │
│  - Trial Kit ($19)                       │
│                                          │
│  Step 2: Mid-Tier                        │
│  [Select Products ▼] (1 selected)        │
│  - Premium Set ($79)                     │
│                                          │
│  Step 3: Premium                         │
│  [Select Products ▼] (1 selected)        │
│  - Ultimate Collection ($199)            │
│                                          │
│  [+ Add Step] [Save]                     │
│                                          │
│  💡 Tip: Arrange products from entry to  │
│  premium to enable smart cross-sell      │
│  messaging in lifecycle flows.           │
└─────────────────────────────────────────┘
```

**Use Cases:**
- Email flows can reference "next step" products
- Dashboard shows customer distribution across ladder
- Upsell prompts target step N → step N+1

### 5.2 Reactivation Windows

**Calculation Logic:**
```typescript
async function calculateReactivationWindow(merchantId: string): Promise<number> {
  // Calculate median days between purchases from historical data
  const result = await db.query(`
    WITH purchase_gaps AS (
      SELECT
        customer_id,
        created_at - LAG(created_at) OVER (
          PARTITION BY customer_id
          ORDER BY created_at
        ) AS gap
      FROM orders
      WHERE merchant_id = $1
        AND created_at > NOW() - INTERVAL '12 months'
    )
    SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY gap) AS median_gap
    FROM purchase_gaps
    WHERE gap IS NOT NULL
  `, [merchantId]);

  const medianDays = result.rows[0]?.median_gap?.days;

  // Fallback to 90 days if insufficient data
  if (!medianDays || medianDays < 7 || medianDays > 365) {
    return 90;
  }

  return Math.round(medianDays);
}

// Store in merchant settings
interface MerchantSettings {
  reactivationWindowDays: number; // Auto-calculated
  reactivationWindowOverride?: number; // Optional manual override
}
```

**Reactivation Segment Identification:**
```sql
-- Customers due for reactivation
SELECT c.* FROM customers c
WHERE c.merchant_id = $1
  AND c.is_post_purchase = TRUE
  AND c.last_purchase_at < (NOW() - INTERVAL '1 day' * $2) -- $2 = reactivation window
  AND NOT EXISTS (
    SELECT 1 FROM flow_triggers ft
    WHERE ft.customer_id = c.id
      AND ft.flow_type = 'win_back'
      AND ft.triggered_at > (NOW() - INTERVAL '30 days') -- Don't spam
  );
```

### 5.3 Flow State Tracking

**Database Model:**
```sql
CREATE TABLE flow_executions (
  id UUID PRIMARY KEY,
  merchant_id UUID NOT NULL,
  customer_id UUID REFERENCES customers(id),
  flow_type VARCHAR(50), -- 'welcome', 'abandoned_cart', 'win_back', etc.
  esp_flow_id VARCHAR(255), -- Klaviyo flow ID
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'failed'

  -- Track email sequence progress
  current_step INTEGER DEFAULT 1,
  total_steps INTEGER,

  -- Track outcomes
  emails_sent INTEGER DEFAULT 0,
  emails_opened INTEGER DEFAULT 0,
  emails_clicked INTEGER DEFAULT 0,
  revenue_attributed DECIMAL(10,2) DEFAULT 0,

  completed_at TIMESTAMPTZ,

  UNIQUE(customer_id, flow_type, triggered_at)
);

-- Track individual email events from ESP webhooks
CREATE TABLE flow_email_events (
  id UUID PRIMARY KEY,
  flow_execution_id UUID REFERENCES flow_executions(id),
  esp_event_id VARCHAR(255) UNIQUE,
  event_type VARCHAR(50), -- 'sent', 'delivered', 'opened', 'clicked', 'bounced'
  occurred_at TIMESTAMPTZ,
  metadata JSONB -- Click URL, bounce reason, etc.
);
```

**ESP Webhook Processing:**
```typescript
// Klaviyo webhook handler
async function handleKlaviyoEmailEvent(payload: KlaviyoWebhook) {
  const eventId = payload.id;

  // Dedupe check
  const existing = await db.query(
    'SELECT 1 FROM flow_email_events WHERE esp_event_id = $1',
    [eventId]
  );
  if (existing.rows.length > 0) return;

  // Find associated flow execution
  // Match by customer email + recent trigger
  const flowExecution = await findFlowExecution(
    payload.data.email,
    payload.event
  );

  if (!flowExecution) {
    logger.warn('No flow execution found for ESP event', { eventId });
    return;
  }

  // Store event
  await db.query(`
    INSERT INTO flow_email_events (
      flow_execution_id, esp_event_id, event_type, occurred_at, metadata
    ) VALUES ($1, $2, $3, $4, $5)
  `, [
    flowExecution.id,
    eventId,
    payload.event,
    payload.timestamp,
    payload.data
  ]);

  // Update flow execution stats
  await db.query(`
    UPDATE flow_executions
    SET emails_opened = emails_opened + $1,
        emails_clicked = emails_clicked + $2
    WHERE id = $3
  `, [
    payload.event === 'opened' ? 1 : 0,
    payload.event === 'clicked' ? 1 : 0,
    flowExecution.id
  ]);
}
```

---

## 6. Gate System & Enforcement

### 6.1 Gate Types

#### Deliverability Gate
**Thresholds (from PRD):**
- Hard bounce rate ≤ 0.5% (FAIL if exceeded)
- Soft bounce rate: warning at 3%, FAIL at ≥5%
- Spam complaint rate ≤ 0.1% (FAIL if exceeded)

**Evaluation:**
```typescript
enum GateStatus {
  PASS = 'pass',
  WARNING = 'warning',
  FAIL = 'fail',
  GRACE_PERIOD = 'grace_period'
}

interface DeliverabilityGateResult {
  status: GateStatus;
  hardBounceRate: number;
  softBounceRate: number;
  spamComplaintRate: number;
  failedAt?: Date;
  gracePeriodEndsAt?: Date;
  blockedFeatures: string[]; // ['promotions', 'campaigns']
}

async function evaluateDeliverabilityGate(
  merchantId: string,
  metrics: {
    hardBounceRate: number;
    softBounceRate: number;
    spamRate: number;
  }
): Promise<DeliverabilityGateResult> {
  const { hardBounceRate, softBounceRate, spamRate } = metrics;

  let status = GateStatus.PASS;
  let blockedFeatures: string[] = [];

  // Check thresholds
  const hardBounceFail = hardBounceRate > 0.005; // 0.5%
  const softBounceFail = softBounceRate >= 0.05; // 5%
  const softBounceWarn = softBounceRate >= 0.03; // 3%
  const spamFail = spamRate > 0.001; // 0.1%

  if (hardBounceFail || softBounceFail || spamFail) {
    // Check if already in grace period
    const existingGate = await getGateState(merchantId, 'deliverability');

    if (!existingGate || existingGate.status !== GateStatus.GRACE_PERIOD) {
      // First failure - enter 24h grace period
      status = GateStatus.GRACE_PERIOD;
      const gracePeriodEndsAt = addHours(new Date(), 24);

      await saveGateState(merchantId, 'deliverability', {
        status,
        gracePeriodEndsAt,
        failedAt: new Date(),
        metrics
      });

      // Send warning alert
      await sendAlert(merchantId, {
        type: 'deliverability_warning',
        message: 'Deliverability gate entered grace period. Fix within 24h.',
        metrics
      });

    } else if (new Date() > existingGate.gracePeriodEndsAt) {
      // Grace period expired - hard fail
      status = GateStatus.FAIL;
      blockedFeatures = ['promotions', 'campaigns'];

      await saveGateState(merchantId, 'deliverability', {
        status,
        metrics
      });

      // Send critical alert
      await sendAlert(merchantId, {
        type: 'deliverability_critical',
        severity: 'critical',
        message: 'Deliverability gate FAILED. Promotions blocked.',
        metrics
      });
    }

  } else if (softBounceWarn) {
    status = GateStatus.WARNING;
  } else {
    // Clear any existing gate state
    await clearGateState(merchantId, 'deliverability');
  }

  return {
    status,
    hardBounceRate,
    softBounceRate,
    spamComplaintRate: spamRate,
    blockedFeatures,
    ...existingGate
  };
}
```

#### Funnel Throughput Gate
**Thresholds (from PRD):**
- Acceptable variance: ±10% WoW (week-over-week)
- Critical trigger: Conversion rate <2% for 3 consecutive business days

**Evaluation:**
```typescript
async function evaluateFunnelThroughputGate(
  merchantId: string
): Promise<GateResult> {
  const merchant = await getMerchant(merchantId);

  // Get last 3 business days of conversion rates
  const recentCRs = await getConversionRates(merchantId, {
    days: 3,
    businessDaysOnly: true, // Mon-Fri only
    timezone: merchant.timezone
  });

  // Check critical threshold: CR < 2% for 3 consecutive business days
  const allBelowThreshold = recentCRs.every(day => day.conversionRate < 0.02);

  if (allBelowThreshold) {
    return {
      status: GateStatus.FAIL,
      message: 'Conversion rate below 2% for 3 consecutive business days',
      blockedFeatures: ['paid_acquisition_scaling'],
      recommendation: 'Review funnel for friction points before scaling traffic'
    };
  }

  // Check WoW variance
  const thisWeek = await getWeeklyConversionRate(merchantId, 0); // Current week
  const lastWeek = await getWeeklyConversionRate(merchantId, 1); // Last week

  const variance = Math.abs(thisWeek - lastWeek) / lastWeek;

  if (variance > 0.10) { // 10% threshold
    return {
      status: GateStatus.WARNING,
      message: `Conversion rate variance ${(variance * 100).toFixed(1)}% WoW`,
      recommendation: 'Monitor funnel stability before scaling'
    };
  }

  return { status: GateStatus.PASS };
}
```

#### Paid Acquisition Gate (Composite)
**Requirements:** All must pass before paid acquisition scaling allowed
1. Deliverability gate: PASS
2. Funnel throughput gate: PASS
3. CRO issues addressed (warning only, not blocking)
4. Offer margin validated

```typescript
async function evaluatePaidAcquisitionGate(
  merchantId: string
): Promise<GateResult> {
  const deliverability = await evaluateDeliverabilityGate(merchantId);
  const funnelThroughput = await evaluateFunnelThroughputGate(merchantId);
  const offerMargin = await checkOfferMarginValidation(merchantId);

  const blockedBy: string[] = [];

  if (deliverability.status === GateStatus.FAIL) {
    blockedBy.push('Deliverability gate failed');
  }

  if (funnelThroughput.status === GateStatus.FAIL) {
    blockedBy.push('Funnel throughput unstable');
  }

  if (!offerMargin.validated) {
    blockedBy.push('Offer margin not validated');
  }

  if (blockedBy.length > 0) {
    return {
      status: GateStatus.FAIL,
      message: 'Paid acquisition blocked',
      blockedBy,
      recommendation: 'Complete earlier framework phases first'
    };
  }

  return { status: GateStatus.PASS };
}
```

### 6.2 Gate Enforcement in UI

#### Hard Block with Override Capability

**Example: Promotion Creation Flow**
```typescript
// Backend: Check gate before allowing promotion creation
POST /api/promotions

async function createPromotion(req, res) {
  const { merchantId } = req.auth;

  // Evaluate gate
  const gate = await evaluateDeliverabilityGate(merchantId);

  if (gate.status === GateStatus.FAIL && !req.body.overrideGate) {
    return res.status(403).json({
      error: 'Gate violation',
      gateType: 'deliverability',
      message: 'Deliverability gate failed. Promotions are blocked.',
      metrics: {
        hardBounceRate: gate.hardBounceRate,
        threshold: 0.005
      },
      canOverride: true, // Allow override with confirmation
      overrideWarning: 'Proceeding may damage sender reputation and reduce revenue.'
    });
  }

  if (req.body.overrideGate) {
    // Log override for analytics
    await logGateOverride(merchantId, 'deliverability', {
      userId: req.auth.userId,
      reason: req.body.overrideReason,
      timestamp: new Date()
    });
  }

  // Proceed with promotion creation
  // ...
}
```

**Frontend UI:**
```typescript
// Promotion creation page shows gate status

function PromotionCreatePage() {
  const gateStatus = useGateStatus('deliverability');

  if (gateStatus.status === 'fail') {
    return (
      <div className="gate-blocker">
        <Alert severity="error">
          <h3>🚫 Promotions Blocked</h3>
          <p>Deliverability gate failed:</p>
          <ul>
            <li>Hard bounce rate: {(gateStatus.hardBounceRate * 100).toFixed(2)}%
                (threshold: 0.5%)</li>
          </ul>
          <p>
            Sending promotions now may damage your sender reputation
            and reduce revenue.
          </p>

          <Button onClick={handleFixDeliverability}>
            Fix Deliverability Issues
          </Button>

          <details>
            <summary>I understand the risks (Advanced)</summary>
            <p>
              Only proceed if you have a specific reason and understand
              the consequences.
            </p>
            <TextField
              label="Reason for override"
              value={overrideReason}
              onChange={e => setOverrideReason(e.target.value)}
            />
            <Button
              variant="outlined"
              color="warning"
              onClick={handleOverrideGate}
              disabled={!overrideReason}
            >
              Override Gate & Proceed Anyway
            </Button>
          </details>
        </Alert>
      </div>
    );
  }

  // Normal promotion creation UI
  return <PromotionForm />;
}
```

### 6.3 Progressive Disclosure (Phase-Based UI)

**Implementation:**
```typescript
// Determine merchant's current phase based on gate completion
async function getCurrentPhase(merchantId: string): Promise<Phase> {
  const completedPhases = await getCompletedPhases(merchantId);

  const phaseOrder = [
    'deliverability',
    'core_flows',
    'segmentation',
    'conversion_measurement',
    'cro_observation',
    'revenue_activation',
    'offer_construction',
    'paid_acquisition'
  ];

  // Find first incomplete phase
  for (const phase of phaseOrder) {
    if (!completedPhases.includes(phase)) {
      return phase;
    }
  }

  // All phases complete
  return 'ongoing_optimization';
}

// Dashboard navigation only shows current + completed phases
function DashboardNav() {
  const currentPhase = useCurrentPhase();
  const completedPhases = useCompletedPhases();

  const phases = [
    { id: 'deliverability', label: 'Deliverability', icon: '📧' },
    { id: 'core_flows', label: 'Lifecycle Flows', icon: '🔄' },
    { id: 'segmentation', label: 'Segmentation', icon: '👥' },
    // ...
  ];

  return (
    <nav>
      {phases.map(phase => {
        const isCompleted = completedPhases.includes(phase.id);
        const isCurrent = phase.id === currentPhase;
        const isLocked = !isCompleted && !isCurrent;

        return (
          <NavItem
            key={phase.id}
            icon={phase.icon}
            label={phase.label}
            status={isCompleted ? 'completed' : isCurrent ? 'current' : 'locked'}
            disabled={isLocked}
            to={isLocked ? null : `/dashboard/${phase.id}`}
          />
        );
      })}
    </nav>
  );
}
```

---

## 7. Metrics & Analytics Pipeline

### 7.1 Baseline Calculation

**Requirements:**
- 14-30 day lookback window
- Exclude anomaly days (>2 standard deviations)
- Compare same day-of-week (Monday to Monday)
- Mark as "provisional" until 30 days of data

**Implementation:**
```typescript
async function calculateRevenueBaseline(
  merchantId: string,
  options: {
    lookbackDays?: number; // Default 30
    excludeAnomalies?: boolean; // Default true
  } = {}
): Promise<RevenueBaseline> {
  const { lookbackDays = 30, excludeAnomalies = true } = options;

  // Fetch daily revenue for lookback period
  const dailyRevenue = await db.query(`
    SELECT
      DATE_TRUNC('day', created_at AT TIME ZONE $2) AS date,
      SUM(revenue) AS revenue,
      EXTRACT(DOW FROM created_at AT TIME ZONE $2) AS day_of_week
    FROM orders
    WHERE merchant_id = $1
      AND created_at >= (NOW() - INTERVAL '1 day' * $3)
      AND created_at < DATE_TRUNC('day', NOW() AT TIME ZONE $2)
    GROUP BY date, day_of_week
    ORDER BY date DESC
  `, [merchantId, merchant.timezone, lookbackDays]);

  let dataPoints = dailyRevenue.rows;

  // Exclude anomalies using statistical outlier detection
  if (excludeAnomalies) {
    const revenues = dataPoints.map(d => d.revenue);
    const mean = revenues.reduce((a, b) => a + b, 0) / revenues.length;
    const variance = revenues.reduce((sum, val) =>
      sum + Math.pow(val - mean, 2), 0) / revenues.length;
    const stdDev = Math.sqrt(variance);

    const lowerBound = mean - (2 * stdDev);
    const upperBound = mean + (2 * stdDev);

    const excluded = dataPoints.filter(d =>
      d.revenue < lowerBound || d.revenue > upperBound
    );

    dataPoints = dataPoints.filter(d =>
      d.revenue >= lowerBound && d.revenue <= upperBound
    );

    logger.info('Excluded anomaly days from baseline', {
      merchantId,
      excludedDates: excluded.map(d => d.date),
      threshold: { lowerBound, upperBound }
    });
  }

  // Calculate baseline per day-of-week
  const baselineByDOW = {};
  for (let dow = 0; dow < 7; dow++) { // 0 = Sunday, 6 = Saturday
    const dowData = dataPoints.filter(d => d.day_of_week === dow);
    if (dowData.length > 0) {
      baselineByDOW[dow] =
        dowData.reduce((sum, d) => sum + d.revenue, 0) / dowData.length;
    }
  }

  const isProvisional = dataPoints.length < 30;

  return {
    merchantId,
    baselineByDayOfWeek: baselineByDOW,
    calculatedAt: new Date(),
    lookbackDays,
    dataPointsUsed: dataPoints.length,
    anomaliesExcluded: excludeAnomalies,
    isProvisional,
    provisionalReason: isProvisional ?
      `Only ${dataPoints.length} days of data available. Need 30 for accurate baseline.` :
      null
  };
}

// Compare current performance to baseline
async function compareToBaseline(
  merchantId: string,
  date: Date
): Promise<BaselineComparison> {
  const baseline = await getOrCalculateBaseline(merchantId);

  const dayOfWeek = date.getDay(); // 0-6
  const expectedRevenue = baseline.baselineByDayOfWeek[dayOfWeek];

  const actualRevenue = await getRevenueForDate(merchantId, date);

  const lift = (actualRevenue - expectedRevenue) / expectedRevenue;

  return {
    date,
    actualRevenue,
    expectedRevenue,
    lift: lift * 100, // Percentage
    isProvisional: baseline.isProvisional
  };
}
```

### 7.2 Hourly ETL Pipeline

**Schedule:** Every hour at :00

**Job Flow:**
```
┌─────────────────────────────────────────────────┐
│ Hourly ETL Job (runs at :00 of each hour)      │
└─────────┬───────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────┐
│ 1. Load checkpoint (last processed event ID)    │
└─────────┬───────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────┐
│ 2. Query OLTP DB for new events since checkpoint│
│    SELECT * FROM events WHERE id > $checkpoint  │
│    ORDER BY id ASC LIMIT 10000                  │
└─────────┬───────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────┐
│ 3. Transform events into analytics fact tables  │
│    - Daily revenue aggregates                   │
│    - Funnel step counts                         │
│    - Customer segment updates                   │
└─────────┬───────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────┐
│ 4. Write to OLAP database (analytics DB)        │
│    - Upsert daily aggregates                    │
│    - Insert new facts                           │
└─────────┬───────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────┐
│ 5. Update checkpoint to last processed event ID │
└─────────┬───────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────┐
│ 6. Update materialized views & cache            │
│    REFRESH MATERIALIZED VIEW daily_metrics;     │
└─────────────────────────────────────────────────┘
```

**Idempotent Processing:**
```typescript
interface ETLCheckpoint {
  merchantId: string;
  lastProcessedEventId: string;
  lastProcessedAt: Date;
}

async function runHourlyETL() {
  const merchants = await getActiveMerchants();

  for (const merchant of merchants) {
    try {
      await processETLForMerchant(merchant.id);
    } catch (error) {
      logger.error('ETL failed for merchant', {
        merchantId: merchant.id,
        error
      });
      // Continue with other merchants
    }
  }
}

async function processETLForMerchant(merchantId: string) {
  // 1. Load checkpoint
  const checkpoint = await getETLCheckpoint(merchantId) || {
    lastProcessedEventId: '0',
    lastProcessedAt: new Date(0)
  };

  // 2. Fetch new events from OLTP
  const events = await db.query(`
    SELECT * FROM events
    WHERE merchant_id = $1
      AND id > $2
    ORDER BY id ASC
    LIMIT 10000
  `, [merchantId, checkpoint.lastProcessedEventId]);

  if (events.rows.length === 0) {
    logger.info('No new events to process', { merchantId });
    return;
  }

  // 3 & 4. Transform and load to OLAP
  const transaction = await analyticsDB.beginTransaction();

  try {
    for (const event of events.rows) {
      await processEvent(event, transaction);
    }

    // 5. Update checkpoint
    const newCheckpoint = events.rows[events.rows.length - 1].id;
    await saveETLCheckpoint(merchantId, {
      lastProcessedEventId: newCheckpoint,
      lastProcessedAt: new Date()
    }, transaction);

    await transaction.commit();

    logger.info('ETL completed', {
      merchantId,
      eventsProcessed: events.rows.length,
      newCheckpoint
    });

  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function processEvent(event: Event, transaction: Transaction) {
  switch (event.type) {
    case 'order_created':
      await upsertDailyRevenue(event, transaction);
      await updateFunnelMetrics(event, transaction);
      await updateCustomerLTV(event, transaction);
      break;

    case 'checkout_created':
      await incrementFunnelStep('checkout', event, transaction);
      break;

    // ... other event types
  }
}

async function upsertDailyRevenue(event: OrderEvent, tx: Transaction) {
  await tx.query(`
    INSERT INTO daily_revenue_metrics (
      merchant_id, date, device_type, revenue, order_count
    )
    VALUES ($1, $2, $3, $4, 1)
    ON CONFLICT (merchant_id, date, device_type)
    DO UPDATE SET
      revenue = daily_revenue_metrics.revenue + EXCLUDED.revenue,
      order_count = daily_revenue_metrics.order_count + 1
  `, [
    event.merchantId,
    truncateToDay(event.createdAt),
    event.deviceType,
    event.revenue
  ]);
}
```

### 7.3 Dashboard Query Optimization

**Materialized Views:**
```sql
-- Pre-aggregated daily metrics for fast dashboard queries
CREATE MATERIALIZED VIEW daily_metrics AS
SELECT
  merchant_id,
  date,
  SUM(revenue) AS total_revenue,
  SUM(order_count) AS total_orders,
  SUM(CASE WHEN device_type = 'mobile' THEN revenue ELSE 0 END) AS mobile_revenue,
  SUM(CASE WHEN device_type = 'desktop' THEN revenue ELSE 0 END) AS desktop_revenue,
  SUM(sessions) AS total_sessions,
  SUM(add_to_cart) AS total_atc,
  SUM(checkout_initiated) AS total_checkouts,
  -- Conversion rate calculation
  CASE
    WHEN SUM(sessions) > 0
    THEN SUM(order_count)::DECIMAL / SUM(sessions)
    ELSE 0
  END AS conversion_rate
FROM daily_revenue_metrics
GROUP BY merchant_id, date;

-- Refresh hourly after ETL
CREATE UNIQUE INDEX ON daily_metrics (merchant_id, date);
```

**Query Example:**
```typescript
// Fast dashboard query using materialized view
async function getMonthlyPerformance(merchantId: string) {
  const result = await analyticsDB.query(`
    SELECT
      date,
      total_revenue,
      total_orders,
      conversion_rate,
      mobile_revenue / NULLIF(total_revenue, 0) AS mobile_revenue_pct
    FROM daily_metrics
    WHERE merchant_id = $1
      AND date >= CURRENT_DATE - INTERVAL '30 days'
    ORDER BY date DESC
  `, [merchantId]);

  return result.rows;
}
```

---

## 8. UTM Tracking & Attribution

### 8.1 UTM Generation

**Namespace Strategy:** `utm_source=iceberg-method`

**Implementation:**
```typescript
function generateEmailUTM(params: {
  flowType: string; // 'welcome', 'abandoned_cart', etc.
  merchantId: string;
  customerId: string;
}): URLSearchParams {
  return new URLSearchParams({
    utm_source: 'iceberg-method',
    utm_medium: 'email',
    utm_campaign: params.flowType,
    utm_content: params.customerId, // For per-customer tracking
    iceberg_flow_id: generateFlowTrackingId(params) // Our internal tracking
  });
}

// Append to product URLs in emails
function enrichEmailLinks(emailHTML: string, utmParams: URLSearchParams) {
  // Parse HTML, find all <a> tags with merchant store domain
  // Append UTM params
  const $ = cheerio.load(emailHTML);

  $('a[href]').each((i, elem) => {
    const href = $(elem).attr('href');
    if (isProductLink(href)) {
      const url = new URL(href);
      utmParams.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
      $(elem).attr('href', url.toString());
    }
  });

  return $.html();
}
```

### 8.2 Attribution Logic

**Last-Click Attribution:**
```typescript
// Shopify webhook includes referring_site and landing_site_ref
async function attributeOrder(order: ShopifyOrder) {
  const utmParams = parseUTMFromURL(order.landing_site_ref);

  if (utmParams.utm_source === 'iceberg-method') {
    // Order attributed to our email flows
    const flowType = utmParams.utm_campaign;
    const flowId = utmParams.iceberg_flow_id;

    // Link order to flow execution
    await db.query(`
      UPDATE flow_executions
      SET revenue_attributed = revenue_attributed + $1,
          status = 'completed',
          completed_at = NOW()
      WHERE id = $2
    `, [order.total_price, flowId]);

    return {
      attributionSource: 'iceberg_email',
      flowType,
      flowId
    };
  }

  // Other attribution logic for non-email sources
  return { attributionSource: 'other' };
}
```

### 8.3 Revenue Per Recipient (RPR)

**Calculation:**
```typescript
async function calculateRPR(
  merchantId: string,
  flowType: string,
  dateRange: { start: Date; end: Date }
): Promise<number> {
  const result = await db.query(`
    SELECT
      COUNT(DISTINCT fe.customer_id) AS recipients,
      SUM(fe.revenue_attributed) AS total_revenue
    FROM flow_executions fe
    WHERE fe.merchant_id = $1
      AND fe.flow_type = $2
      AND fe.triggered_at BETWEEN $3 AND $4
  `, [merchantId, flowType, dateRange.start, dateRange.end]);

  const { recipients, total_revenue } = result.rows[0];

  if (recipients === 0) return 0;

  return total_revenue / recipients;
}
```

---

## 9. Monday Ritual Dashboard

### 9.1 Auto-Generated Meeting Agenda

**Generation Logic:**
```typescript
async function generateMondayRitualReport(
  merchantId: string,
  weekEnding: Date // Sunday
): Promise<MondayRitualReport> {
  const merchant = await getMerchant(merchantId);
  const weekStart = subDays(weekEnding, 6); // Previous Monday

  // 1. Revenue vs Target
  const revenueData = await getWeeklyRevenue(merchantId, weekStart, weekEnding);
  const baseline = await getBaseline(merchantId);
  const expectedRevenue = calculateExpectedRevenue(baseline, weekStart, weekEnding);
  const revenueLift = (revenueData.actual - expectedRevenue) / expectedRevenue;

  // 2. Funnel Health
  const funnelMetrics = await getWeeklyFunnelMetrics(merchantId, weekStart, weekEnding);
  const funnelGate = await evaluateFunnelThroughputGate(merchantId);

  // 3. Lifecycle Performance
  const lifecycleRevenue = await getLifecycleRevenue(merchantId, weekStart, weekEnding);
  const postPurchasePct = lifecycleRevenue / revenueData.actual;

  // 4. CRO Issues
  const croIssues = await getCROIssues(merchantId);

  // 5. Gate Status
  const allGates = await evaluateAllGates(merchantId);

  return {
    weekRange: { start: weekStart, end: weekEnding },

    revenue: {
      actual: revenueData.actual,
      expected: expectedRevenue,
      lift: revenueLift * 100,
      status: revenueLift >= 0.20 ? 'target_met' : 'below_target'
    },

    funnel: {
      conversionRate: funnelMetrics.conversionRate,
      weekOverWeekChange: funnelMetrics.wowChange,
      status: funnelGate.status,
      bottleneck: identifyBottleneck(funnelMetrics)
    },

    lifecycle: {
      postPurchaseRevenue: lifecycleRevenue,
      postPurchasePct: postPurchasePct * 100,
      status: postPurchasePct >= 0.20 ? 'on_track' : 'below_target',
      topFlows: await getTopPerformingFlows(merchantId, weekStart, weekEnding)
    },

    croIssues: croIssues.slice(0, 5), // Top 5 issues

    gates: allGates,

    recommendations: generateRecommendations({
      revenueLift,
      postPurchasePct,
      funnelGate,
      croIssues
    })
  };
}
```

**PDF Export:**
```typescript
// Generate PDF using puppeteer or similar
async function exportMondayRitualPDF(
  merchantId: string,
  weekEnding: Date
): Promise<Buffer> {
  const report = await generateMondayRitualReport(merchantId, weekEnding);

  // Render React component to HTML
  const html = renderToString(<MondayRitualTemplate report={report} />);

  // Convert to PDF
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html);
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true
  });
  await browser.close();

  return pdf;
}
```

### 9.2 Primary Metric Display

**Post-Purchase Revenue % (Hero Metric):**
```tsx
function MondayRitualDashboard({ report }: { report: MondayRitualReport }) {
  return (
    <div className="monday-ritual">
      {/* Hero Metric */}
      <div className="hero-metric">
        <h1>Post-Purchase Revenue</h1>
        <div className="metric-value">
          {report.lifecycle.postPurchasePct.toFixed(1)}%
        </div>
        <div className="metric-context">
          of total revenue
        </div>

        <ProgressBar
          value={report.lifecycle.postPurchasePct}
          target={20}
          excellent={30}
        />

        <div className="target-indicator">
          Target: 20-30%
          {report.lifecycle.postPurchasePct >= 40 && (
            <Badge>🏆 Top Performer</Badge>
          )}
        </div>
      </div>

      {/* Revenue Lift */}
      <MetricCard
        title="Revenue Lift vs Baseline"
        value={`${report.revenue.lift >= 0 ? '+' : ''}${report.revenue.lift.toFixed(1)}%`}
        status={report.revenue.status}
        target="≥20%"
      />

      {/* Funnel Health */}
      <MetricCard
        title="Conversion Rate"
        value={`${(report.funnel.conversionRate * 100).toFixed(2)}%`}
        change={report.funnel.weekOverWeekChange}
        status={report.funnel.status}
      />

      {/* Lifecycle Breakdown */}
      <div className="lifecycle-breakdown">
        <h2>Top Performing Flows</h2>
        {report.lifecycle.topFlows.map(flow => (
          <FlowPerformanceRow key={flow.type} flow={flow} />
        ))}
      </div>

      {/* Recommendations */}
      <div className="recommendations">
        <h2>This Week's Focus</h2>
        {report.recommendations.map(rec => (
          <RecommendationCard key={rec.id} recommendation={rec} />
        ))}
      </div>
    </div>
  );
}
```

---

## 10. Alerting & Notifications

### 10.1 Alert Types

**Critical Alerts:**
- Deliverability gate failed (after grace period)
- Conversion rate <2% for 3 consecutive business days
- Shopify/ESP integration disconnected
- Data pipeline failure (ETL failed for >2 hours)

**Warning Alerts:**
- Deliverability gate in grace period
- Funnel variance >10% WoW
- High number of events in DLQ
- Rate limit approaching (>80% of quota)

**Informational:**
- Weekly Monday Ritual report ready
- Baseline recalculated
- New phase unlocked

### 10.2 Notification Channels

**Email:**
```typescript
async function sendEmailAlert(
  merchantId: string,
  alert: Alert
) {
  const merchant = await getMerchant(merchantId);

  await emailService.send({
    to: merchant.email,
    subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
    template: 'alert',
    data: {
      merchantName: merchant.name,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      actionUrl: `${process.env.APP_URL}/dashboard/alerts/${alert.id}`,
      actionLabel: alert.actionLabel || 'View Details'
    }
  });
}
```

**In-App Notifications:**
```typescript
// Store notifications in database
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  merchant_id UUID NOT NULL,
  type VARCHAR(50), -- 'gate_violation', 'integration_error', etc.
  severity VARCHAR(20), -- 'critical', 'warning', 'info'
  title VARCHAR(255),
  message TEXT,
  action_url VARCHAR(500),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

// API endpoint for frontend polling
GET /api/notifications?unread=true

// Real-time via WebSocket (optional)
io.to(`merchant:${merchantId}`).emit('notification', notification);
```

**Frontend Bell Icon:**
```tsx
function NotificationBell() {
  const { data: notifications } = useQuery('unreadNotifications',
    () => fetchUnreadNotifications()
  );

  const unreadCount = notifications?.length || 0;

  return (
    <Popover>
      <PopoverTrigger>
        <IconButton>
          <BellIcon />
          {unreadCount > 0 && <Badge>{unreadCount}</Badge>}
        </IconButton>
      </PopoverTrigger>
      <PopoverContent>
        <NotificationList notifications={notifications} />
      </PopoverContent>
    </Popover>
  );
}
```

---

## 11. Lifecycle Flow Templates

### 11.1 Template Library

**Provided Templates:**
1. Welcome / First-purchase onboarding
2. Abandoned checkout
3. Abandoned cart
4. Browse abandonment
5. Post-purchase education
6. Win-back / reactivation (nine-word email)

**Template Structure:**
```typescript
interface EmailTemplate {
  id: string;
  flowType: string;
  name: string;
  description: string;
  steps: Array<{
    stepNumber: number;
    delayHours: number;
    subject: string;
    bodyHTML: string;
    bodyPlaintext: string;
    variables: string[]; // e.g., ['customer.firstName', 'cart.total']
  }>;
  proven: boolean; // Tested, high-performing template
  conversionBenchmark?: number; // Expected conversion rate
}

const templates: EmailTemplate[] = [
  {
    id: 'nine-word-winback',
    flowType: 'win_back',
    name: 'Nine-Word Email (Reactivation)',
    description: 'Proven low-friction reactivation prompt. High response rate.',
    steps: [
      {
        stepNumber: 1,
        delayHours: 0,
        subject: 'Quick question',
        bodyHTML: `
          <p>Hey {{customer.firstName}},</p>
          <p>Are you still interested in [your product category]?</p>
          <p>- {{merchant.name}}</p>
        `,
        bodyPlaintext: `
          Hey {{customer.firstName}},

          Are you still interested in [your product category]?

          - {{merchant.name}}
        `,
        variables: ['customer.firstName', 'merchant.name']
      }
    ],
    proven: true,
    conversionBenchmark: 0.08 // 8% typical response rate
  },

  {
    id: 'abandoned-cart-3step',
    flowType: 'abandoned_cart',
    name: 'Abandoned Cart (3-Step Sequence)',
    description: 'Standard high-converting cart recovery sequence.',
    steps: [
      {
        stepNumber: 1,
        delayHours: 1,
        subject: 'You left something behind...',
        bodyHTML: '<!-- Template HTML -->',
        bodyPlaintext: '<!-- Template plain -->',
        variables: ['customer.firstName', 'cart.items', 'cart.total', 'cart.checkoutUrl']
      },
      {
        stepNumber: 2,
        delayHours: 24,
        subject: 'Still thinking about it?',
        bodyHTML: '<!-- Template HTML -->',
        bodyPlaintext: '<!-- Template plain -->',
        variables: ['customer.firstName', 'cart.checkoutUrl']
      },
      {
        stepNumber: 3,
        delayHours: 72,
        subject: 'Last chance: Your cart expires soon',
        bodyHTML: '<!-- Template HTML -->',
        bodyPlaintext: '<!-- Template plain -->',
        variables: ['customer.firstName', 'cart.checkoutUrl']
      }
    ],
    proven: true,
    conversionBenchmark: 0.15 // 15% cart recovery rate
  }

  // ... other templates
];
```

### 11.2 Template Customization UI

```tsx
function TemplateEditor({ template }: { template: EmailTemplate }) {
  const [customizedTemplate, setCustomizedTemplate] = useState(template);

  return (
    <div className="template-editor">
      <div className="template-preview">
        <h3>Preview</h3>
        <EmailPreview html={customizedTemplate.steps[0].bodyHTML} />
      </div>

      <div className="template-controls">
        <TextField
          label="Subject Line"
          value={customizedTemplate.steps[0].subject}
          onChange={e => updateSubject(e.target.value)}
        />

        <RichTextEditor
          label="Email Body"
          value={customizedTemplate.steps[0].bodyHTML}
          onChange={updateBody}
          variables={template.steps[0].variables}
        />

        <div className="variable-helper">
          <h4>Available Variables</h4>
          <ul>
            {template.steps[0].variables.map(v => (
              <li key={v}>
                <code>{`{{${v}}}`}</code>
                <Button size="sm" onClick={() => insertVariable(v)}>
                  Insert
                </Button>
              </li>
            ))}
          </ul>
        </div>

        <Button onClick={saveTemplate}>Save Template</Button>
        <Button variant="secondary" onClick={resetToDefault}>
          Reset to Default
        </Button>
      </div>
    </div>
  );
}
```

---

## 12. Data Privacy & Security

### 12.1 Data Storage

**Sensitive Data:**
- Customer emails, phone numbers, names
- Purchase history
- Shopify access tokens
- ESP API keys

**Security Measures:**

**Encryption at Rest:**
```typescript
// Encrypt sensitive fields before storing
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32-byte key
const ALGORITHM = 'aes-256-gcm';

function encrypt(text: string): { encrypted: string; iv: string; tag: string } {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  };
}

// Store access tokens encrypted
async function storeShopifyToken(merchantId: string, accessToken: string) {
  const { encrypted, iv, tag } = encrypt(accessToken);

  await db.query(`
    INSERT INTO merchant_integrations (merchant_id, provider, encrypted_token, iv, auth_tag)
    VALUES ($1, 'shopify', $2, $3, $4)
  `, [merchantId, encrypted, iv, tag]);
}
```

**Access Controls:**
- Database connection requires TLS
- Application-level row-level security (merchant_id filtering)
- API authentication via JWT
- Rate limiting on all endpoints

### 12.2 Data Retention

**Policy (Minimal for MVP):**
- Active merchant data: retained indefinitely
- Churned merchant data: deleted 90 days after churn (with notice)
- Event logs: 12-month rolling retention
- Aggregated analytics: retained indefinitely (anonymized)

**Implementation:**
```typescript
// Daily cleanup job
async function cleanupChurnedMerchantData() {
  const churned = await db.query(`
    SELECT merchant_id, churned_at
    FROM merchants
    WHERE status = 'churned'
      AND churned_at < (NOW() - INTERVAL '90 days')
  `);

  for (const merchant of churned.rows) {
    logger.info('Deleting churned merchant data', {
      merchantId: merchant.merchant_id
    });

    // Delete in order (respect foreign keys)
    await db.query('DELETE FROM flow_executions WHERE merchant_id = $1', [merchant.merchant_id]);
    await db.query('DELETE FROM orders WHERE merchant_id = $1', [merchant.merchant_id]);
    await db.query('DELETE FROM customers WHERE merchant_id = $1', [merchant.merchant_id]);
    await db.query('DELETE FROM merchants WHERE id = $1', [merchant.merchant_id]);

    logger.info('Churned merchant data deleted', {
      merchantId: merchant.merchant_id
    });
  }
}
```

### 12.3 GDPR/CCPA Compliance (Post-MVP)

**Planned Capabilities:**
- Customer data export (via merchant dashboard)
- Customer data deletion requests
- Data processing agreements
- Cookie consent management

**Not in v1 scope** - implement based on legal requirements and customer geography.

---

## 13. Testing Strategy

### 13.1 Unit Tests

**Focus Areas:**
- Gate evaluation logic
- Baseline calculation
- Segmentation rules
- Revenue attribution
- Anomaly detection

**Example:**
```typescript
describe('DeliverabilityGate', () => {
  it('should pass when all metrics within thresholds', async () => {
    const result = await evaluateDeliverabilityGate('merchant-123', {
      hardBounceRate: 0.003, // 0.3% - below 0.5% threshold
      softBounceRate: 0.02,  // 2% - below 3% warning
      spamRate: 0.0005       // 0.05% - below 0.1% threshold
    });

    expect(result.status).toBe(GateStatus.PASS);
    expect(result.blockedFeatures).toHaveLength(0);
  });

  it('should enter grace period on first failure', async () => {
    const result = await evaluateDeliverabilityGate('merchant-123', {
      hardBounceRate: 0.008, // 0.8% - exceeds threshold
      softBounceRate: 0.02,
      spamRate: 0.0005
    });

    expect(result.status).toBe(GateStatus.GRACE_PERIOD);
    expect(result.gracePeriodEndsAt).toBeDefined();
  });

  it('should hard fail after grace period expires', async () => {
    // Set up existing grace period that expired
    await saveGateState('merchant-123', 'deliverability', {
      status: GateStatus.GRACE_PERIOD,
      gracePeriodEndsAt: subHours(new Date(), 1) // Expired 1 hour ago
    });

    const result = await evaluateDeliverabilityGate('merchant-123', {
      hardBounceRate: 0.008, // Still exceeds threshold
      softBounceRate: 0.02,
      spamRate: 0.0005
    });

    expect(result.status).toBe(GateStatus.FAIL);
    expect(result.blockedFeatures).toContain('promotions');
  });
});

describe('BaselineCalculation', () => {
  it('should calculate day-of-week averages correctly', async () => {
    // Set up test data: 4 weeks of revenue
    const testData = [
      { date: '2026-01-06', revenue: 1000, dow: 1 }, // Monday
      { date: '2026-01-13', revenue: 1200, dow: 1 }, // Monday
      { date: '2026-01-20', revenue: 1100, dow: 1 }, // Monday
      { date: '2026-01-27', revenue: 1300, dow: 1 }, // Monday
    ];

    await seedTestData('merchant-123', testData);

    const baseline = await calculateRevenueBaseline('merchant-123');

    expect(baseline.baselineByDayOfWeek[1]).toBeCloseTo(1150); // Average of Mondays
  });

  it('should exclude statistical outliers when enabled', async () => {
    const testData = [
      { date: '2026-01-06', revenue: 1000 },
      { date: '2026-01-07', revenue: 1100 },
      { date: '2026-01-08', revenue: 10000 }, // Outlier (Black Friday)
      { date: '2026-01-09', revenue: 1050 },
    ];

    await seedTestData('merchant-123', testData);

    const baseline = await calculateRevenueBaseline('merchant-123', {
      excludeAnomalies: true
    });

    // Outlier should be excluded from average
    const avgRevenue = (1000 + 1100 + 1050) / 3;
    expect(baseline.overallAverage).toBeCloseTo(avgRevenue);
  });
});
```

### 13.2 Integration Tests

**Focus Areas:**
- Shopify OAuth flow
- Shopify webhook processing
- Klaviyo API integration
- Rate limiting

**Example:**
```typescript
describe('ShopifyWebhookProcessing', () => {
  it('should process order webhook and update metrics', async () => {
    const webhook = {
      id: '12345',
      topic: 'orders/create',
      shop_domain: 'test-store.myshopify.com',
      payload: {
        id: 99999,
        total_price: '150.00',
        customer: { id: 11111, email: 'test@example.com' },
        created_at: '2026-01-31T12:00:00Z',
        client_details: { browser_width: 400 } // Mobile
      }
    };

    const hmac = generateShopifyHMAC(webhook);

    const response = await request(app)
      .post('/webhooks/shopify')
      .set('X-Shopify-Hmac-Sha256', hmac)
      .send(webhook)
      .expect(200);

    // Verify webhook queued
    const queued = await getQueuedJob(webhook.id);
    expect(queued).toBeDefined();

    // Process queue
    await processWebhookQueue();

    // Verify order stored
    const order = await db.query(
      'SELECT * FROM orders WHERE shopify_order_id = $1',
      [webhook.payload.id]
    );
    expect(order.rows).toHaveLength(1);
    expect(order.rows[0].revenue).toBe('150.00');
    expect(order.rows[0].device_type).toBe('mobile');
  });
});
```

---

## 14. Observability & Monitoring

### 14.1 Structured Logging

**Winston Configuration:**
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'iceberg-method',
    environment: process.env.NODE_ENV
  },
  transports: [
    new winston.transports.Console(),
    // PaaS platforms auto-collect stdout/stderr
  ]
});

// Add request context
logger.child({
  merchantId: req.merchantId,
  requestId: req.id
});
```

**Logging Standards:**
```typescript
// Good logging
logger.info('Gate evaluated', {
  merchantId,
  gateType: 'deliverability',
  status: result.status,
  metrics: {
    hardBounceRate: result.hardBounceRate,
    threshold: 0.005
  }
});

// Bad logging
logger.info('Gate check done'); // No context
```

### 14.2 Error Tracking

**Sentry Integration:**
```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // Sample 10% of transactions
});

// Attach merchant context to errors
Sentry.setContext('merchant', {
  id: merchant.id,
  plan: merchant.plan,
  createdAt: merchant.createdAt
});

// Capture exceptions
try {
  await processWebhook(data);
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      webhookTopic: data.topic,
      merchantId: data.merchantId
    }
  });
  throw error;
}
```

### 14.3 Custom Metrics

**Business Logic Monitoring:**
```typescript
// Track gate violations
interface MetricEvent {
  name: string;
  value: number;
  tags: Record<string, string>;
  timestamp: Date;
}

async function trackMetric(event: MetricEvent) {
  await db.query(`
    INSERT INTO internal_metrics (name, value, tags, timestamp)
    VALUES ($1, $2, $3, $4)
  `, [event.name, event.value, event.tags, event.timestamp]);
}

// Example usage
await trackMetric({
  name: 'gate.violation',
  value: 1,
  tags: {
    merchantId,
    gateType: 'deliverability',
    reason: 'hard_bounce_exceeded'
  },
  timestamp: new Date()
});

// Query metrics
async function getGateViolationRate(timeRange: { start: Date; end: Date }) {
  const result = await db.query(`
    SELECT
      COUNT(*) FILTER (WHERE name = 'gate.violation') AS violations,
      COUNT(*) FILTER (WHERE name = 'gate.evaluation') AS evaluations
    FROM internal_metrics
    WHERE timestamp BETWEEN $1 AND $2
  `, [timeRange.start, timeRange.end]);

  return result.rows[0].violations / result.rows[0].evaluations;
}
```

---

## 15. Deployment & CI/CD

### 15.1 Environment Configuration

**Environments:**
- Development (local)
- Staging (pre-production testing)
- Production

**Environment Variables:**
```bash
# Application
NODE_ENV=production
PORT=3000
APP_URL=https://app.icebergmethod.com

# Database
DATABASE_URL=postgresql://user:pass@host:5432/iceberg_prod
ANALYTICS_DATABASE_URL=postgresql://user:pass@host:5432/iceberg_analytics_prod

# Redis
REDIS_URL=redis://:password@host:6379

# Shopify
SHOPIFY_API_KEY=xxx
SHOPIFY_API_SECRET=xxx
SHOPIFY_SCOPES=read_orders,read_customers,read_products

# Klaviyo
KLAVIYO_API_KEY=xxx

# Security
JWT_SECRET=xxx
ENCRYPTION_KEY=xxx # 32-byte hex key

# Monitoring
SENTRY_DSN=xxx
LOG_LEVEL=info
```

### 15.2 Deployment Process

**Platform: Render / Railway (example with Render)**

**render.yaml:**
```yaml
services:
  # Web app (Next.js frontend + API)
  - type: web
    name: iceberg-web
    env: node
    buildCommand: npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: iceberg-postgres
          property: connectionString
      - key: REDIS_URL
        fromDatabase:
          name: iceberg-redis
          property: connectionString

  # Background workers
  - type: worker
    name: iceberg-workers
    env: node
    buildCommand: npm run build
    startCommand: npm run worker
    envVars:
      - key: NODE_ENV
        value: production

databases:
  - name: iceberg-postgres
    databaseName: iceberg_prod
    plan: standard

  - name: iceberg-postgres-analytics
    databaseName: iceberg_analytics_prod
    plan: standard

  - name: iceberg-redis
    plan: standard
```

**GitHub Actions CI/CD:**
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Render
        env:
          RENDER_API_KEY: ${{ secrets.RENDER_API_KEY }}
        run: |
          curl -X POST https://api.render.com/deploy/${{ secrets.RENDER_SERVICE_ID }}
```

---

## 16. Open Questions & Future Considerations

### 16.1 Deferred to Post-v1

**Features:**
- Multi-user team permissions (RBAC)
- Advanced GDPR tooling (data export, deletion)
- Multi-store support under one account
- SMS channel (Attentive integration)
- Additional ESP integrations (Mailchimp, Sendgrid)
- A/B testing framework for flows
- Predictive LTV modeling
- Advanced attribution (multi-touch)
- Mobile app

### 16.2 Performance Optimization (As Needed)

**When to Optimize:**
- Dashboard queries >2s
- Webhook processing lag >5min
- ETL job duration >30min
- DB queries causing lock contention

**Optimization Techniques:**
- Add read replicas for analytics queries
- Implement Redis caching for computed segments
- Partition large tables by merchant_id or date
- Move heavy analytics to ClickHouse
- CDN for static assets

### 16.3 Internationalization

**When to Build:**
- 5+ merchants outside US
- Specific customer request

**Requirements:**
- Multi-currency support in analytics
- Time zone edge cases (DST, etc.)
- Localized templates (non-English emails)
- Regional Shopify API differences

---

## 17. Success Metrics for Platform Itself

**Product KPIs:**
- **Time to First Value:** <15 minutes from signup to seeing baseline
- **Active Merchants:** Monthly active merchants using Monday Ritual
- **Gate Compliance Rate:** % of merchants following enforced sequence
- **Revenue Lift Achievement:** % of merchants hitting ≥20% lift in 90 days
- **Integration Health:** % uptime of Shopify/ESP integrations
- **Data Accuracy:** Merchant-reported discrepancies vs Shopify Admin

**Technical KPIs:**
- **Webhook Processing SLA:** 95% processed within 5 minutes
- **Dashboard Load Time:** p95 <2 seconds
- **ETL Reliability:** 99% successful hourly jobs
- **Error Rate:** <1% of API requests result in 5xx errors
- **Data Freshness:** 95% of dashboard data <1 hour old

---

## Appendix A: Database Schema Reference

### Core Tables

```sql
-- Merchants (Tenants)
CREATE TABLE merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopify_domain VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  business_name VARCHAR(255),
  timezone VARCHAR(100) DEFAULT 'America/New_York',
  status VARCHAR(20) DEFAULT 'active', -- active, paused, churned
  created_at TIMESTAMPTZ DEFAULT NOW(),
  churned_at TIMESTAMPTZ,
  settings JSONB DEFAULT '{}'::jsonb
);

-- Integrations
CREATE TABLE merchant_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'shopify', 'klaviyo', 'hotjar'
  encrypted_token TEXT,
  iv VARCHAR(32),
  auth_tag VARCHAR(32),
  config JSONB, -- Provider-specific config (API endpoint, project ID, etc.)
  status VARCHAR(20) DEFAULT 'active', -- active, disconnected, error
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(merchant_id, provider)
);

-- Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  shopify_customer_id BIGINT NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  is_post_purchase BOOLEAN DEFAULT FALSE,
  first_purchase_at TIMESTAMPTZ,
  last_purchase_at TIMESTAMPTZ,
  total_orders INTEGER DEFAULT 0,
  lifetime_value DECIMAL(12,2) DEFAULT 0,
  current_product_step INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(merchant_id, shopify_customer_id)
);

CREATE INDEX idx_customers_merchant ON customers(merchant_id);
CREATE INDEX idx_customers_post_purchase ON customers(merchant_id, is_post_purchase);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),
  shopify_order_id BIGINT NOT NULL,
  revenue DECIMAL(12,2) NOT NULL,
  device_type VARCHAR(20), -- mobile, desktop, tablet
  attribution_source VARCHAR(100), -- 'iceberg_email', 'paid_social', etc.
  attribution_flow_type VARCHAR(50), -- 'abandoned_cart', 'win_back', etc.
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL,
  UNIQUE(merchant_id, shopify_order_id)
);

CREATE INDEX idx_orders_merchant_date ON orders(merchant_id, created_at DESC);
CREATE INDEX idx_orders_customer ON orders(customer_id);

-- Gates
CREATE TABLE gate_states (
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  gate_type VARCHAR(50) NOT NULL, -- 'deliverability', 'funnel_throughput', etc.
  status VARCHAR(20) NOT NULL, -- 'pass', 'warning', 'fail', 'grace_period'
  failed_at TIMESTAMPTZ,
  grace_period_ends_at TIMESTAMPTZ,
  metrics JSONB, -- Gate-specific metrics
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (merchant_id, gate_type)
);

-- Baselines
CREATE TABLE baselines (
  merchant_id UUID PRIMARY KEY REFERENCES merchants(id) ON DELETE CASCADE,
  baseline_by_dow JSONB NOT NULL, -- {0: 1200, 1: 1500, ...} revenue by day of week
  calculated_at TIMESTAMPTZ NOT NULL,
  lookback_days INTEGER NOT NULL,
  data_points_used INTEGER NOT NULL,
  is_provisional BOOLEAN DEFAULT TRUE,
  anomalies_excluded INTEGER DEFAULT 0
);

-- Analytics (OLAP Database)
CREATE TABLE daily_revenue_metrics (
  merchant_id UUID NOT NULL,
  date DATE NOT NULL,
  device_type VARCHAR(20),
  revenue DECIMAL(12,2) DEFAULT 0,
  order_count INTEGER DEFAULT 0,
  sessions INTEGER DEFAULT 0,
  add_to_cart INTEGER DEFAULT 0,
  checkout_initiated INTEGER DEFAULT 0,
  PRIMARY KEY (merchant_id, date, device_type)
);

CREATE INDEX idx_daily_revenue_merchant_date ON daily_revenue_metrics(merchant_id, date DESC);
```

---

## Appendix B: API Endpoints Reference

### Authentication
- `POST /auth/shopify/install` - Initiate Shopify OAuth
- `GET /auth/shopify/callback` - Shopify OAuth callback
- `POST /auth/logout` - End session

### Dashboard
- `GET /api/dashboard/overview` - Main dashboard data
- `GET /api/dashboard/monday-ritual` - Monday Ritual report
- `POST /api/dashboard/monday-ritual/pdf` - Export PDF

### Metrics
- `GET /api/metrics/revenue` - Revenue time series
- `GET /api/metrics/funnel` - Funnel metrics
- `GET /api/metrics/lifecycle` - Lifecycle flow performance
- `GET /api/metrics/baseline` - Baseline comparison

### Gates
- `GET /api/gates` - All gate statuses
- `GET /api/gates/:gateType` - Specific gate status
- `POST /api/gates/:gateType/override` - Override gate (with reason)

### Integrations
- `GET /api/integrations` - All integrations status
- `POST /api/integrations/klaviyo` - Connect Klaviyo
- `DELETE /api/integrations/:provider` - Disconnect integration
- `POST /api/integrations/:provider/test` - Test connection

### Flows
- `GET /api/flows/templates` - Available templates
- `POST /api/flows` - Create flow from template
- `PUT /api/flows/:id` - Update flow
- `POST /api/flows/:id/trigger` - Manually trigger flow

### Settings
- `GET /api/settings` - Merchant settings
- `PUT /api/settings` - Update settings
- `GET /api/settings/product-ladder` - Product ladder config
- `PUT /api/settings/product-ladder` - Update product ladder

### Webhooks (External)
- `POST /webhooks/shopify` - Shopify webhook receiver
- `POST /webhooks/klaviyo` - Klaviyo webhook receiver

---

## Document Control

**Approval:**
- [ ] Technical Lead Review
- [ ] Product Owner Review
- [ ] Security Review (if handling PII)

**Change Log:**
- 2026-01-31: v1.0 - Initial technical specification based on PRD v1.3 and in-depth interview

**Next Steps:**
1. Review and approve this spec
2. Set up development environment
3. Initialize codebase with chosen stack
4. Implement Phase 1: Shopify integration + webhook infrastructure
5. Iterate following PLAN.md phase sequence

---

**End of Technical Specification**
