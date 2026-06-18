CREATE TABLE "vendor_kyc_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"action" varchar(50) NOT NULL,
	"notes" text,
	"reviewer_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vendor_kyc" ADD COLUMN "nafdac_certificate_code" varchar(255);--> statement-breakpoint
ALTER TABLE "vendor_kyc" ADD COLUMN "nafdac_certificate_file" text;--> statement-breakpoint
ALTER TABLE "vendor_kyc_history" ADD CONSTRAINT "vendor_kyc_history_vendor_id_users_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_kyc_history" ADD CONSTRAINT "vendor_kyc_history_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;