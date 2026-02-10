import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTaskCostsToBudget1770747422845 implements MigrationInterface {
    name = 'AddTaskCostsToBudget1770747422845'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "budgets" ADD "total_actual_from_items" numeric(12,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "budgets" ADD "total_actual_from_tasks" numeric(12,2) NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "budgets" DROP COLUMN "total_actual_from_tasks"`);
        await queryRunner.query(`ALTER TABLE "budgets" DROP COLUMN "total_actual_from_items"`);
    }

}
