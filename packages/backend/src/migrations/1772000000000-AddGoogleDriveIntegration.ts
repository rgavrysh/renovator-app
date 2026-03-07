import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGoogleDriveIntegration1772000000000 implements MigrationInterface {
  name = 'AddGoogleDriveIntegration1772000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user_google_drive_tokens" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "google_email" varchar(255) NOT NULL,
        "access_token_encrypted" text NOT NULL,
        "refresh_token_encrypted" text NOT NULL,
        "token_expires_at" TIMESTAMP NOT NULL,
        "scopes" text NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_google_drive_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_google_drive_tokens_user_id" UNIQUE ("user_id"),
        CONSTRAINT "FK_user_google_drive_tokens_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_user_google_drive_tokens_user_id" ON "user_google_drive_tokens" ("user_id")`
    );

    await queryRunner.query(`
      CREATE TABLE "project_drive_folders" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "project_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "drive_folder_id" varchar(255) NOT NULL,
        "drive_folder_name" varchar(255) NOT NULL,
        "drive_folder_url" varchar(500),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_project_drive_folders" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_project_drive_folders_project_user" UNIQUE ("project_id", "user_id"),
        CONSTRAINT "FK_project_drive_folders_project" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_project_drive_folders_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `ALTER TABLE "documents" ADD COLUMN "storage_provider" varchar(20) NOT NULL DEFAULT 'local'`
    );

    await queryRunner.query(
      `ALTER TABLE "documents" ADD COLUMN "drive_file_id" varchar(255)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "drive_file_id"`);
    await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "storage_provider"`);
    await queryRunner.query(`DROP TABLE "project_drive_folders"`);
    await queryRunner.query(`DROP INDEX "IDX_user_google_drive_tokens_user_id"`);
    await queryRunner.query(`DROP TABLE "user_google_drive_tokens"`);
  }
}
