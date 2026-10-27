-- Custom SQL migration file for NIPOST Postcode integration
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "delivery_address" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "delivery_postcode" varchar(20);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "address_source" varchar(20);--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN IF NOT EXISTS "postcode" varchar(20);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "postcode_zone_map" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prefix" varchar(10) NOT NULL UNIQUE,
	"zone_id" uuid NOT NULL REFERENCES "delivery_zones"("id"),
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "postcode_zone_prefix_idx" ON "postcode_zone_map" USING btree ("prefix");
