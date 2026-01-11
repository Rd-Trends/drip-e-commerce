import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_coupons_type" ADD VALUE 'free-shipping';
  ALTER TYPE "public"."enum_orders_status" ADD VALUE 'shipped' BEFORE 'completed';
  ALTER TABLE "addresses" ALTER COLUMN "customer_id" DROP NOT NULL;
  ALTER TABLE "addresses" DROP COLUMN "postal_code";
  ALTER TABLE "orders" DROP COLUMN "shipping_address_postal_code";
  ALTER TABLE "transactions" DROP COLUMN "billing_address_postal_code";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "coupons" ALTER COLUMN "type" SET DATA TYPE text;
  DROP TYPE "public"."enum_coupons_type";
  CREATE TYPE "public"."enum_coupons_type" AS ENUM('percentage', 'fixed');
  ALTER TABLE "coupons" ALTER COLUMN "type" SET DATA TYPE "public"."enum_coupons_type" USING "type"::"public"."enum_coupons_type";
  ALTER TABLE "orders" ALTER COLUMN "status" SET DATA TYPE text;
  ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'processing'::text;
  DROP TYPE "public"."enum_orders_status";
  CREATE TYPE "public"."enum_orders_status" AS ENUM('processing', 'completed', 'cancelled', 'refunded');
  ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'processing'::"public"."enum_orders_status";
  ALTER TABLE "orders" ALTER COLUMN "status" SET DATA TYPE "public"."enum_orders_status" USING "status"::"public"."enum_orders_status";
  ALTER TABLE "addresses" ALTER COLUMN "customer_id" SET NOT NULL;
  ALTER TABLE "addresses" ADD COLUMN "postal_code" varchar;
  ALTER TABLE "orders" ADD COLUMN "shipping_address_postal_code" varchar;
  ALTER TABLE "transactions" ADD COLUMN "billing_address_postal_code" varchar;`)
}
