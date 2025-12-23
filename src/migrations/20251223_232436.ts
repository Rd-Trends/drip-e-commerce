import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_home_hero_slides_content_align" AS ENUM('left', 'center', 'right');
  CREATE TYPE "public"."enum_home_hero_slides_theme" AS ENUM('dark', 'light');
  CREATE TYPE "public"."enum_home_product_sections_type" AS ENUM('category', 'featured', 'latest', 'hottest');
  CREATE TABLE "home_hero_slides_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_label" varchar NOT NULL,
  	"link_url" varchar NOT NULL,
  	"link_new_tab" boolean
  );
  
  CREATE TABLE "home_hero_slides" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"title" varchar NOT NULL,
  	"subtitle" varchar,
  	"description" varchar,
  	"content_align" "enum_home_hero_slides_content_align" DEFAULT 'left',
  	"theme" "enum_home_hero_slides_theme" DEFAULT 'dark'
  );
  
  CREATE TABLE "home_product_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"type" "enum_home_product_sections_type" NOT NULL,
  	"category_id" integer,
  	"show_view_all" boolean DEFAULT true
  );
  
  CREATE TABLE "home" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "categories" ADD COLUMN "image_id" integer;
  ALTER TABLE "products" ADD COLUMN "is_featured" boolean DEFAULT false;
  ALTER TABLE "_products_v" ADD COLUMN "version_is_featured" boolean DEFAULT false;
  ALTER TABLE "home_hero_slides_links" ADD CONSTRAINT "home_hero_slides_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_hero_slides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_hero_slides" ADD CONSTRAINT "home_hero_slides_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_hero_slides" ADD CONSTRAINT "home_hero_slides_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_product_sections" ADD CONSTRAINT "home_product_sections_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_product_sections" ADD CONSTRAINT "home_product_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "home_hero_slides_links_order_idx" ON "home_hero_slides_links" USING btree ("_order");
  CREATE INDEX "home_hero_slides_links_parent_id_idx" ON "home_hero_slides_links" USING btree ("_parent_id");
  CREATE INDEX "home_hero_slides_order_idx" ON "home_hero_slides" USING btree ("_order");
  CREATE INDEX "home_hero_slides_parent_id_idx" ON "home_hero_slides" USING btree ("_parent_id");
  CREATE INDEX "home_hero_slides_image_idx" ON "home_hero_slides" USING btree ("image_id");
  CREATE INDEX "home_product_sections_order_idx" ON "home_product_sections" USING btree ("_order");
  CREATE INDEX "home_product_sections_parent_id_idx" ON "home_product_sections" USING btree ("_parent_id");
  CREATE INDEX "home_product_sections_category_idx" ON "home_product_sections" USING btree ("category_id");
  ALTER TABLE "categories" ADD CONSTRAINT "categories_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "categories_image_idx" ON "categories" USING btree ("image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home_hero_slides_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_hero_slides" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_product_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "home_hero_slides_links" CASCADE;
  DROP TABLE "home_hero_slides" CASCADE;
  DROP TABLE "home_product_sections" CASCADE;
  DROP TABLE "home" CASCADE;
  ALTER TABLE "categories" DROP CONSTRAINT "categories_image_id_media_id_fk";
  
  DROP INDEX "categories_image_idx";
  ALTER TABLE "categories" DROP COLUMN "image_id";
  ALTER TABLE "products" DROP COLUMN "is_featured";
  ALTER TABLE "_products_v" DROP COLUMN "version_is_featured";
  DROP TYPE "public"."enum_home_hero_slides_content_align";
  DROP TYPE "public"."enum_home_hero_slides_theme";
  DROP TYPE "public"."enum_home_product_sections_type";`)
}
