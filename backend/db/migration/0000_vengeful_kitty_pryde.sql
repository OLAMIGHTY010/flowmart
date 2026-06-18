CREATE TYPE "public"."kyc_status" AS ENUM('unsubmitted', 'pending', 'under_review', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'confirmed', 'assigned', 'picked_up', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('bank_transfer', 'pay_on_delivery');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('super_admin', 'camp_logistics_coordinator', 'zone_coordinator', 'vendor', 'dispatch_rider', 'attendee');--> statement-breakpoint
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
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_ref" varchar(50) NOT NULL,
	"attendee_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"rider_id" uuid,
	"delivery_zone" varchar(100) NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"payment_method" "payment_method" DEFAULT 'pay_on_delivery' NOT NULL,
	"transaction_reference" varchar(255),
	"payment_proof_url" varchar(500),
	"delivery_pin" varchar(6),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_ref_unique" UNIQUE("order_ref")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"old_price" numeric(10, 2),
	"category" varchar(100),
	"brand" varchar(100),
	"weight" numeric(8, 2),
	"images" jsonb DEFAULT '[]'::jsonb,
	"stock_quantity" integer DEFAULT 0 NOT NULL,
	"image_url" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"role" "role" DEFAULT 'attendee' NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"otp" varchar(255),
	"otp_expiry" timestamp,
	"reset_token" varchar(255),
	"reset_token_expiry" timestamp,
	"phone" varchar(50),
	"date_of_birth" date,
	"gender" varchar(20),
	"avatar" varchar(500),
	"profile_completed" boolean DEFAULT false NOT NULL,
	"two_factor_enabled" boolean DEFAULT false NOT NULL,
	"privacy_settings" jsonb DEFAULT '{"profileVisibility":true,"showOnlineStatus":true,"locationTracking":false}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vendor_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"business_name" varchar(255),
	"business_phone" varchar(50),
	"state_region" varchar(100),
	"city" varchar(100),
	"bio" text,
	"cac_no" varchar(100),
	"camp_certificate_id" varchar(100),
	"bank_name" varchar(100),
	"account_number" varchar(50),
	"account_name" varchar(255),
	"rating" numeric(3, 2) DEFAULT '0.00',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vendor_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "welfare_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"delivery_ref" varchar(50),
	"event_id" uuid NOT NULL,
	"zone_id" varchar(100) NOT NULL,
	"rider_id" uuid,
	"total_items" integer NOT NULL,
	"distributed_items" integer DEFAULT 0 NOT NULL,
	"shortage_reported" integer DEFAULT 0 NOT NULL,
	"shortage_description" text,
	"shortage_reported_at" timestamp,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "welfare_allocations_delivery_ref_unique" UNIQUE("delivery_ref")
);
--> statement-breakpoint
CREATE TABLE "welfare_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"date" timestamp NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "kyc_submissions" ADD CONSTRAINT "kyc_submissions_vendor_id_users_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_attendee_id_users_id_fk" FOREIGN KEY ("attendee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_vendor_id_users_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_rider_id_users_id_fk" FOREIGN KEY ("rider_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_vendor_id_users_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_profiles" ADD CONSTRAINT "vendor_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "welfare_allocations" ADD CONSTRAINT "welfare_allocations_event_id_welfare_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."welfare_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "welfare_allocations" ADD CONSTRAINT "welfare_allocations_rider_id_users_id_fk" FOREIGN KEY ("rider_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "welfare_events" ADD CONSTRAINT "welfare_events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;