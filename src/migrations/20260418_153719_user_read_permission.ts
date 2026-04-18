import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_users_permissions" ADD VALUE 'users:view' BEFORE 'users:manage';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users_permissions" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_users_permissions";
  CREATE TYPE "public"."enum_users_permissions" AS ENUM('products:read', 'products:write', 'categories:manage', 'pages:read', 'pages:write', 'media:manage', 'variants:manage', 'forms:manage', 'banner:manage', 'header:manage', 'footer:manage', 'home:manage', 'shipping:manage', 'orders:read', 'orders:write', 'transactions:read', 'transactions:write', 'coupons:read', 'coupons:write', 'users:manage', 'analytics:view', 'whatsapp:manage');
  ALTER TABLE "users_permissions" ALTER COLUMN "value" SET DATA TYPE "public"."enum_users_permissions" USING "value"::"public"."enum_users_permissions";`)
}
