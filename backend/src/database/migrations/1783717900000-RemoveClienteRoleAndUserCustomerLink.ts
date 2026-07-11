import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Merges "Cliente"-role staff accounts into the CRM `customers` table as the single source of truth
 * for a customer — deletes any user account still holding the "Cliente" role and the role itself,
 * and drops the now-removed `users.customer_id` link column (kept as IF EXISTS since this DB's schema
 * had already been auto-synced ahead of this migration via `synchronize: true`).
 */
export class RemoveClienteRoleAndUserCustomerLink1783717900000 implements MigrationInterface {
    name = 'RemoveClienteRoleAndUserCustomerLink1783717900000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "users" WHERE "role_id" IN (SELECT "id" FROM "roles" WHERE "name" = 'Cliente' AND "company_id" IS NULL)`);
        await queryRunner.query(`DELETE FROM "roles" WHERE "name" = 'Cliente' AND "company_id" IS NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_a1b2c3d4e5f6a7b8c9d0e1f2a3b4"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_a1b2c3d4e5f6a7b8c9d0e1f2a3"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "customer_id"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "customer_id" uuid`);
        await queryRunner.query(`CREATE INDEX "IDX_a1b2c3d4e5f6a7b8c9d0e1f2a3" ON "users"  ("customer_id") `);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_a1b2c3d4e5f6a7b8c9d0e1f2a3b4" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        // Note: this only restores the "Cliente" role row, not the deleted user accounts —
        // deleted data (name/email/password) cannot be reconstructed by a down-migration.
        await queryRunner.query(`INSERT INTO "roles" ("id", "company_id", "name", "description", "permissions", "is_system") VALUES (uuid_generate_v4(), NULL, 'Cliente', 'Cuenta de cliente para el portal web. Solo puede consultar sus propios pedidos. Sin acceso al panel de administración.', 'order:view', true)`);
    }

}
