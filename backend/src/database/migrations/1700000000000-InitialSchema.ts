import { MigrationInterface, QueryRunner } from 'typeorm'

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create merchants table
    await queryRunner.query(`
      CREATE TYPE merchant_status_enum AS ENUM ('active', 'paused', 'churned');

      CREATE TABLE merchants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        shopify_domain VARCHAR NOT NULL UNIQUE,
        email VARCHAR NOT NULL,
        business_name VARCHAR,
        timezone VARCHAR NOT NULL DEFAULT 'America/New_York',
        status merchant_status_enum NOT NULL DEFAULT 'active',
        settings JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now(),
        churned_at TIMESTAMP
      );

      CREATE INDEX idx_merchants_status ON merchants(status);
      CREATE INDEX idx_merchants_created_at ON merchants(created_at);
    `)

    // Create merchant_integrations table
    await queryRunner.query(`
      CREATE TYPE integration_provider_enum AS ENUM ('shopify', 'klaviyo', 'hotjar', 'clarity');
      CREATE TYPE integration_status_enum AS ENUM ('active', 'disconnected', 'error');

      CREATE TABLE merchant_integrations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        merchant_id UUID NOT NULL,
        provider integration_provider_enum NOT NULL,
        encrypted_token VARCHAR,
        iv VARCHAR(32),
        auth_tag VARCHAR(32),
        config JSONB,
        status integration_status_enum NOT NULL DEFAULT 'active',
        last_sync_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT fk_merchant_integrations_merchant FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
        CONSTRAINT uq_merchant_integrations_merchant_provider UNIQUE (merchant_id, provider)
      );

      CREATE INDEX idx_merchant_integrations_merchant_id ON merchant_integrations(merchant_id);
      CREATE INDEX idx_merchant_integrations_status ON merchant_integrations(status);
    `)

    // Create customers table
    await queryRunner.query(`
      CREATE TABLE customers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        merchant_id UUID NOT NULL,
        shopify_customer_id BIGINT NOT NULL,
        email VARCHAR,
        phone VARCHAR(50),
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        is_post_purchase BOOLEAN NOT NULL DEFAULT false,
        first_purchase_at TIMESTAMP,
        last_purchase_at TIMESTAMP,
        total_orders INTEGER NOT NULL DEFAULT 0,
        lifetime_value DECIMAL(12, 2) NOT NULL DEFAULT 0,
        current_product_step INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT fk_customers_merchant FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
        CONSTRAINT uq_customers_merchant_shopify UNIQUE (merchant_id, shopify_customer_id)
      );

      CREATE INDEX idx_customers_merchant_id ON customers(merchant_id);
      CREATE INDEX idx_customers_merchant_post_purchase ON customers(merchant_id, is_post_purchase);
      CREATE INDEX idx_customers_email ON customers(email);
    `)

    // Create orders table
    await queryRunner.query(`
      CREATE TYPE device_type_enum AS ENUM ('mobile', 'desktop', 'tablet', 'unknown');

      CREATE TABLE orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        merchant_id UUID NOT NULL,
        customer_id UUID,
        shopify_order_id BIGINT NOT NULL,
        revenue DECIMAL(12, 2) NOT NULL,
        device_type device_type_enum,
        attribution_source VARCHAR(100),
        attribution_flow_type VARCHAR(50),
        utm_source VARCHAR(100),
        utm_medium VARCHAR(100),
        utm_campaign VARCHAR(100),
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT fk_orders_merchant FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
        CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
        CONSTRAINT uq_orders_merchant_shopify UNIQUE (merchant_id, shopify_order_id)
      );

      CREATE INDEX idx_orders_merchant_id ON orders(merchant_id);
      CREATE INDEX idx_orders_merchant_created_at ON orders(merchant_id, created_at);
      CREATE INDEX idx_orders_customer_id ON orders(customer_id);
      CREATE INDEX idx_orders_attribution_source ON orders(attribution_source);
      CREATE INDEX idx_orders_created_at ON orders(created_at);
    `)

    // Create gate_states table
    await queryRunner.query(`
      CREATE TYPE gate_type_enum AS ENUM ('deliverability', 'funnel_throughput', 'cro_review', 'offer_validation', 'paid_acquisition');
      CREATE TYPE gate_status_enum AS ENUM ('pass', 'warning', 'fail', 'grace_period');

      CREATE TABLE gate_states (
        merchant_id UUID NOT NULL,
        gate_type gate_type_enum NOT NULL,
        status gate_status_enum NOT NULL,
        failed_at TIMESTAMP,
        grace_period_ends_at TIMESTAMP,
        metrics JSONB,
        updated_at TIMESTAMP NOT NULL DEFAULT now(),
        PRIMARY KEY (merchant_id, gate_type),
        CONSTRAINT fk_gate_states_merchant FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
      );

      CREATE INDEX idx_gate_states_status ON gate_states(status);
      CREATE INDEX idx_gate_states_grace_period ON gate_states(grace_period_ends_at) WHERE grace_period_ends_at IS NOT NULL;
    `)

    // Create baselines table
    await queryRunner.query(`
      CREATE TABLE baselines (
        merchant_id UUID PRIMARY KEY,
        baseline_by_dow JSONB NOT NULL,
        calculated_at TIMESTAMP NOT NULL DEFAULT now(),
        lookback_days INTEGER NOT NULL,
        data_points_used INTEGER NOT NULL,
        is_provisional BOOLEAN NOT NULL DEFAULT true,
        anomalies_excluded INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT fk_baselines_merchant FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
      );
    `)

    // Create webhook_events table for idempotency tracking
    await queryRunner.query(`
      CREATE TABLE webhook_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        merchant_id UUID NOT NULL,
        event_id VARCHAR NOT NULL,
        topic VARCHAR(100) NOT NULL,
        processed_at TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT fk_webhook_events_merchant FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
        CONSTRAINT uq_webhook_events_event_id UNIQUE (event_id)
      );

      CREATE INDEX idx_webhook_events_merchant_id ON webhook_events(merchant_id);
      CREATE INDEX idx_webhook_events_topic ON webhook_events(topic);
      CREATE INDEX idx_webhook_events_processed_at ON webhook_events(processed_at);
    `)

    // Create gate_overrides table for audit trail
    await queryRunner.query(`
      CREATE TABLE gate_overrides (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        merchant_id UUID NOT NULL,
        gate_type gate_type_enum NOT NULL,
        user_id VARCHAR NOT NULL,
        reason TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT fk_gate_overrides_merchant FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
      );

      CREATE INDEX idx_gate_overrides_merchant_id ON gate_overrides(merchant_id);
      CREATE INDEX idx_gate_overrides_gate_type ON gate_overrides(gate_type);
      CREATE INDEX idx_gate_overrides_created_at ON gate_overrides(created_at);
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE IF EXISTS gate_overrides CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS webhook_events CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS baselines CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS gate_states CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS orders CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS customers CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS merchant_integrations CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS merchants CASCADE`)

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS gate_status_enum`)
    await queryRunner.query(`DROP TYPE IF EXISTS gate_type_enum`)
    await queryRunner.query(`DROP TYPE IF EXISTS device_type_enum`)
    await queryRunner.query(`DROP TYPE IF EXISTS integration_status_enum`)
    await queryRunner.query(`DROP TYPE IF EXISTS integration_provider_enum`)
    await queryRunner.query(`DROP TYPE IF EXISTS merchant_status_enum`)
  }
}
