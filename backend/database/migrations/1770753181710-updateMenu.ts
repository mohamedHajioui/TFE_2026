import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateMenu1770753181710 implements MigrationInterface {
    name = 'UpdateMenu1770753181710'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "menu_products" ("menu_id" integer NOT NULL, "product_id" integer NOT NULL, CONSTRAINT "PK_b8dfaafecddd73f2b5a6305b640" PRIMARY KEY ("menu_id", "product_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_20ea1121a6054b292017fcf6aa" ON "menu_products" ("menu_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_2f6a9884047971d292da3e5e62" ON "menu_products" ("product_id") `);
        await queryRunner.query(`ALTER TABLE "menu" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "menu" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "menu" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "menu" ADD "description" text`);
        await queryRunner.query(`ALTER TABLE "menu" DROP COLUMN "availableFrom"`);
        await queryRunner.query(`ALTER TABLE "menu" ADD "availableFrom" character varying`);
        await queryRunner.query(`ALTER TABLE "menu" DROP COLUMN "availableTo"`);
        await queryRunner.query(`ALTER TABLE "menu" ADD "availableTo" character varying`);
        await queryRunner.query(`ALTER TABLE "menu_products" ADD CONSTRAINT "FK_20ea1121a6054b292017fcf6aa9" FOREIGN KEY ("menu_id") REFERENCES "menu"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "menu_products" ADD CONSTRAINT "FK_2f6a9884047971d292da3e5e621" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "menu_products" DROP CONSTRAINT "FK_2f6a9884047971d292da3e5e621"`);
        await queryRunner.query(`ALTER TABLE "menu_products" DROP CONSTRAINT "FK_20ea1121a6054b292017fcf6aa9"`);
        await queryRunner.query(`ALTER TABLE "menu" DROP COLUMN "availableTo"`);
        await queryRunner.query(`ALTER TABLE "menu" ADD "availableTo" date`);
        await queryRunner.query(`ALTER TABLE "menu" DROP COLUMN "availableFrom"`);
        await queryRunner.query(`ALTER TABLE "menu" ADD "availableFrom" date`);
        await queryRunner.query(`ALTER TABLE "menu" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "menu" ADD "description" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "menu" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "menu" DROP COLUMN "createdAt"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2f6a9884047971d292da3e5e62"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_20ea1121a6054b292017fcf6aa"`);
        await queryRunner.query(`DROP TABLE "menu_products"`);
    }

}
