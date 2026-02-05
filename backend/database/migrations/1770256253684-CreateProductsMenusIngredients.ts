import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProductsMenusIngredients1770256253684 implements MigrationInterface {
    name = 'CreateProductsMenusIngredients1770256253684'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "menu" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "description" character varying(255), "price" numeric(6,2) NOT NULL, "availableFrom" date, "availableTo" date, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_51b63874cdce0d6898a0b2150f2" UNIQUE ("name"), CONSTRAINT "PK_35b2a8f47d153ff7a41860cceeb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "ingredient" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "currentStock" integer NOT NULL, "minStock" integer NOT NULL, "maxStock" integer NOT NULL, CONSTRAINT "UQ_b6802ac7fbd37aa71d856a95d8f" UNIQUE ("name"), CONSTRAINT "PK_6f1e945604a0b59f56a57570e98" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."product_category_enum" AS ENUM('SANDWICH', 'DRINK', 'DESSERT')`);
        await queryRunner.query(`CREATE TABLE "product" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "category" "public"."product_category_enum" NOT NULL, "description" character varying(255), "price" numeric(6,2) NOT NULL, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_bebc9158e480b949565b4dc7a82" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "menu_products_product" ("menuId" integer NOT NULL, "productId" integer NOT NULL, CONSTRAINT "PK_267f3af98e981c83326825e74af" PRIMARY KEY ("menuId", "productId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1e70a77e10f78c8f6467c474b9" ON "menu_products_product" ("menuId") `);
        await queryRunner.query(`CREATE INDEX "IDX_e76cd16a8f74829af3d0de7385" ON "menu_products_product" ("productId") `);
        await queryRunner.query(`CREATE TABLE "product_ingredients_ingredient" ("productId" integer NOT NULL, "ingredientId" integer NOT NULL, CONSTRAINT "PK_5ef80d7e1f18da1a12043082894" PRIMARY KEY ("productId", "ingredientId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d12a293c29f0482f00f1f2f538" ON "product_ingredients_ingredient" ("productId") `);
        await queryRunner.query(`CREATE INDEX "IDX_9c2894b25a66c9533f22de9a06" ON "product_ingredients_ingredient" ("ingredientId") `);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "full_name"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "password"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "displayName" character varying(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "UQ_059e69c318702e93998f26d1528" UNIQUE ("displayName")`);
        await queryRunner.query(`ALTER TABLE "user" ADD "passwordHash" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" ADD "isActive" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TYPE "public"."user_role_enum" RENAME TO "user_role_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('CLIENT', 'ADMIN')`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "role" TYPE "public"."user_role_enum" USING "role"::"text"::"public"."user_role_enum"`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'CLIENT'`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum_old"`);
        await queryRunner.query(`ALTER TABLE "menu_products_product" ADD CONSTRAINT "FK_1e70a77e10f78c8f6467c474b9f" FOREIGN KEY ("menuId") REFERENCES "menu"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "menu_products_product" ADD CONSTRAINT "FK_e76cd16a8f74829af3d0de73854" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "product_ingredients_ingredient" ADD CONSTRAINT "FK_d12a293c29f0482f00f1f2f538b" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "product_ingredients_ingredient" ADD CONSTRAINT "FK_9c2894b25a66c9533f22de9a06e" FOREIGN KEY ("ingredientId") REFERENCES "ingredient"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_ingredients_ingredient" DROP CONSTRAINT "FK_9c2894b25a66c9533f22de9a06e"`);
        await queryRunner.query(`ALTER TABLE "product_ingredients_ingredient" DROP CONSTRAINT "FK_d12a293c29f0482f00f1f2f538b"`);
        await queryRunner.query(`ALTER TABLE "menu_products_product" DROP CONSTRAINT "FK_e76cd16a8f74829af3d0de73854"`);
        await queryRunner.query(`ALTER TABLE "menu_products_product" DROP CONSTRAINT "FK_1e70a77e10f78c8f6467c474b9f"`);
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum_old" AS ENUM('1', '0')`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "role" TYPE "public"."user_role_enum_old" USING "role"::"text"::"public"."user_role_enum_old"`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT '0'`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."user_role_enum_old" RENAME TO "user_role_enum"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "isActive"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "passwordHash"`);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "UQ_059e69c318702e93998f26d1528"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "displayName"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "password" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" ADD "full_name" character varying(100) NOT NULL`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9c2894b25a66c9533f22de9a06"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d12a293c29f0482f00f1f2f538"`);
        await queryRunner.query(`DROP TABLE "product_ingredients_ingredient"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e76cd16a8f74829af3d0de7385"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1e70a77e10f78c8f6467c474b9"`);
        await queryRunner.query(`DROP TABLE "menu_products_product"`);
        await queryRunner.query(`DROP TABLE "product"`);
        await queryRunner.query(`DROP TYPE "public"."product_category_enum"`);
        await queryRunner.query(`DROP TABLE "ingredient"`);
        await queryRunner.query(`DROP TABLE "menu"`);
    }

}
