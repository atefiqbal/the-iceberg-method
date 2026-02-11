import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm'

export class AddPhaseCompletions1700000008000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create phase_completions table
    await queryRunner.createTable(
      new Table({
        name: 'phase_completions',
        columns: [
          {
            name: 'merchantId',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'phase',
            type: 'varchar',
            length: '50',
            isPrimary: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'locked'",
          },
          {
            name: 'completedAt',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamptz',
            default: 'NOW()',
          },
          {
            name: 'updatedAt',
            type: 'timestamptz',
            default: 'NOW()',
          },
        ],
      }),
      true,
    )

    // Add foreign key to merchants table
    await queryRunner.createForeignKey(
      'phase_completions',
      new TableForeignKey({
        columnNames: ['merchantId'],
        referencedTableName: 'merchants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    )

    // Create index for faster queries
    await queryRunner.query(`
      CREATE INDEX idx_phase_completions_merchant_status
      ON phase_completions(merchantId, status)
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_phase_completions_merchant_status`)
    await queryRunner.dropTable('phase_completions', true)
  }
}
