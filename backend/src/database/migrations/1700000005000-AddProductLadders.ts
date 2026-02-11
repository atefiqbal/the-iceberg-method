import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddProductLadders1700000005000 implements MigrationInterface {
  name = 'AddProductLadders1700000005000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create product_ladders table
    await queryRunner.query(`
      CREATE TABLE product_ladders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        merchant_id UUID NOT NULL,
        steps JSONB NOT NULL,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT fk_product_ladders_merchant FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
      );

      CREATE INDEX idx_product_ladders_merchant ON product_ladders(merchant_id);
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS product_ladders CASCADE`)
  }
}
