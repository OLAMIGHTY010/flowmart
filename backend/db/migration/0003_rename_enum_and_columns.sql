ALTER TYPE role RENAME VALUE 'camp_logistics_coordinator' TO 'logistics_manager';--> statement-breakpoint
ALTER TYPE role RENAME VALUE 'zone_coordinator' TO 'regional_manager';--> statement-breakpoint
ALTER TYPE role RENAME VALUE 'attendee' TO 'user';--> statement-breakpoint
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user'::role;--> statement-breakpoint
ALTER TABLE orders RENAME COLUMN attendee_id TO user_id;--> statement-breakpoint
ALTER TABLE vendor_kyc RENAME COLUMN camp_certificate_id TO business_license_id;--> statement-breakpoint
ALTER TABLE vendor_kyc RENAME COLUMN camp_certificate_file TO business_license_file;--> statement-breakpoint
ALTER TABLE kyc_submissions RENAME COLUMN camp_certificate_url TO business_license_url;--> statement-breakpoint
ALTER TABLE staff_profiles RENAME COLUMN church TO branch;--> statement-breakpoint
ALTER TABLE staff_profiles RENAME COLUMN zonal TO region;
