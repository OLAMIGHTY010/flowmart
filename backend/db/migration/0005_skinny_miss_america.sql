CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" varchar(50) NOT NULL,
	"actor_id" uuid,
	"actor_name" varchar(255) NOT NULL,
	"action" varchar(100) NOT NULL,
	"module" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"ip_address" varchar(50),
	"status" varchar(50) NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;