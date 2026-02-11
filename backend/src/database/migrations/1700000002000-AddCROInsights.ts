import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddCROInsights1700000002000 implements MigrationInterface {
  name = 'AddCROInsights1700000002000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create CRO insight type enum
    await queryRunner.query(`
      CREATE TYPE cro_insight_type_enum AS ENUM (
        'rage_click',
        'dead_click',
        'error_click',
        'quick_back',
        'excessive_scrolling'
      );
    `)

    // Create CRO insight severity enum
    await queryRunner.query(`
      CREATE TYPE cro_insight_severity_enum AS ENUM (
        'low',
        'medium',
        'high',
        'critical'
      );
    `)

    // Create page type enum
    await queryRunner.query(`
      CREATE TYPE page_type_enum AS ENUM (
        'homepage',
        'product',
        'collection',
        'cart',
        'checkout',
        'other'
      );
    `)

    // Create cro_insights table
    await queryRunner.query(`
      CREATE TABLE cro_insights (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        merchant_id UUID NOT NULL,
        insight_type cro_insight_type_enum NOT NULL,
        severity cro_insight_severity_enum NOT NULL,
        page_type page_type_enum NOT NULL,
        page_url TEXT NOT NULL,
        element_selector VARCHAR(500),
        occurrences INTEGER DEFAULT 1,
        session_urls JSONB,
        metadata JSONB,
        description TEXT,
        resolved BOOLEAN DEFAULT FALSE,
        resolved_at TIMESTAMP,
        resolved_note TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT fk_cro_insights_merchant FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
      );

      CREATE INDEX idx_cro_insights_merchant_page_created ON cro_insights(merchant_id, page_type, created_at);
      CREATE INDEX idx_cro_insights_merchant_severity_resolved ON cro_insights(merchant_id, severity, resolved);
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS cro_insights CASCADE`)

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS page_type_enum`)
    await queryRunner.query(`DROP TYPE IF EXISTS cro_insight_severity_enum`)
    await queryRunner.query(`DROP TYPE IF EXISTS cro_insight_type_enum`)
  }
}
