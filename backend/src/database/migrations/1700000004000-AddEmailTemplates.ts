import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddEmailTemplates1700000004000 implements MigrationInterface {
  name = 'AddEmailTemplates1700000004000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create template type enum
    await queryRunner.query(`
      CREATE TYPE template_type_enum AS ENUM (
        'welcome',
        'abandoned_cart',
        'abandoned_checkout',
        'browse_abandonment',
        'post_purchase',
        'win_back',
        'custom'
      );
    `)

    // Create email_templates table
    await queryRunner.query(`
      CREATE TABLE email_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        merchant_id UUID,
        name VARCHAR(255) NOT NULL,
        template_type template_type_enum NOT NULL,
        description TEXT,
        steps JSONB NOT NULL,
        is_system_template BOOLEAN DEFAULT FALSE,
        proven BOOLEAN DEFAULT FALSE,
        conversion_benchmark DECIMAL(5, 4),
        active BOOLEAN DEFAULT TRUE,
        based_on_template_id UUID,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT fk_email_templates_merchant FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
      );

      CREATE INDEX idx_email_templates_merchant_type ON email_templates(merchant_id, template_type);
      CREATE INDEX idx_email_templates_system ON email_templates(is_system_template) WHERE is_system_template = TRUE;
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS email_templates CASCADE`)

    // Drop enum
    await queryRunner.query(`DROP TYPE IF EXISTS template_type_enum`)
  }
}
