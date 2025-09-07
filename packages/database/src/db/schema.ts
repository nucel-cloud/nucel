import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  primaryKey,
  varchar,
  serial,
  bigint,
} from "drizzle-orm/pg-core";

// Better Auth Schema Tables
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  name: text("name"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  image: text("image"),
  twoFactorEnabled: boolean("twoFactorEnabled").default(false),
  role: text("role").default("user"),
  banned: boolean("banned").default(false),
  banReason: text("banReason"),
  banExpires: timestamp("banExpires"),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  activeOrganizationId: text("activeOrganizationId"),
  impersonatedBy: text("impersonatedBy"),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const twoFactor = pgTable("twoFactor", {
  id: text("id").primaryKey(),
  secret: text("secret").notNull(),
  backupCodes: text("backupCodes").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const passkey = pgTable("passkey", {
  id: text("id").primaryKey(),
  name: text("name"),
  publicKey: text("publicKey").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  webauthnUserID: text("webauthnUserID").notNull(),
  counter: integer("counter").notNull(),
  deviceType: text("deviceType").notNull(),
  backedUp: boolean("backedUp").notNull(),
  transports: text("transports"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

// Organization support (optional)
export const organization = pgTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique(),
  logo: text("logo"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  metadata: text("metadata"),
});

export const member = pgTable("member", {
  id: text("id").primaryKey(),
  organizationId: text("organizationId")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const invitation = pgTable("invitation", {
  id: text("id").primaryKey(),
  organizationId: text("organizationId")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role"),
  inviterUserId: text("inviterUserId")
    .notNull()
    .references(() => user.id),
  expiresAt: timestamp("expiresAt").notNull(),
  status: text("status").notNull().default("pending"),
});

// Legacy users table (can be removed if not needed)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
});

// Nucel-specific tables for deployment platform

// GitHub App installations
export const githubInstallation = pgTable("github_installation", {
  id: text("id").primaryKey(),
  installationId: integer("installation_id").notNull().unique(),
  userId: text("user_id")
    .references(() => user.id, { onDelete: "cascade" }), // Nullable for pending installations
  accountLogin: text("account_login").notNull(),
  accountType: text("account_type").notNull(), // 'User' or 'Organization'
  accountAvatarUrl: text("account_avatar_url"),
  targetType: text("target_type").notNull(),
  repositorySelection: text("repository_selection").notNull(), // 'all' or 'selected'
  permissions: text("permissions").notNull(), // JSON string of permissions
  events: text("events").notNull(), // JSON array of webhook events
  installedAt: timestamp("installed_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// AWS account connections
export const awsAccount = pgTable("aws_account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(), // AWS Account ID
  accountAlias: text("account_alias"), // User-friendly name
  roleArn: text("role_arn").notNull(), // IAM Role ARN for AssumeRole
  externalId: text("external_id").notNull(), // External ID for security
  region: text("region").notNull().default("us-east-1"),
  stackName: text("stack_name"), // CloudFormation stack name
  stackStatus: text("stack_status"), // CloudFormation stack status
  capabilities: text("capabilities"), // JSON array of granted capabilities
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  verifiedAt: timestamp("verified_at"), // When we last verified access
});

// Projects (deployments)
export const project = pgTable("project", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  githubRepo: text("github_repo").notNull(), // owner/repo format
  githubRepoId: integer("github_repo_id"), // GitHub repository ID
  githubInstallationId: integer("github_installation_id")
    .references(() => githubInstallation.installationId),
  awsAccountId: text("aws_account_id")
    .references(() => awsAccount.id),
  defaultBranch: text("default_branch").notNull().default("main"),
  framework: text("framework"), // 'nextjs', 'sveltekit', 'react', 'react-router' etc.
  buildCommand: text("build_command"),
  outputDirectory: text("output_directory"),
  installCommand: text("install_command"),
  nodeVersion: text("node_version").default("20"),
  envVars: text("env_vars"), // Encrypted JSON for runtime
  buildEnvVars: text("build_env_vars"), // Encrypted JSON for build time
  domains: text("domains"), // JSON array of custom domains
  
  // GitHub Actions configuration
  githubSecretsConfigured: boolean("github_secrets_configured").default(false),
  workflowFileCreated: boolean("workflow_file_created").default(false),
  
  // Deployment configuration
  pulumiStackName: text("pulumi_stack_name").default("production"),
  awsRegion: text("aws_region").default("us-east-1"),
  
  status: text("status").notNull().default("active"), // 'active', 'paused', 'deleted'
  lastDeploymentId: text("last_deployment_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Deployments
export const deployment = pgTable("deployment", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  
  // Git information
  commitSha: text("commit_sha").notNull(),
  commitMessage: text("commit_message"),
  commitAuthor: text("commit_author"),
  branch: text("branch").notNull(),
  pullRequestNumber: integer("pull_request_number"), // For PR previews
  
  // Deployment type
  deploymentType: text("deployment_type").notNull().default("commit"), // 'commit', 'pull_request', 'manual', 'rollback'
  environment: text("environment").notNull().default("production"), // 'production', 'preview', 'staging'
  
  // GitHub Actions information
  githubRunId: bigint("github_run_id", { mode: "number" }),
  githubRunNumber: integer("github_run_number"),
  
  // Status and URLs
  status: text("status").notNull().default("pending"), // 'pending', 'building', 'deploying', 'ready', 'failed', 'cancelled'
  deploymentUrl: text("deployment_url"), // The main URL where it's deployed
  previewUrl: text("preview_url"), // For PR previews
  
  // Pulumi stack information
  pulumiStackName: text("pulumi_stack_name"),
  pulumiOutputs: text("pulumi_outputs"), // JSON of stack outputs from Pulumi
  
  // Metrics
  buildDuration: integer("build_duration"), // in seconds
  deployDuration: integer("deploy_duration"), // in seconds
  
  // Logs and errors
  buildLogs: text("build_logs"),
  error: text("error"),
  
  metadata: text("metadata"), // JSON for any additional data
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Onboarding progress tracking
export const onboardingProgress = pgTable("onboarding_progress", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  currentStep: text("current_step").notNull().default("github"), // 'github', 'aws', 'repository', 'configure', 'complete'
  githubConnected: boolean("github_connected").notNull().default(false),
  awsConnected: boolean("aws_connected").notNull().default(false),
  repositorySelected: boolean("repository_selected").notNull().default(false),
  projectConfigured: boolean("project_configured").notNull().default(false),
  completedAt: timestamp("completed_at"),
  metadata: text("metadata"), // JSON for storing step-specific data
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
