# OLAP Database Migrations

These migrations set up the analytics database (OLAP) schema.

## Setup

1. Create the analytics database:
```bash
createdb iceberg_olap
```

2. Run the migration:
```bash
psql -d iceberg_olap -f migrations/analytics/001_create_olap_schema.sql
```

## Environment Variables

Add these to your `.env`:

```env
# OLAP Database (Analytics)
ANALYTICS_DB_HOST=localhost
ANALYTICS_DB_PORT=5432
ANALYTICS_DB_USERNAME=postgres
ANALYTICS_DB_PASSWORD=postgres
ANALYTICS_DB_DATABASE=iceberg_olap
```

## Schema Overview

### Tables

- **daily_revenue_metrics** - Daily aggregates by merchant, date, device type
- **etl_checkpoints** - Tracks last processed event for idempotent ETL
- **customer_lifecycle_metrics** - New vs returning customer metrics
- **email_attribution_metrics** - Email flow performance tracking

### Materialized View

- **daily_metrics** - Pre-aggregated 90-day metrics for fast dashboard queries

Refresh after ETL runs:
```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY daily_metrics;
```
