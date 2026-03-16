import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "coupons_rels" DROP CONSTRAINT "coupons_rels_users_fk";
  
  DROP INDEX "coupons_rels_users_id_idx";
  ALTER TABLE "orders" ADD COLUMN "coupon_id" integer;
  ALTER TABLE "orders" ADD COLUMN "coupon_code" varchar;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "orders_coupon_idx" ON "orders" USING btree ("coupon_id");
  ALTER TABLE "coupons" DROP COLUMN "usage_count";
  ALTER TABLE "coupons_rels" DROP COLUMN "users_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "orders" DROP CONSTRAINT "orders_coupon_id_coupons_id_fk";
  
  DROP INDEX "orders_coupon_idx";
  ALTER TABLE "coupons" ADD COLUMN "usage_count" numeric DEFAULT 0;
  ALTER TABLE "coupons_rels" ADD COLUMN "users_id" integer;
  ALTER TABLE "coupons_rels" ADD CONSTRAINT "coupons_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "coupons_rels_users_id_idx" ON "coupons_rels" USING btree ("users_id");
  ALTER TABLE "orders" DROP COLUMN "coupon_id";
  ALTER TABLE "orders" DROP COLUMN "coupon_code";`)
}
