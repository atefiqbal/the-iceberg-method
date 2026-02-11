import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddBackfillJobs1700000006000 implements MigrationInterface {
  name = 'AddBackfillJobs1700000006000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create backfill_jobs table
    await queryRunner.query(`
      CREATE TABLE backfill_jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        merchant_id UUID NOT NULL,
        backfill_type VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        total_records INTEGER DEFAULT 0,
        processed_records INTEGER DEFAULT 0,
        failed_records INTEGER DEFAULT 0,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        error_message TEXT,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT fk_backfill_jobs_merchant FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
      );

      CREATE INDEX idx_backfill_jobs_merchant ON backfill_jobs(merchant_id);
      CREATE INDEX idx_backfill_jobs_status ON backfill_jobs(status);
      CREATE INDEX idx_backfill_jobs_created_at ON backfill_jobs(created_at DESC);
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS backfill_jobs CASCADE`)
  }
}
