CREATE TABLE "rider_kyc" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rider_id" uuid NOT NULL,
	"bank_name" varchar(255) NOT NULL,
	"account_number" varchar(20) NOT NULL,
	"account_name" varchar(255) NOT NULL,
	"vehicle_type" varchar(100) NOT NULL,
	"make_model" varchar(255) NOT NULL,
	"year" varchar(20) NOT NULL,
	"plate_number" varchar(100) NOT NULL,
	"color" varchar(50) NOT NULL,
	"insurance_file" text,
	"road_worthiness_file" text,
	"government_id_type" varchar(100) NOT NULL,
	"guarantor_name" varchar(255) NOT NULL,
	"guarantor_phone" varchar(50) NOT NULL,
	"guarantor_relationship" varchar(100) NOT NULL,
	"government_id_file" text,
	"guarantor_id_file" text,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rider_kyc_rider_id_unique" UNIQUE("rider_id")
);
--> statement-breakpoint
CREATE TABLE "rider_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rider_id" uuid NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"phone" varchar(50) NOT NULL,
	"state_region" varchar(100) NOT NULL,
	"city" varchar(100) NOT NULL,
	"bio" text,
	"avatar" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rider_profiles_rider_id_unique" UNIQUE("rider_id")
);
--> statement-breakpoint
ALTER TABLE "rider_kyc" ADD CONSTRAINT "rider_kyc_rider_id_users_id_fk" FOREIGN KEY ("rider_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rider_profiles" ADD CONSTRAINT "rider_profiles_rider_id_users_id_fk" FOREIGN KEY ("rider_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;