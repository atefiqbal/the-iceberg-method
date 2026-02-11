-- OLAP Database Schema
-- This database stores aggregated analytics data
-- Populated by hourly ETL job from OLTP database

-- Daily revenue metrics aggregated by merchant, date, and device type
CREATE TABLE IF NOT EXISTS daily_revenue_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL,
  date DATE NOT NULL,
  device_type VARCHAR(50) NOT NULL DEFAULT 'unknown',

  -- Revenue metrics
  revenue DECIMAL(12, 2) NOT NULL DEFAULT 0,
  order_count INTEGER NOT NULL DEFAULT 0,

  -- Funnel metrics
  sessions INTEGER NOT NULL DEFAULT 0,
  add_to_cart INTEGER NOT NULL DEFAULT 0,
  checkout_initiated INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Unique constraint for upserts
  UNIQUE (merchant_id, date, device_type)
);

-- Index for fast merchant queries
CREATE INDEX idx_daily_revenue_merchant_date
  ON daily_revenue_metrics(merchant_id, date DESC);

-- Index for device type analysis
CREATE INDEX idx_daily_revenue_device
  ON daily_revenue_metrics(merchant_id, device_type, date DESC);

-- ETL checkpoints - tracks last processed event per merchant
CREATE TABLE IF NOT EXISTS etl_checkpoints (
  merchant_id UUID PRIMARY KEY,
  last_processed_event_id UUID NOT NULL,
  last_processed_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Customer lifecycle metrics aggregated daily
CREATE TABLE IF NOT EXISTS customer_lifecycle_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL,
  date DATE NOT NULL,

  -- New vs returning
  new_customers INTEGER NOT NULL DEFAULT 0,
  returning_customers INTEGER NOT NULL DEFAULT 0,

  -- Cohort metrics
  cohort_month VARCHAR(7) NOT NULL, -- YYYY-MM format
  days_since_first_purchase INTEGER NOT NULL,

  -- Revenue metrics
  revenue_from_new DECIMAL(12, 2) NOT NULL DEFAULT 0,
  revenue_from_returning DECIMAL(12, 2) NOT NULL DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE (merchant_id, date, cohort_month, days_since_first_purchase)
);

CREATE INDEX idx_lifecycle_merchant_date
  ON customer_lifecycle_metrics(merchant_id, date DESC);

-- Email attribution metrics
CREATE TABLE IF NOT EXISTS email_attribution_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL,
  date DATE NOT NULL,

  -- Attribution data
  flow_name VARCHAR(255) NOT NULL,
  email_subject VARCHAR(500),
  utm_campaign VARCHAR(255),

  -- Performance metrics
  clicks INTEGER NOT NULL DEFAULT 0,
  orders INTEGER NOT NULL DEFAULT 0,
  revenue DECIMAL(12, 2) NOT NULL DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE (merchant_id, date, flow_name, COALESCE(utm_campaign, ''))
);

CREATE INDEX idx_email_attribution_merchant_date
  ON email_attribution_metrics(merchant_id, date DESC);

CREATE INDEX idx_email_attribution_flow
  ON email_attribution_metrics(merchant_id, flow_name, date DESC);

-- Materialized view for fast dashboard queries
-- Pre-aggregates last 90 days of metrics per merchant
CREATE MATERIALIZED VIEW daily_metrics AS
SELECT
  merchant_id,
  date,
  SUM(revenue) as total_revenue,
  SUM(order_count) as total_orders,
  SUM(sessions) as total_sessions,
  SUM(add_to_cart) as total_add_to_cart,
  SUM(checkout_initiated) as total_checkouts,

  -- Conversion rates
  CASE
    WHEN SUM(sessions) > 0
    THEN ROUND((SUM(checkout_initiated)::DECIMAL / SUM(sessions)) * 100, 2)
    ELSE 0
  END as checkout_rate,

  CASE
    WHEN SUM(checkout_initiated) > 0
    THEN ROUND((SUM(order_count)::DECIMAL / SUM(checkout_initiated)) * 100, 2)
    ELSE 0
  END as conversion_rate,

  -- AOV
  CASE
    WHEN SUM(order_count) > 0
    THEN ROUND(SUM(revenue) / SUM(order_count), 2)
    ELSE 0
  END as aov

FROM daily_revenue_metrics
WHERE date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY merchant_id, date;

-- Index for fast merchant lookups
CREATE UNIQUE INDEX idx_daily_metrics_merchant_date
  ON daily_metrics(merchant_id, date DESC);

-- Refresh policy: After ETL runs (hourly) or on-demand
COMMENT ON MATERIALIZED VIEW daily_metrics IS
  'Pre-aggregated daily metrics for dashboard. Refresh after ETL runs.';
