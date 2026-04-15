import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_whatsapp_messages_type" AS ENUM('text', 'image');
  CREATE TABLE "whatsapp_messages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"conversation_id" integer NOT NULL,
  	"type" "enum_whatsapp_messages_type" NOT NULL,
  	"text" varchar,
  	"image_id" integer,
  	"source_message_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "whatsapp_sessions_messages" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "whatsapp_sessions_messages" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "whatsapp_messages_id" integer;
  ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_conversation_id_whatsapp_sessions_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."whatsapp_sessions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "whatsapp_messages_conversation_idx" ON "whatsapp_messages" USING btree ("conversation_id");
  CREATE INDEX "whatsapp_messages_image_idx" ON "whatsapp_messages" USING btree ("image_id");
  CREATE UNIQUE INDEX "whatsapp_messages_source_message_id_idx" ON "whatsapp_messages" USING btree ("source_message_id");
  CREATE INDEX "whatsapp_messages_updated_at_idx" ON "whatsapp_messages" USING btree ("updated_at");
  CREATE INDEX "whatsapp_messages_created_at_idx" ON "whatsapp_messages" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_whatsapp_messages_fk" FOREIGN KEY ("whatsapp_messages_id") REFERENCES "public"."whatsapp_messages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_whatsapp_messages_id_idx" ON "payload_locked_documents_rels" USING btree ("whatsapp_messages_id");
  DROP TYPE "public"."enum_whatsapp_sessions_messages_type";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_whatsapp_sessions_messages_type" AS ENUM('text', 'image');
  CREATE TABLE "whatsapp_sessions_messages" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"type" "enum_whatsapp_sessions_messages_type" NOT NULL,
  	"text" varchar,
  	"image_id" integer
  );
  
  ALTER TABLE "whatsapp_messages" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "whatsapp_messages" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_whatsapp_messages_fk";
  
  DROP INDEX "payload_locked_documents_rels_whatsapp_messages_id_idx";
  ALTER TABLE "whatsapp_sessions_messages" ADD CONSTRAINT "whatsapp_sessions_messages_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "whatsapp_sessions_messages" ADD CONSTRAINT "whatsapp_sessions_messages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."whatsapp_sessions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "whatsapp_sessions_messages_order_idx" ON "whatsapp_sessions_messages" USING btree ("_order");
  CREATE INDEX "whatsapp_sessions_messages_parent_id_idx" ON "whatsapp_sessions_messages" USING btree ("_parent_id");
  CREATE INDEX "whatsapp_sessions_messages_image_idx" ON "whatsapp_sessions_messages" USING btree ("image_id");
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "whatsapp_messages_id";
  DROP TYPE "public"."enum_whatsapp_messages_type";`)
}
