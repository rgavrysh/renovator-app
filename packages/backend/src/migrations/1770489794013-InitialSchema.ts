import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1770489794013 implements MigrationInterface {
    name = 'InitialSchema1770489794013'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "access_token" text NOT NULL, "refresh_token" text NOT NULL, "expires_at" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3238ef96f18b355b671619111bc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "tasks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "project_id" uuid NOT NULL, "milestone_id" uuid, "name" character varying(255) NOT NULL, "description" text, "status" character varying(50) NOT NULL DEFAULT 'todo', "priority" character varying(50) NOT NULL DEFAULT 'medium', "due_date" date, "completed_date" date, "estimated_price" numeric(12,2), "actual_price" numeric(12,2), "assigned_to" uuid, "notes" text NOT NULL DEFAULT '', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8d12ff38fcc62aaba2cab748772" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "milestones" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "project_id" uuid NOT NULL, "name" character varying(255) NOT NULL, "description" text, "target_date" date NOT NULL, "completed_date" date, "status" character varying(50) NOT NULL DEFAULT 'not_started', "order_index" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0bdbfe399c777a6a8520ff902d9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "budget_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "budget_id" uuid NOT NULL, "name" character varying(255) NOT NULL, "category" character varying(50) NOT NULL, "estimated_cost" numeric(12,2) NOT NULL, "actual_cost" numeric(12,2) NOT NULL DEFAULT '0', "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9eb705f406c83a1167ef575cd7f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "budgets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "project_id" uuid NOT NULL, "total_estimated" numeric(12,2) NOT NULL DEFAULT '0', "total_actual" numeric(12,2) NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_ece88bfd72296dfc861b87fff5" UNIQUE ("project_id"), CONSTRAINT "PK_9c8a51748f82387644b773da482" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "documents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "project_id" uuid NOT NULL, "name" character varying(255) NOT NULL, "type" character varying(50) NOT NULL, "file_type" character varying(50) NOT NULL, "file_size" bigint NOT NULL, "storage_url" character varying(500) NOT NULL, "thumbnail_url" character varying(500), "uploaded_by" uuid NOT NULL, "uploaded_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "metadata" jsonb, CONSTRAINT "PK_ac51aa5181ee2036f5ca482857c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "suppliers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "contact_name" character varying(255), "email" character varying(255), "phone" character varying(20), "address" text, "notes" text, "owner_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b70ac51766a9e3144f778cfe81e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "resources" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "project_id" uuid NOT NULL, "type" character varying(50) NOT NULL, "name" character varying(255) NOT NULL, "quantity" numeric(10,2) NOT NULL, "unit" character varying(50) NOT NULL, "cost" numeric(12,2) NOT NULL, "status" character varying(50) NOT NULL DEFAULT 'needed', "supplier_id" uuid, "order_date" date, "expected_delivery_date" date, "actual_delivery_date" date, "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_632484ab9dff41bba94f9b7c85e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "projects" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "client_name" character varying(255) NOT NULL, "client_email" character varying(255), "client_phone" character varying(20), "description" text, "start_date" date NOT NULL, "estimated_end_date" date NOT NULL, "actual_end_date" date, "status" character varying(50) NOT NULL DEFAULT 'planning', "owner_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6271df0a7aed1d6c0691ce6ac50" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255) NOT NULL, "first_name" character varying(100) NOT NULL, "last_name" character varying(100) NOT NULL, "phone" character varying(20), "company" character varying(255), "idp_user_id" character varying(255) NOT NULL, "last_login_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "work_item_templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "description" text, "category" character varying(50) NOT NULL, "estimated_duration" integer, "default_price" numeric(12,2), "is_default" boolean NOT NULL DEFAULT false, "owner_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a1888a67fa721ab1c9d70d75555" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD CONSTRAINT "FK_085d540d9f418cfbdc7bd55bb19" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_9eecdb5b1ed8c7c2a1b392c28d4" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_39abeb50240a7312a00786c9b24" FOREIGN KEY ("milestone_id") REFERENCES "milestones"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_5770b28d72ca90c43b1381bf787" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "milestones" ADD CONSTRAINT "FK_2204463ea4c5c1872e1fb2b8ffb" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "budget_items" ADD CONSTRAINT "FK_c3baf040ebaa2c35a6f5e0fe4d9" FOREIGN KEY ("budget_id") REFERENCES "budgets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "budgets" ADD CONSTRAINT "FK_ece88bfd72296dfc861b87fff55" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "documents" ADD CONSTRAINT "FK_e156b298c20873e14c362e789bf" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "documents" ADD CONSTRAINT "FK_b9e28779ec77ff2223e2da41f6d" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "suppliers" ADD CONSTRAINT "FK_55c112a3befcd9f69f984bf7811" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "resources" ADD CONSTRAINT "FK_e9b8266cbfbd6a692a205efaa8f" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "resources" ADD CONSTRAINT "FK_305c03534abdacbc8acf1377f50" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "projects" ADD CONSTRAINT "FK_b1bd2fbf5d0ef67319c91acb5cf" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "work_item_templates" ADD CONSTRAINT "FK_ba42b412fbb0c8800c4888d2761" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "work_item_templates" DROP CONSTRAINT "FK_ba42b412fbb0c8800c4888d2761"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP CONSTRAINT "FK_b1bd2fbf5d0ef67319c91acb5cf"`);
        await queryRunner.query(`ALTER TABLE "resources" DROP CONSTRAINT "FK_305c03534abdacbc8acf1377f50"`);
        await queryRunner.query(`ALTER TABLE "resources" DROP CONSTRAINT "FK_e9b8266cbfbd6a692a205efaa8f"`);
        await queryRunner.query(`ALTER TABLE "suppliers" DROP CONSTRAINT "FK_55c112a3befcd9f69f984bf7811"`);
        await queryRunner.query(`ALTER TABLE "documents" DROP CONSTRAINT "FK_b9e28779ec77ff2223e2da41f6d"`);
        await queryRunner.query(`ALTER TABLE "documents" DROP CONSTRAINT "FK_e156b298c20873e14c362e789bf"`);
        await queryRunner.query(`ALTER TABLE "budgets" DROP CONSTRAINT "FK_ece88bfd72296dfc861b87fff55"`);
        await queryRunner.query(`ALTER TABLE "budget_items" DROP CONSTRAINT "FK_c3baf040ebaa2c35a6f5e0fe4d9"`);
        await queryRunner.query(`ALTER TABLE "milestones" DROP CONSTRAINT "FK_2204463ea4c5c1872e1fb2b8ffb"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_5770b28d72ca90c43b1381bf787"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_39abeb50240a7312a00786c9b24"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_9eecdb5b1ed8c7c2a1b392c28d4"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_085d540d9f418cfbdc7bd55bb19"`);
        await queryRunner.query(`DROP TABLE "work_item_templates"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "projects"`);
        await queryRunner.query(`DROP TABLE "resources"`);
        await queryRunner.query(`DROP TABLE "suppliers"`);
        await queryRunner.query(`DROP TABLE "documents"`);
        await queryRunner.query(`DROP TABLE "budgets"`);
        await queryRunner.query(`DROP TABLE "budget_items"`);
        await queryRunner.query(`DROP TABLE "milestones"`);
        await queryRunner.query(`DROP TABLE "tasks"`);
        await queryRunner.query(`DROP TABLE "sessions"`);
    }

}
