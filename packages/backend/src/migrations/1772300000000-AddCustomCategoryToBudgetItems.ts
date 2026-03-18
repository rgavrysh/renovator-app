import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomCategoryToBudgetItems1772300000000 implements MigrationInterface {
  name = 'AddCustomCategoryToBudgetItems1772300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "budget_items" ADD COLUMN "custom_category" varchar(100)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "budget_items" DROP COLUMN "custom_category"`);
  }
}
