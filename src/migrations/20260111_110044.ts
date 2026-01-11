import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Step 1: Drop all foreign key constraints
  await db.execute(sql`
    ALTER TABLE "orders_items" DROP CONSTRAINT IF EXISTS "orders_items_parent_id_fk";
    ALTER TABLE "orders_rels" DROP CONSTRAINT IF EXISTS "orders_rels_parent_fk";
    ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_order_id_orders_id_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_orders_fk";
  `)

  // Step 2: Change data types from integer/serial to varchar
  await db.execute(sql`
    ALTER TABLE "orders" ALTER COLUMN "id" DROP DEFAULT;
    ALTER TABLE "orders" ALTER COLUMN "id" TYPE varchar USING "id"::text;
    ALTER TABLE "orders_items" ALTER COLUMN "_parent_id" TYPE varchar USING "_parent_id"::text;
    ALTER TABLE "orders_rels" ALTER COLUMN "parent_id" TYPE varchar USING "parent_id"::text;
    ALTER TABLE "transactions" ALTER COLUMN "order_id" TYPE varchar USING "order_id"::text;
    ALTER TABLE "payload_locked_documents_rels" ALTER COLUMN "orders_id" TYPE varchar USING "orders_id"::text;
  `)

  // Step 3: Recreate foreign key constraints with varchar columns
  await db.execute(sql`
    ALTER TABLE "orders_items" ADD CONSTRAINT "orders_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    ALTER TABLE "orders_rels" ADD CONSTRAINT "orders_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    ALTER TABLE "transactions" ADD CONSTRAINT "transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_orders_fk" FOREIGN KEY ("orders_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Step 1: Drop foreign key constraints
  await db.execute(sql`
    ALTER TABLE "orders_items" DROP CONSTRAINT IF EXISTS "orders_items_parent_id_fk";
    ALTER TABLE "orders_rels" DROP CONSTRAINT IF EXISTS "orders_rels_parent_fk";
    ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_order_id_orders_id_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_orders_fk";
  `)

  // Step 2: Change data types back from varchar to integer/serial
  await db.execute(sql`
    ALTER TABLE "orders_items" ALTER COLUMN "_parent_id" TYPE integer USING "_parent_id"::integer;
    ALTER TABLE "orders_rels" ALTER COLUMN "parent_id" TYPE integer USING "parent_id"::integer;
    ALTER TABLE "transactions" ALTER COLUMN "order_id" TYPE integer USING "order_id"::integer;
    ALTER TABLE "payload_locked_documents_rels" ALTER COLUMN "orders_id" TYPE integer USING "orders_id"::integer;
    ALTER TABLE "orders" ALTER COLUMN "id" TYPE integer USING "id"::integer;
    CREATE SEQUENCE IF NOT EXISTS orders_id_seq OWNED BY "orders"."id";
    SELECT setval('orders_id_seq', (SELECT MAX(id) FROM "orders"));
    ALTER TABLE "orders" ALTER COLUMN "id" SET DEFAULT nextval('orders_id_seq');
  `)

  // Step 3: Recreate foreign key constraints with integer columns
  await db.execute(sql`
    ALTER TABLE "orders_items" ADD CONSTRAINT "orders_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    ALTER TABLE "orders_rels" ADD CONSTRAINT "orders_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    ALTER TABLE "transactions" ADD CONSTRAINT "transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_orders_fk" FOREIGN KEY ("orders_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
  `)
}
