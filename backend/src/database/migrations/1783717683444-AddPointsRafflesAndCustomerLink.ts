import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPointsRafflesAndCustomerLink1783717683444 implements MigrationInterface {
    name = 'AddPointsRafflesAndCustomerLink1783717683444'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "points_transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "company_id" uuid NOT NULL, "customer_id" uuid NOT NULL, "type" character varying(20) NOT NULL, "points" integer NOT NULL, "reason" text, "order_id" uuid, "created_by_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b368729603fe6bc50fdb6750b33" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_694ddb8ce46fade04c5d7e7e0b" ON "points_transactions"  ("company_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_bd6b7ca42fe906e1c9b88ce16e" ON "points_transactions"  ("customer_id") `);
        await queryRunner.query(`CREATE TABLE "raffles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "company_id" uuid NOT NULL, "name" character varying(255) NOT NULL, "description" text, "prize_description" character varying(500) NOT NULL, "starts_at" TIMESTAMP WITH TIME ZONE NOT NULL, "ends_at" TIMESTAMP WITH TIME ZONE NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'DRAFT', "winner_customer_id" uuid, "drawn_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_052c636fce78a0481c29fab2aa1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ae5a0daed9978d35e365f30292" ON "raffles"  ("company_id") `);
        await queryRunner.query(`CREATE TABLE "raffle_entries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "raffle_id" uuid NOT NULL, "customer_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_1ff48eda2452831c7cddb23e060" UNIQUE ("raffle_id", "customer_id"), CONSTRAINT "PK_41d589422354bba645c284cf174" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c8d5595a86be987379c277527a" ON "raffle_entries"  ("raffle_id") `);
        await queryRunner.query(`ALTER TABLE "customers" ADD "points_balance" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "products" ADD "points_awarded" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "points_credited" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "customer_id" uuid`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD "points_awarded" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "customer_id" uuid`);
        await queryRunner.query(`CREATE INDEX "IDX_772d0ce0473ac2ccfa26060dbe" ON "orders"  ("customer_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_a1b2c3d4e5f6a7b8c9d0e1f2a3" ON "users"  ("customer_id") `);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_772d0ce0473ac2ccfa26060dbe9" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_a1b2c3d4e5f6a7b8c9d0e1f2a3b4" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "points_transactions" ADD CONSTRAINT "FK_bd6b7ca42fe906e1c9b88ce16e6" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "raffles" ADD CONSTRAINT "FK_070a4d8e4fd54d0df959490626b" FOREIGN KEY ("winner_customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "raffle_entries" ADD CONSTRAINT "FK_c8d5595a86be987379c277527aa" FOREIGN KEY ("raffle_id") REFERENCES "raffles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "raffle_entries" ADD CONSTRAINT "FK_d98903c86bd7286fe2b398369bb" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "raffle_entries" DROP CONSTRAINT "FK_d98903c86bd7286fe2b398369bb"`);
        await queryRunner.query(`ALTER TABLE "raffle_entries" DROP CONSTRAINT "FK_c8d5595a86be987379c277527aa"`);
        await queryRunner.query(`ALTER TABLE "raffles" DROP CONSTRAINT "FK_070a4d8e4fd54d0df959490626b"`);
        await queryRunner.query(`ALTER TABLE "points_transactions" DROP CONSTRAINT "FK_bd6b7ca42fe906e1c9b88ce16e6"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_a1b2c3d4e5f6a7b8c9d0e1f2a3b4"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_772d0ce0473ac2ccfa26060dbe9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a1b2c3d4e5f6a7b8c9d0e1f2a3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_772d0ce0473ac2ccfa26060dbe"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "customer_id"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN "points_awarded"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "customer_id"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "points_credited"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "points_awarded"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "points_balance"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c8d5595a86be987379c277527a"`);
        await queryRunner.query(`DROP TABLE "raffle_entries"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ae5a0daed9978d35e365f30292"`);
        await queryRunner.query(`DROP TABLE "raffles"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bd6b7ca42fe906e1c9b88ce16e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_694ddb8ce46fade04c5d7e7e0b"`);
        await queryRunner.query(`DROP TABLE "points_transactions"`);
    }

}
