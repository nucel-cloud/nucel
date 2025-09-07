ALTER TABLE "deployment" ADD COLUMN "pull_request_number" integer;--> statement-breakpoint
ALTER TABLE "deployment" ADD COLUMN "deployment_type" text DEFAULT 'commit' NOT NULL;--> statement-breakpoint
ALTER TABLE "deployment" ADD COLUMN "environment" text DEFAULT 'production' NOT NULL;--> statement-breakpoint
ALTER TABLE "deployment" ADD COLUMN "github_run_id" bigint;--> statement-breakpoint
ALTER TABLE "deployment" ADD COLUMN "github_run_number" integer;--> statement-breakpoint
ALTER TABLE "deployment" ADD COLUMN "preview_url" text;--> statement-breakpoint
ALTER TABLE "deployment" ADD COLUMN "pulumi_stack_name" text;--> statement-breakpoint
ALTER TABLE "deployment" ADD COLUMN "pulumi_outputs" text;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "github_repo_id" integer;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "node_version" text DEFAULT '20';--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "build_env_vars" text;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "github_secrets_configured" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "workflow_file_created" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "pulumi_stack_name" text DEFAULT 'production';--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "aws_region" text DEFAULT 'us-east-1';--> statement-breakpoint
ALTER TABLE "deployment" DROP COLUMN "lambda_function_arn";--> statement-breakpoint
ALTER TABLE "deployment" DROP COLUMN "api_gateway_url";--> statement-breakpoint
ALTER TABLE "deployment" DROP COLUMN "cloudfront_distribution_id";--> statement-breakpoint
ALTER TABLE "deployment" DROP COLUMN "s3_bucket_name";