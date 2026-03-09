import { MigrationInterface, QueryRunner } from 'typeorm';

export class SplitHvacCategory1772200000000 implements MigrationInterface {
  name = 'SplitHvacCategory1772200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "work_item_templates" SET "category" = 'heating' WHERE "category" = 'hvac'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "work_item_templates" SET "category" = 'hvac' WHERE "category" IN ('heating', 'ventilation')`
    );
  }
}
