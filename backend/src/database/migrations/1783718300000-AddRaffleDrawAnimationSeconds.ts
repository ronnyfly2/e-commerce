import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRaffleDrawAnimationSeconds1783718300000 implements MigrationInterface {
    name = 'AddRaffleDrawAnimationSeconds1783718300000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "raffles" ADD "draw_animation_seconds" integer NOT NULL DEFAULT '6'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "raffles" DROP COLUMN "draw_animation_seconds"`);
    }

}
