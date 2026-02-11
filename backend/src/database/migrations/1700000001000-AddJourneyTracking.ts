import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddJourneyTracking1700000001000 implements MigrationInterface {
  name = 'AddJourneyTracking1700000001000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create journey stage enum
    await queryRunner.query(`
      CREATE TYPE journey_stage_enum AS ENUM ('pre_purchase', 'post_purchase');
    `)

    // Create product step enum
    await queryRunner.query(`
      CREATE TYPE product_step_enum AS ENUM ('0', '1', '2', '3');
    `)

    // Create flow state enum
    await queryRunner.query(`
      CREATE TYPE flow_state_enum AS ENUM (
        'none',
        'welcome',
        'abandoned_cart',
        'abandoned_checkout',
        'post_purchase_education',
        'win_back',
        'browse_abandonment'
      );
    `)

    // Create customer_journeys table
    await queryRunner.query(`
      CREATE TABLE customer_journeys (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        merchant_id UUID NOT NULL,
        customer_id UUID NOT NULL,
        journey_stage journey_stage_enum NOT NULL DEFAULT 'pre_purchase',
        product_step product_step_enum NOT NULL DEFAULT '0',
        current_flow flow_state_enum NOT NULL DEFAULT 'none',
        first_purchase_at TIMESTAMP,
        last_purchase_at TIMESTAMP,
        total_purchases INTEGER NOT NULL DEFAULT 0,
        lifetime_value DECIMAL(12, 2) NOT NULL DEFAULT 0,
        last_email_sent_at TIMESTAMP,
        last_flow_completed_at TIMESTAMP,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT fk_customer_journeys_merchant FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
        CONSTRAINT fk_customer_journeys_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
        CONSTRAINT uq_customer_journeys_merchant_customer UNIQUE (merchant_id, customer_id)
      );

      CREATE INDEX idx_customer_journeys_merchant_id ON customer_journeys(merchant_id);
      CREATE INDEX idx_customer_journeys_merchant_stage ON customer_journeys(merchant_id, journey_stage);
      CREATE INDEX idx_customer_journeys_merchant_step ON customer_journeys(merchant_id, product_step);
    `)

    // Create journey event type enum
    await queryRunner.query(`
      CREATE TYPE journey_event_type_enum AS ENUM (
        'browsed',
        'added_to_cart',
        'initiated_checkout',
        'abandoned_cart',
        'abandoned_checkout',
        'first_purchase',
        'repeat_purchase',
        'product_step_advanced',
        'flow_entered',
        'flow_email_sent',
        'flow_email_opened',
        'flow_email_clicked',
        'flow_completed',
        'flow_exited',
        'win_back_triggered',
        'reactivated'
      );
    `)

    // Create journey_events table
    await queryRunner.query(`
      CREATE TABLE journey_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        merchant_id UUID NOT NULL,
        customer_id UUID NOT NULL,
        event_type journey_event_type_enum NOT NULL,
        event_data JSONB,
        flow_name VARCHAR,
        email_id VARCHAR,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT fk_journey_events_merchant FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
      );

      CREATE INDEX idx_journey_events_merchant_customer_created ON journey_events(merchant_id, customer_id, created_at);
      CREATE INDEX idx_journey_events_merchant_event_type ON journey_events(merchant_id, event_type);
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS journey_events CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS customer_journeys CASCADE`)

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS journey_event_type_enum`)
    await queryRunner.query(`DROP TYPE IF EXISTS flow_state_enum`)
    await queryRunner.query(`DROP TYPE IF EXISTS product_step_enum`)
    await queryRunner.query(`DROP TYPE IF EXISTS journey_stage_enum`)
  }
}
