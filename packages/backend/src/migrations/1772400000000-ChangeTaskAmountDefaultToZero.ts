import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeTaskAmountDefaultToZero1772400000000 implements MigrationInterface {
  name = 'ChangeTaskAmountDefaultToZero1772400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Amount is no longer defaulted to 1 on task creation; use 0 instead so that
    // an unset amount does not misleadingly imply a quantity of 1.
    await queryRunner.query(`ALTER TABLE "tasks" ALTER COLUMN "amount" SET DEFAULT 0`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tasks" ALTER COLUMN "amount" SET DEFAULT 1`);
  }
}
