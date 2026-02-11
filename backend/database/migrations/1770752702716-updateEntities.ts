import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateEntities1770752702716 implements MigrationInterface {
    name = 'UpdateEntities1770752702716'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "time_slot" ("id" SERIAL NOT NULL, "date" character varying NOT NULL, "startTime" character varying NOT NULL, "endTime" character varying NOT NULL, "maxCapacity" integer NOT NULL, "currentBookings" integer NOT NULL DEFAULT '0', "isAvailable" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_03f782f8c4af029253f6ad5bacf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "menu" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "description" character varying(255), "price" numeric(6,2) NOT NULL, "availableFrom" date, "availableTo" date, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_51b63874cdce0d6898a0b2150f2" UNIQUE ("name"), CONSTRAINT "PK_35b2a8f47d153ff7a41860cceeb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."ingredient_category_enum" AS ENUM('BREAD', 'PROTEIN', 'CHEESE', 'VEGETABLE', 'SAUCE', 'SEASONING', 'OTHER')`);
        await queryRunner.query(`CREATE TABLE "ingredient" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "category" "public"."ingredient_category_enum" NOT NULL, "currentStock" numeric(10,2) NOT NULL, "minStock" numeric(10,2) NOT NULL, "maxStock" numeric(10,2) NOT NULL, "unit" character varying(50) NOT NULL, "costPerUnit" numeric(6,2) NOT NULL DEFAULT '0', "isAvailable" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_b6802ac7fbd37aa71d856a95d8f" UNIQUE ("name"), CONSTRAINT "PK_6f1e945604a0b59f56a57570e98" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_ingredient" ("id" SERIAL NOT NULL, "quantity" numeric(10,2) NOT NULL, "unit" character varying(50), "isRequired" boolean NOT NULL DEFAULT true, "extraPrice" numeric(6,2) NOT NULL DEFAULT '0', "productId" integer, "ingredientId" integer, CONSTRAINT "PK_e7431906c21f94c0152d6b0db99" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."product_category_enum" AS ENUM('SANDWICH', 'DRINK', 'DESSERT', 'SIDE', 'SAUCE')`);
        await queryRunner.query(`CREATE TABLE "product" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "category" "public"."product_category_enum" NOT NULL, "description" text, "basePrice" numeric(6,2) NOT NULL, "imageUrl" character varying, "isActive" boolean NOT NULL DEFAULT true, "isCustomizable" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_bebc9158e480b949565b4dc7a82" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "order_item" ("id" SERIAL NOT NULL, "quantity" integer NOT NULL, "unitPrice" numeric(10,2) NOT NULL, "totalPrice" numeric(10,2) NOT NULL, "customization" json, "specialInstructions" character varying, "orderId" integer, "productId" integer, CONSTRAINT "PK_d01158fe15b1ead5c26fd7f4e90" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."order_type_enum" AS ENUM('PICKUP', 'DELIVERY')`);
        await queryRunner.query(`CREATE TYPE "public"."order_status_enum" AS ENUM('PENDING', 'CONFIRMED', 'IN_PREPARATION', 'READY', 'IN_DELIVERY', 'COMPLETED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TYPE "public"."order_paymentstatus_enum" AS ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED')`);
        await queryRunner.query(`CREATE TABLE "order" ("id" SERIAL NOT NULL, "orderNumber" character varying NOT NULL, "type" "public"."order_type_enum" NOT NULL, "status" "public"."order_status_enum" NOT NULL DEFAULT 'PENDING', "paymentStatus" "public"."order_paymentstatus_enum" NOT NULL DEFAULT 'PENDING', "subtotal" numeric(10,2) NOT NULL, "deliveryFee" numeric(10,2) NOT NULL DEFAULT '0', "total" numeric(10,2) NOT NULL, "customerNote" text, "internalNote" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "completedAt" TIMESTAMP, "userId" integer, "deliveryAddressId" integer, "timeSlotId" integer, CONSTRAINT "UQ_4e9f8dd16ec084bca97b3262edb" UNIQUE ("orderNumber"), CONSTRAINT "PK_1031171c13130102495201e3e20" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "address" ("id" SERIAL NOT NULL, "street" character varying NOT NULL, "number" character varying NOT NULL, "postalCode" character varying NOT NULL, "city" character varying NOT NULL, "country" character varying NOT NULL DEFAULT 'Belgium', "complement" character varying, "label" character varying, "userId" integer, CONSTRAINT "PK_d92de1f82754668b5f5f5dd4fd5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('CLIENT', 'EMPLOYEE', 'ADMIN')`);
        await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "displayName" character varying(100) NOT NULL, "passwordHash" character varying NOT NULL, "phoneNumber" character varying, "role" "public"."user_role_enum" NOT NULL DEFAULT 'CLIENT', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "menu_products_product" ("menuId" integer NOT NULL, "productId" integer NOT NULL, CONSTRAINT "PK_267f3af98e981c83326825e74af" PRIMARY KEY ("menuId", "productId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1e70a77e10f78c8f6467c474b9" ON "menu_products_product" ("menuId") `);
        await queryRunner.query(`CREATE INDEX "IDX_e76cd16a8f74829af3d0de7385" ON "menu_products_product" ("productId") `);
        await queryRunner.query(`ALTER TABLE "product_ingredient" ADD CONSTRAINT "FK_d6fd52ba735eee4514d0a9a92cc" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_ingredient" ADD CONSTRAINT "FK_1525d4cd30cd2af9de7952a0fe2" FOREIGN KEY ("ingredientId") REFERENCES "ingredient"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_item" ADD CONSTRAINT "FK_646bf9ece6f45dbe41c203e06e0" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_item" ADD CONSTRAINT "FK_904370c093ceea4369659a3c810" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order" ADD CONSTRAINT "FK_caabe91507b3379c7ba73637b84" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order" ADD CONSTRAINT "FK_08fcc4e8c5af1570909f08f5029" FOREIGN KEY ("deliveryAddressId") REFERENCES "address"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order" ADD CONSTRAINT "FK_801738ff9202d80efc5656980ce" FOREIGN KEY ("timeSlotId") REFERENCES "time_slot"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "address" ADD CONSTRAINT "FK_d25f1ea79e282cc8a42bd616aa3" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "menu_products_product" ADD CONSTRAINT "FK_1e70a77e10f78c8f6467c474b9f" FOREIGN KEY ("menuId") REFERENCES "menu"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "menu_products_product" ADD CONSTRAINT "FK_e76cd16a8f74829af3d0de73854" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "menu_products_product" DROP CONSTRAINT "FK_e76cd16a8f74829af3d0de73854"`);
        await queryRunner.query(`ALTER TABLE "menu_products_product" DROP CONSTRAINT "FK_1e70a77e10f78c8f6467c474b9f"`);
        await queryRunner.query(`ALTER TABLE "address" DROP CONSTRAINT "FK_d25f1ea79e282cc8a42bd616aa3"`);
        await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT "FK_801738ff9202d80efc5656980ce"`);
        await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT "FK_08fcc4e8c5af1570909f08f5029"`);
        await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT "FK_caabe91507b3379c7ba73637b84"`);
        await queryRunner.query(`ALTER TABLE "order_item" DROP CONSTRAINT "FK_904370c093ceea4369659a3c810"`);
        await queryRunner.query(`ALTER TABLE "order_item" DROP CONSTRAINT "FK_646bf9ece6f45dbe41c203e06e0"`);
        await queryRunner.query(`ALTER TABLE "product_ingredient" DROP CONSTRAINT "FK_1525d4cd30cd2af9de7952a0fe2"`);
        await queryRunner.query(`ALTER TABLE "product_ingredient" DROP CONSTRAINT "FK_d6fd52ba735eee4514d0a9a92cc"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e76cd16a8f74829af3d0de7385"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1e70a77e10f78c8f6467c474b9"`);
        await queryRunner.query(`DROP TABLE "menu_products_product"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
        await queryRunner.query(`DROP TABLE "address"`);
        await queryRunner.query(`DROP TABLE "order"`);
        await queryRunner.query(`DROP TYPE "public"."order_paymentstatus_enum"`);
        await queryRunner.query(`DROP TYPE "public"."order_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."order_type_enum"`);
        await queryRunner.query(`DROP TABLE "order_item"`);
        await queryRunner.query(`DROP TABLE "product"`);
        await queryRunner.query(`DROP TYPE "public"."product_category_enum"`);
        await queryRunner.query(`DROP TABLE "product_ingredient"`);
        await queryRunner.query(`DROP TABLE "ingredient"`);
        await queryRunner.query(`DROP TYPE "public"."ingredient_category_enum"`);
        await queryRunner.query(`DROP TABLE "menu"`);
        await queryRunner.query(`DROP TABLE "time_slot"`);
    }

}
