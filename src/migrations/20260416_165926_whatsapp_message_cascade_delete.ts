import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "whatsapp_messages"
      DROP CONSTRAINT "whatsapp_messages_conversation_id_whatsapp_sessions_id_fk";

    ALTER TABLE "whatsapp_messages"
      ADD CONSTRAINT "whatsapp_messages_conversation_id_whatsapp_sessions_id_fk"
      FOREIGN KEY ("conversation_id")
      REFERENCES "public"."whatsapp_sessions"("id")
      ON DELETE cascade
      ON UPDATE no action;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "whatsapp_messages"
      DROP CONSTRAINT "whatsapp_messages_conversation_id_whatsapp_sessions_id_fk";

    ALTER TABLE "whatsapp_messages"
      ADD CONSTRAINT "whatsapp_messages_conversation_id_whatsapp_sessions_id_fk"
      FOREIGN KEY ("conversation_id")
      REFERENCES "public"."whatsapp_sessions"("id")
      ON DELETE set null
      ON UPDATE no action;
  `)
}
