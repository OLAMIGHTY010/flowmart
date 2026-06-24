ALTER TABLE "vendor_kyc" ADD COLUMN "vendor_type" varchar(50) DEFAULT 'individual' NOT NULL;--> statement-breakpoint
ALTER TABLE "vendor_kyc" ADD COLUMN "tin" varchar(255);--> statement-breakpoint
ALTER TABLE "vendor_kyc" ADD COLUMN "bank_reference_file" text;--> statement-breakpoint
ALTER TABLE "vendor_kyc" ADD COLUMN "cac_document_file" text;