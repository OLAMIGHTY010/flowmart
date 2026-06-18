CREATE TABLE "verification_otps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"otp" varchar(6) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "date_of_birth" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "gender" varchar(50);--> statement-breakpoint
ALTER TABLE "vendor_profiles" ADD COLUMN "business_name" varchar(255);--> statement-breakpoint
ALTER TABLE "verification_otps" ADD CONSTRAINT "verification_otps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;