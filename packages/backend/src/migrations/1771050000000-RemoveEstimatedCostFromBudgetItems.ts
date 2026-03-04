import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveEstimatedCostFromBudgetItems1771050000000 implements MigrationInterface {
  name = 'RemoveEstimatedCostFromBudgetItems1771050000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "budget_items" DROP COLUMN "estimated_cost"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "budget_items" ADD COLUMN "estimated_cost" decimal(12,2) NOT NULL DEFAULT 0`
    );
  }
}
