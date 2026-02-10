import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPerUnitToTask1770746200436 implements MigrationInterface {
    name = 'AddPerUnitToTask1770746200436'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tasks" ADD "per_unit" character varying(50)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "per_unit"`);
    }

}
