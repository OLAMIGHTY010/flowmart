CREATE TYPE "public"."kyc_status" AS ENUM('unsubmitted', 'pending', 'under_review', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('bank_transfer', 'pay_on_delivery');--> statement-breakpoint
CREATE TABLE "kyc_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"status" "kyc_status" DEFAULT 'unsubmitted' NOT NULL,
	"reference_id" varchar(100),
	"government_id_type" varchar(50),
	"guarantor_name" varchar(255),
	"guarantor_phone" varchar(50),
	"guarantor_relationship" varchar(100),
	"government_id_url" varchar(500),
	"camp_certificate_url" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "kyc_submissions_vendor_id_unique" UNIQUE("vendor_id"),
	CONSTRAINT "kyc_submissions_reference_id_unique" UNIQUE("reference_id")
);
--> statement-breakpoint
CREATE TABLE "welfare_inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"allocated" integer DEFAULT 0 NOT NULL,
	"unit" varchar(50) NOT NULL,
	"status" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "images" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "images" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "weight" SET DATA TYPE numeric(8, 2);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "order_ref" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_method" "payment_method" DEFAULT 'pay_on_delivery' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "transaction_reference" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_proof_url" varchar(500);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "otp" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "otp_expiry" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reset_token" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reset_token_expiry" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar" varchar(500);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "two_factor_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "privacy_settings" jsonb DEFAULT '{"profileVisibility":true,"showOnlineStatus":true,"locationTracking":false}'::jsonb;--> statement-breakpoint
ALTER TABLE "welfare_allocations" ADD COLUMN "delivery_ref" varchar(50);--> statement-breakpoint
ALTER TABLE "welfare_allocations" ADD COLUMN "rider_id" uuid;--> statement-breakpoint
ALTER TABLE "welfare_allocations" ADD COLUMN "shortage_description" text;--> statement-breakpoint
ALTER TABLE "welfare_allocations" ADD COLUMN "shortage_reported_at" timestamp;--> statement-breakpoint
ALTER TABLE "kyc_submissions" ADD CONSTRAINT "kyc_submissions_vendor_id_users_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "welfare_allocations" ADD CONSTRAINT "welfare_allocations_rider_id_users_id_fk" FOREIGN KEY ("rider_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "image_url";--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_order_ref_unique" UNIQUE("order_ref");--> statement-breakpoint
ALTER TABLE "welfare_allocations" ADD CONSTRAINT "welfare_allocations_delivery_ref_unique" UNIQUE("delivery_ref");