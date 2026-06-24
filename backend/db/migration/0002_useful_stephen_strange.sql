CREATE TYPE "public"."product_type" AS ENUM('food', 'retail');--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "stock_quantity" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "product_type" "product_type" DEFAULT 'retail' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "preparation_time" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "modifiers" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "variants" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "dietary_tags" jsonb DEFAULT '[]'::jsonb;