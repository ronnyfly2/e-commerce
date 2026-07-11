import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRaffleCostPointsAndPrizeDelivery1783718100000 implements MigrationInterface {
    name = 'AddRaffleCostPointsAndPrizeDelivery1783718100000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "raffles" ADD "cost_points" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "raffles" ADD "prize_status" character varying(20) NOT NULL DEFAULT 'PENDING'`);
        await queryRunner.query(`ALTER TABLE "raffles" ADD "prize_delivery_image_url" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "raffles" ADD "prize_delivered_at" TIMESTAMP WITH TIME ZONE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "raffles" DROP COLUMN "prize_delivered_at"`);
        await queryRunner.query(`ALTER TABLE "raffles" DROP COLUMN "prize_delivery_image_url"`);
        await queryRunner.query(`ALTER TABLE "raffles" DROP COLUMN "prize_status"`);
        await queryRunner.query(`ALTER TABLE "raffles" DROP COLUMN "cost_points"`);
    }

}
