import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users_roles" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_users_roles";
  CREATE TYPE "public"."enum_users_roles" AS ENUM('admin', 'customer', 'order-manager', 'content-manager');
  ALTER TABLE "users_roles" ALTER COLUMN "value" SET DATA TYPE "public"."enum_users_roles" USING "value"::"public"."enum_users_roles";
  ALTER TABLE "pages_blocks_faq" ADD COLUMN "enable_intro" boolean;
  ALTER TABLE "pages_blocks_faq" ADD COLUMN "intro_content" jsonb;
  ALTER TABLE "_pages_v_blocks_faq" ADD COLUMN "enable_intro" boolean;
  ALTER TABLE "_pages_v_blocks_faq" ADD COLUMN "intro_content" jsonb;
  ALTER TABLE "pages_blocks_faq" DROP COLUMN "title";
  ALTER TABLE "pages_blocks_faq" DROP COLUMN "description";
  ALTER TABLE "_pages_v_blocks_faq" DROP COLUMN "title";
  ALTER TABLE "_pages_v_blocks_faq" DROP COLUMN "description";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_faq" RENAME COLUMN "intro_content" TO "title";
  ALTER TABLE "_pages_v_blocks_faq" RENAME COLUMN "intro_content" TO "title";
  ALTER TABLE "_pages_v_blocks_faq" RENAME COLUMN "enable_intro" TO "description";
  ALTER TABLE "users_roles" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_users_roles";
  CREATE TYPE "public"."enum_users_roles" AS ENUM('admin', 'customer', 'staff', 'content_manager');
  ALTER TABLE "users_roles" ALTER COLUMN "value" SET DATA TYPE "public"."enum_users_roles" USING "value"::"public"."enum_users_roles";
  ALTER TABLE "pages_blocks_faq" ADD COLUMN "description" varchar;
  ALTER TABLE "pages_blocks_faq" DROP COLUMN "enable_intro";`)
}
