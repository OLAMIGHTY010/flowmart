CREATE TABLE "vendor_kyc" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"business_name" varchar(255) NOT NULL,
	"cac_no" varchar(255),
	"camp_certificate_id" varchar(255),
	"bank_name" varchar(255) NOT NULL,
	"account_number" varchar(20) NOT NULL,
	"account_name" varchar(255) NOT NULL,
	"government_id_type" varchar(100) NOT NULL,
	"guarantor_name" varchar(255) NOT NULL,
	"guarantor_phone" varchar(50) NOT NULL,
	"guarantor_relationship" varchar(100) NOT NULL,
	"government_id_file" text,
	"camp_certificate_file" text,
	"guarantor_id_file" text,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vendor_kyc_vendor_id_unique" UNIQUE("vendor_id")
);
--> statement-breakpoint
CREATE TABLE "vendor_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"business_phone" varchar(50) NOT NULL,
	"state_region" varchar(100) NOT NULL,
	"city" varchar(100) NOT NULL,
	"bio" text,
	"avatar" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vendor_profiles_vendor_id_unique" UNIQUE("vendor_id")
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sku" varchar(100);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "old_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "images" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "category" varchar(100);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "brand" varchar(100);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "weight" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile_completed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "vendor_kyc" ADD CONSTRAINT "vendor_kyc_vendor_id_users_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_profiles" ADD CONSTRAINT "vendor_profiles_vendor_id_users_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;