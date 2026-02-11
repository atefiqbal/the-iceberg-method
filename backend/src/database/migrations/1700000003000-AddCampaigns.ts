import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddCampaigns1700000003000 implements MigrationInterface {
  name = 'AddCampaigns1700000003000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create campaign type enum
    await queryRunner.query(`
      CREATE TYPE campaign_type_enum AS ENUM (
        'promotion',
        'announcement',
        'educational',
        'win_back'
      );
    `)

    // Create campaign status enum
    await queryRunner.query(`
      CREATE TYPE campaign_status_enum AS ENUM (
        'draft',
        'scheduled',
        'sending',
        'sent',
        'paused',
        'cancelled'
      );
    `)

    // Create segment target enum
    await queryRunner.query(`
      CREATE TYPE segment_target_enum AS ENUM (
        'all_subscribers',
        'post_purchase',
        'pre_purchase',
        'product_step_1',
        'product_step_2',
        'product_step_3',
        'inactive_customers',
        'custom'
      );
    `)

    // Create campaigns table
    await queryRunner.query(`
      CREATE TABLE campaigns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        merchant_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        campaign_type campaign_type_enum NOT NULL,
        status campaign_status_enum NOT NULL DEFAULT 'draft',
        segment_target segment_target_enum NOT NULL,
        custom_segment_filters JSONB,

        subject VARCHAR(500) NOT NULL,
        preheader TEXT,
        body_html TEXT NOT NULL,
        body_plaintext TEXT NOT NULL,

        promo_code VARCHAR(100),
        discount_type VARCHAR(20),
        discount_value DECIMAL(10, 2),
        promo_expires_at TIMESTAMP,

        scheduled_at TIMESTAMP,
        sent_at TIMESTAMP,

        recipient_count INTEGER DEFAULT 0,
        sent_count INTEGER DEFAULT 0,
        opened_count INTEGER DEFAULT 0,
        clicked_count INTEGER DEFAULT 0,
        revenue_generated DECIMAL(12, 2) DEFAULT 0,

        gate_overridden BOOLEAN DEFAULT FALSE,
        gate_override_reason TEXT,
        gate_override_user_id VARCHAR(100),
        gate_override_at TIMESTAMP,

        esp_campaign_id VARCHAR(255),

        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now(),

        CONSTRAINT fk_campaigns_merchant FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
      );

      CREATE INDEX idx_campaigns_merchant_status ON campaigns(merchant_id, status);
      CREATE INDEX idx_campaigns_merchant_scheduled ON campaigns(merchant_id, scheduled_at);
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS campaigns CASCADE`)

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS segment_target_enum`)
    await queryRunner.query(`DROP TYPE IF EXISTS campaign_status_enum`)
    await queryRunner.query(`DROP TYPE IF EXISTS campaign_type_enum`)
  }
}
