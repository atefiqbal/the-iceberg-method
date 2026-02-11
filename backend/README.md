# The Iceberg Method - Backend

NestJS backend API and workers for The Iceberg Method SaaS platform.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and update:
   - Database credentials
   - Redis connection
   - Shopify API credentials
   - JWT secret
   - Encryption key (generate with: `openssl rand -hex 32`)

3. **Create databases:**
   ```bash
   createdb iceberg_prod
   createdb iceberg_analytics_prod
   ```

4. **Run database migrations:**
   ```bash
   npm run migration:run
   ```

## Development

Start the development server with hot reload:

```bash
npm run dev
```

The API will be available at `http://localhost:4000`

## Database Migrations

**Run pending migrations:**
```bash
npm run migration:run
```

**Show migration status:**
```bash
npm run migration:show
```

**Revert last migration:**
```bash
npm run migration:revert
```

**Generate new migration:**
```bash
npm run migration:generate -- src/database/migrations/MigrationName
```

## Production

Build and start the production server:

```bash
npm run build
npm run start:prod
```

## Project Structure

```
src/
├── auth/              # Authentication (Shopify OAuth, JWT)
├── merchants/         # Merchant management
├── customers/         # Customer entities and sync
├── orders/            # Order processing and webhooks
├── webhooks/          # Webhook receivers and processors
├── gates/             # Gate enforcement system
├── metrics/           # Baseline calculation and metrics
├── database/          # Migrations and data source config
└── main.ts            # Application entry point
```

## Key Modules

### Merchants
- Handles Shopify merchant accounts
- Stores encrypted integration tokens (AES-256-GCM)
- Manages merchant settings and status

### Auth
- Shopify OAuth 2.0 flow
- JWT session management
- Token refresh handling

### Webhooks
- HMAC signature verification
- Immediate ACK + async queue processing
- Idempotency via event ID deduplication
- Handles: orders, customers, checkouts, app uninstall

### Orders
- Syncs orders from Shopify webhooks
- Extracts device type from browser data
- Parses UTM attribution parameters
- Updates customer lifetime value

### Gates
- Deliverability gate (bounce rates, spam complaints)
- Funnel throughput gate (conversion rate monitoring)
- 24-hour grace period before hard fail
- Override capability with audit trail

### Metrics
- Baseline calculation using day-of-week averages
- Statistical outlier detection (>2 std dev)
- Post-purchase revenue attribution
- Comparison vs baseline logic

## Architecture Notes

**Multi-tenancy:** Row-level isolation via `merchant_id` filtering

**Queue Processing:** Bull + Redis for async webhook processing

**Encryption:** AES-256-GCM for access tokens with random IV

**Idempotency:** Webhook events tracked in `webhook_events` table

**Audit Trail:** Gate overrides logged in `gate_overrides` table

**Data Freshness:** Hourly ETL batch jobs + real-time webhook updates

## Environment Variables

See `.env.example` for all configuration options.

Critical variables:
- `ENCRYPTION_KEY` - 64-char hex key for token encryption
- `JWT_SECRET` - Secret for signing JWT tokens
- `SHOPIFY_API_SECRET` - For HMAC webhook verification
- `DB_*` - Database connection settings
- `REDIS_*` - Queue backend settings

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:cov
```

## Monitoring

- **Logs:** Winston JSON logging
- **Errors:** Sentry error tracking (configure `SENTRY_DSN`)
- **Metrics:** TODO - Prometheus metrics endpoint

## Security

- All access tokens encrypted at rest
- HMAC signature verification for webhooks
- JWT-based authentication
- Row-level security policies (TODO)
- No sensitive data in logs

## Support

For issues or questions, check the main project documentation.
