import { MigrationInterface, QueryRunner } from "typeorm";

export class User1769981910603 implements MigrationInterface {
    name = 'User1769981910603'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('1', '0')`);
        await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "full_name" character varying(100) NOT NULL, "password" character varying NOT NULL, "role" "public"."user_role_enum" NOT NULL DEFAULT '0', CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
    }

}
