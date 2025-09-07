CREATE TABLE "aws_account" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"account_alias" text,
	"role_arn" text NOT NULL,
	"external_id" text NOT NULL,
	"region" text DEFAULT 'us-east-1' NOT NULL,
	"stack_name" text,
	"stack_status" text,
	"capabilities" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"verified_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "deployment" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"commit_sha" text NOT NULL,
	"commit_message" text,
	"commit_author" text,
	"branch" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"build_logs" text,
	"deployment_url" text,
	"lambda_function_arn" text,
	"api_gateway_url" text,
	"cloudfront_distribution_id" text,
	"s3_bucket_name" text,
	"build_duration" integer,
	"deploy_duration" integer,
	"error" text,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "github_installation" (
	"id" text PRIMARY KEY NOT NULL,
	"installation_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"account_login" text NOT NULL,
	"account_type" text NOT NULL,
	"account_avatar_url" text,
	"target_type" text NOT NULL,
	"repository_selection" text NOT NULL,
	"permissions" text NOT NULL,
	"events" text NOT NULL,
	"installed_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "github_installation_installation_id_unique" UNIQUE("installation_id")
);
--> statement-breakpoint
CREATE TABLE "onboarding_progress" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"current_step" text DEFAULT 'github' NOT NULL,
	"github_connected" boolean DEFAULT false NOT NULL,
	"aws_connected" boolean DEFAULT false NOT NULL,
	"repository_selected" boolean DEFAULT false NOT NULL,
	"project_configured" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "onboarding_progress_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "project" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"github_repo" text NOT NULL,
	"github_installation_id" integer,
	"aws_account_id" text,
	"default_branch" text DEFAULT 'main' NOT NULL,
	"framework" text,
	"build_command" text,
	"output_directory" text,
	"install_command" text,
	"env_vars" text,
	"domains" text,
	"status" text DEFAULT 'active' NOT NULL,
	"last_deployment_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "project_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "aws_account" ADD CONSTRAINT "aws_account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deployment" ADD CONSTRAINT "deployment_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_installation" ADD CONSTRAINT "github_installation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_progress" ADD CONSTRAINT "onboarding_progress_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_github_installation_id_github_installation_installation_id_fk" FOREIGN KEY ("github_installation_id") REFERENCES "public"."github_installation"("installation_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_aws_account_id_aws_account_id_fk" FOREIGN KEY ("aws_account_id") REFERENCES "public"."aws_account"("id") ON DELETE no action ON UPDATE no action;