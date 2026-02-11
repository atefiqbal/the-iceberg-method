import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddWebhookDLQ1700000007000 implements MigrationInterface {
  name = 'AddWebhookDLQ1700000007000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create webhook_dlq table
    await queryRunner.query(`
      CREATE TABLE webhook_dlq (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        merchant_id UUID NOT NULL,
        webhook_id VARCHAR(100) NOT NULL,
        topic VARCHAR(100) NOT NULL,
        shop_domain VARCHAR(255) NOT NULL,
        payload JSONB NOT NULL,
        error_message TEXT NOT NULL,
        error_stack TEXT,
        retry_count INTEGER DEFAULT 0,
        last_retry_at TIMESTAMP,
        status VARCHAR(50) NOT NULL DEFAULT 'failed',
        resolution_notes TEXT,
        resolved_by VARCHAR(100),
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT fk_webhook_dlq_merchant FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
      );

      CREATE INDEX idx_webhook_dlq_merchant ON webhook_dlq(merchant_id);
      CREATE INDEX idx_webhook_dlq_status ON webhook_dlq(status);
      CREATE INDEX idx_webhook_dlq_webhook_id ON webhook_dlq(webhook_id);
      CREATE INDEX idx_webhook_dlq_created_at ON webhook_dlq(created_at DESC);
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS webhook_dlq CASCADE`)
  }
}
