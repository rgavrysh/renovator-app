import { MigrationInterface, QueryRunner } from 'typeorm';

export class IncreaseFileTypeColumnLength1772100000000 implements MigrationInterface {
  name = 'IncreaseFileTypeColumnLength1772100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "documents" ALTER COLUMN "file_type" TYPE varchar(255)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "documents" ALTER COLUMN "file_type" TYPE varchar(50)`
    );
  }
}
