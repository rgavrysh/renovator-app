import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveEstimatedPriceFromTasks1770748000000 implements MigrationInterface {
  name = 'RemoveEstimatedPriceFromTasks1770748000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN IF EXISTS "estimated_price"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tasks" ADD COLUMN "estimated_price" numeric(12,2)`);
  }
}
