import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_whatsapp_sessions_messages_type" AS ENUM('text', 'image');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_whatsapp_sessions_status" AS ENUM('pending', 'processing', 'done', 'failed');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS "whatsapp_sessions" (
      "id" serial PRIMARY KEY NOT NULL,
      "phone" varchar NOT NULL,
      "sender_name" varchar,
      "status" "enum_whatsapp_sessions_status" DEFAULT 'pending' NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "whatsapp_sessions_messages" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "type" "enum_whatsapp_sessions_messages_type" NOT NULL,
      "text" varchar,
      "image_id" integer
    );

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "whatsapp_sessions_id" integer;

    DO $$ BEGIN
      ALTER TABLE "whatsapp_sessions_messages"
        ADD CONSTRAINT "whatsapp_sessions_messages_image_id_media_id_fk"
        FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "whatsapp_sessions_messages"
        ADD CONSTRAINT "whatsapp_sessions_messages_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."whatsapp_sessions"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "whatsapp_sessions_messages_order_idx" ON "whatsapp_sessions_messages" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "whatsapp_sessions_messages_parent_id_idx" ON "whatsapp_sessions_messages" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "whatsapp_sessions_messages_image_idx" ON "whatsapp_sessions_messages" USING btree ("image_id");
    CREATE INDEX IF NOT EXISTS "whatsapp_sessions_phone_idx" ON "whatsapp_sessions" USING btree ("phone");
    CREATE INDEX IF NOT EXISTS "whatsapp_sessions_updated_at_idx" ON "whatsapp_sessions" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "whatsapp_sessions_created_at_idx" ON "whatsapp_sessions" USING btree ("created_at");

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_whatsapp_sessions_fk"
        FOREIGN KEY ("whatsapp_sessions_id") REFERENCES "public"."whatsapp_sessions"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_whatsapp_sessions_id_idx" ON "payload_locked_documents_rels" USING btree ("whatsapp_sessions_id");
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "whatsapp_sessions_messages" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "whatsapp_sessions" DISABLE ROW LEVEL SECURITY;
    DROP TABLE IF EXISTS "whatsapp_sessions_messages" CASCADE;
    DROP TABLE IF EXISTS "whatsapp_sessions" CASCADE;

    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_whatsapp_sessions_fk";

    DROP INDEX IF EXISTS "payload_locked_documents_rels_whatsapp_sessions_id_idx";

    ALTER TABLE "payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "whatsapp_sessions_id";

    DROP TYPE IF EXISTS "public"."enum_whatsapp_sessions_messages_type";
    DROP TYPE IF EXISTS "public"."enum_whatsapp_sessions_status";
  `)
}
