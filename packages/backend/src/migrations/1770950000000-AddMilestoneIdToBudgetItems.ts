import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMilestoneIdToBudgetItems1770950000000 implements MigrationInterface {
  name = 'AddMilestoneIdToBudgetItems1770950000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "budget_items" ADD COLUMN "milestone_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "budget_items" ADD CONSTRAINT "FK_budget_items_milestone" FOREIGN KEY ("milestone_id") REFERENCES "milestones"("id") ON DELETE SET NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "budget_items" DROP CONSTRAINT "FK_budget_items_milestone"`);
    await queryRunner.query(`ALTER TABLE "budget_items" DROP COLUMN "milestone_id"`);
  }
}
