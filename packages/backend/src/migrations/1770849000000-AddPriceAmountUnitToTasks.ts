import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPriceAmountUnitToTasks1770849000000 implements MigrationInterface {
  name = 'AddPriceAmountUnitToTasks1770849000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add unit column to work_item_templates
    await queryRunner.query(`ALTER TABLE "work_item_templates" ADD COLUMN "unit" character varying(50)`);

    // Add price column to tasks
    await queryRunner.query(`ALTER TABLE "tasks" ADD COLUMN "price" numeric(12,2)`);

    // Add amount column to tasks (defaults to 1)
    await queryRunner.query(`ALTER TABLE "tasks" ADD COLUMN "amount" numeric(12,2) NOT NULL DEFAULT 1`);

    // Migrate existing data: copy actual_price to price
    await queryRunner.query(`UPDATE "tasks" SET "price" = "actual_price" WHERE "actual_price" IS NOT NULL`);

    // Rename per_unit to unit in tasks
    await queryRunner.query(`ALTER TABLE "tasks" RENAME COLUMN "per_unit" TO "unit"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rename unit back to per_unit in tasks
    await queryRunner.query(`ALTER TABLE "tasks" RENAME COLUMN "unit" TO "per_unit"`);

    // Drop amount column from tasks
    await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "amount"`);

    // Drop price column from tasks
    await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "price"`);

    // Drop unit column from work_item_templates
    await queryRunner.query(`ALTER TABLE "work_item_templates" DROP COLUMN "unit"`);
  }
}
