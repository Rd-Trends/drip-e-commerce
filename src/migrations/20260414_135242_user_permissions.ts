import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_permissions" AS ENUM('products:read', 'products:write', 'categories:manage', 'pages:read', 'pages:write', 'media:manage', 'variants:manage', 'forms:manage', 'banner:manage', 'header:manage', 'footer:manage', 'home:manage', 'shipping:manage', 'orders:read', 'orders:write', 'transactions:read', 'transactions:write', 'coupons:read', 'coupons:write', 'users:manage', 'analytics:view', 'whatsapp:manage');
  ALTER TYPE "public"."enum_users_roles" RENAME TO "enum_users_role";
  CREATE TABLE "users_permissions" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_users_permissions",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  DROP TABLE "users_roles" CASCADE;
  ALTER TABLE "users" ADD COLUMN "role" "enum_users_role" DEFAULT 'customer';
  ALTER TABLE "users_permissions" ADD CONSTRAINT "users_permissions_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_permissions_order_idx" ON "users_permissions" USING btree ("order");
  CREATE INDEX "users_permissions_parent_idx" ON "users_permissions" USING btree ("parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_users_role" RENAME TO "enum_users_roles";
  CREATE TABLE "users_roles" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_users_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  DROP TABLE "users_permissions" CASCADE;
  ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_roles_order_idx" ON "users_roles" USING btree ("order");
  CREATE INDEX "users_roles_parent_idx" ON "users_roles" USING btree ("parent_id");
  ALTER TABLE "users" DROP COLUMN "role";
  DROP TYPE "public"."enum_users_permissions";`)
}
