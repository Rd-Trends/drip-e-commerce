import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_users_roles" ADD VALUE 'staff';
  ALTER TYPE "public"."enum_users_roles" ADD VALUE 'content_manager';
  ALTER TABLE "categories" ADD COLUMN "image_id" integer;
  ALTER TABLE "products" ADD COLUMN "cost_price" numeric;
  ALTER TABLE "_products_v" ADD COLUMN "version_cost_price" numeric;
  ALTER TABLE "variants" ADD COLUMN "cost_price" numeric;
  ALTER TABLE "_variants_v" ADD COLUMN "version_cost_price" numeric;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "categories_image_idx" ON "categories" USING btree ("image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "categories" DROP CONSTRAINT "categories_image_id_media_id_fk";
  
  ALTER TABLE "users_roles" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_users_roles";
  CREATE TYPE "public"."enum_users_roles" AS ENUM('admin', 'customer');
  ALTER TABLE "users_roles" ALTER COLUMN "value" SET DATA TYPE "public"."enum_users_roles" USING "value"::"public"."enum_users_roles";
  DROP INDEX "categories_image_idx";
  ALTER TABLE "categories" DROP COLUMN "image_id";
  ALTER TABLE "products" DROP COLUMN "cost_price";
  ALTER TABLE "_products_v" DROP COLUMN "version_cost_price";
  ALTER TABLE "variants" DROP COLUMN "cost_price";
  ALTER TABLE "_variants_v" DROP COLUMN "version_cost_price";`)
}
