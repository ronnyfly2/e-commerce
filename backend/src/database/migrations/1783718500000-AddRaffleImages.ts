import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRaffleImages1783718500000 implements MigrationInterface {
    name = 'AddRaffleImages1783718500000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "raffles" ADD "images" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "raffles" DROP COLUMN "images"`);
    }

}
