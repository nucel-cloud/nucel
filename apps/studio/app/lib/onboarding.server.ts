import { db, onboardingProgress, githubInstallation, awsAccount } from "@nucel/database";
import { eq, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import crypto from "crypto";

export type OnboardingStep = "github" | "aws" | "repository" | "configure" | "complete";

interface OnboardingState {
  currentStep: OnboardingStep;
  githubConnected: boolean;
  awsConnected: boolean;
  repositorySelected: boolean;
  projectConfigured: boolean;
  metadata?: Record<string, unknown>;
}

// Get or create onboarding progress
export async function getOrCreateOnboardingProgress(userId: string): Promise<OnboardingState> {
  let progress = await db
    .select()
    .from(onboardingProgress)
    .where(eq(onboardingProgress.userId, userId))
    .limit(1);

  if (progress.length === 0) {
    // Create initial onboarding progress
    const newProgress = {
      id: nanoid(),
      userId,
      currentStep: "github" as OnboardingStep,
      githubConnected: false,
      awsConnected: false,
      repositorySelected: false,
      projectConfigured: false,
      metadata: JSON.stringify({}),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(onboardingProgress).values(newProgress);
    
    return {
      currentStep: newProgress.currentStep,
      githubConnected: newProgress.githubConnected,
      awsConnected: newProgress.awsConnected,
      repositorySelected: newProgress.repositorySelected,
      projectConfigured: newProgress.projectConfigured,
      metadata: {},
    };
  }

  const userProgress = progress[0];
  return {
    currentStep: userProgress.currentStep as OnboardingStep,
    githubConnected: userProgress.githubConnected,
    awsConnected: userProgress.awsConnected,
    repositorySelected: userProgress.repositorySelected,
    projectConfigured: userProgress.projectConfigured,
    metadata: userProgress.metadata ? JSON.parse(userProgress.metadata) : {},
  };
}

// Check if onboarding is complete
export function isOnboardingComplete(progress: OnboardingState): boolean {
  return (
    progress.currentStep === "complete" &&
    progress.githubConnected &&
    progress.awsConnected &&
    progress.repositorySelected &&
    progress.projectConfigured
  );
}

// Update onboarding step
export async function updateOnboardingStep(userId: string, step: OnboardingStep) {
  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  switch (step) {
    case "github":
      updates.githubConnected = true;
      updates.currentStep = "aws";
      break;
    case "aws":
      updates.awsConnected = true;
      updates.currentStep = "repository";
      break;
    case "repository":
      updates.repositorySelected = true;
      updates.currentStep = "configure";
      break;
    case "configure":
      updates.projectConfigured = true;
      updates.currentStep = "complete";
      updates.completedAt = new Date();
      break;
  }

  await db
    .update(onboardingProgress)
    .set(updates)
    .where(eq(onboardingProgress.userId, userId));
}

// GitHub related functions
export async function getUserGitHubInstallations(userId: string) {
  // First, claim any pending installations (from webhooks)
  const pendingInstallations = await db
    .select()
    .from(githubInstallation)
    .where(isNull(githubInstallation.userId));

  if (pendingInstallations.length > 0) {
    console.log(`[Onboarding] Found ${pendingInstallations.length} pending GitHub installations to claim`);
    
    // Claim all pending installations for this user
    for (const pending of pendingInstallations) {
      await db
        .update(githubInstallation)
        .set({ 
          userId,
          updatedAt: new Date() 
        })
        .where(eq(githubInstallation.id, pending.id));
      
      console.log(`[Onboarding] Claimed GitHub installation ${pending.installationId} for user ${userId}`);
    }
  }

  // Now get all user's installations (including newly claimed ones)
  const installations = await db
    .select()
    .from(githubInstallation)
    .where(eq(githubInstallation.userId, userId));

  return {
    installed: installations.length > 0,
    installations: installations.map((installation) => ({
      id: installation.installationId,
      account: {
        login: installation.accountLogin,
        type: installation.accountType,
        avatar_url: installation.accountAvatarUrl || "",
      },
      repository_selection: installation.repositorySelection as "all" | "selected",
    })),
    appName: process.env.GITHUB_APP_NAME || "nucel-cloud",
    appSlug: process.env.GITHUB_APP_SLUG || "nucel-cloud",
  };
}

export async function saveGitHubInstallation(
  userId: string,
  data: {
    installationId: number;
    accountLogin: string;
    accountType: string;
    accountAvatarUrl?: string | null;
  }
) {
  const existing = await db
    .select()
    .from(githubInstallation)
    .where(eq(githubInstallation.installationId, data.installationId))
    .limit(1);

  if (existing.length > 0) {
    // Update existing
    await db
      .update(githubInstallation)
      .set({
        accountLogin: data.accountLogin,
        accountType: data.accountType,
        accountAvatarUrl: data.accountAvatarUrl,
        updatedAt: new Date(),
      })
      .where(eq(githubInstallation.installationId, data.installationId));
  } else {
    // Create new
    await db.insert(githubInstallation).values({
      id: nanoid(),
      installationId: data.installationId,
      userId,
      accountLogin: data.accountLogin,
      accountType: data.accountType,
      accountAvatarUrl: data.accountAvatarUrl,
      targetType: "User",
      repositorySelection: "all",
      permissions: JSON.stringify({}),
      events: JSON.stringify([]),
      installedAt: new Date(),
      updatedAt: new Date(),
    });
  }
}

// AWS related functions
export function generateExternalId(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function generateCloudFormationUrl(externalId: string, region: string = "us-east-1"): string {
  // Use CloudFormation template URL from S3
  const templateUrl = process.env.CLOUDFORMATION_TEMPLATE_URL || 
    "https://nucel-cloudformation-templates.s3.amazonaws.com/nucel-aws-integration.yaml";
  
  const stackName = `nucel-integration-${Date.now()}`;
  
  // Don't encode the URL in URLSearchParams - it will handle encoding
  const params = new URLSearchParams({
    templateURL: templateUrl,
    stackName: stackName,
    param_ExternalId: externalId,
  });

  return `https://console.aws.amazon.com/cloudformation/home?region=${region}#/stacks/create/review?${params}`;
}

export async function getUserAWSAccounts(userId: string) {
  const accounts = await db
    .select()
    .from(awsAccount)
    .where(eq(awsAccount.userId, userId));

  return accounts.map((account) => ({
    id: account.id,
    accountId: account.accountId,
    accountAlias: account.accountAlias,
    region: account.region,
    stackStatus: account.stackStatus,
    verifiedAt: account.verifiedAt,
  }));
}

export async function saveAWSAccount(
  userId: string,
  data: {
    accountId: string;
    accountAlias?: string | null;
    roleArn: string;
    externalId: string;
    region?: string;
    stackName?: string | null;
  }
) {
  const existing = await db
    .select()
    .from(awsAccount)
    .where(eq(awsAccount.userId, userId))
    .where(eq(awsAccount.accountId, data.accountId))
    .limit(1);

  if (existing.length > 0) {
    // Update existing
    await db
      .update(awsAccount)
      .set({
        accountAlias: data.accountAlias,
        roleArn: data.roleArn,
        region: data.region || "us-east-1",
        stackName: data.stackName,
        updatedAt: new Date(),
      })
      .where(eq(awsAccount.id, existing[0].id));
    
    return existing[0].id;
  } else {
    // Create new
    const id = nanoid();
    await db.insert(awsAccount).values({
      id,
      userId,
      accountId: data.accountId,
      accountAlias: data.accountAlias || `AWS Account ${data.accountId}`,
      roleArn: data.roleArn,
      externalId: data.externalId,
      region: data.region || "us-east-1",
      stackName: data.stackName,
      stackStatus: "CREATE_COMPLETE",
      capabilities: JSON.stringify([
        "lambda:*",
        "apigateway:*",
        "s3:*",
        "cloudfront:*",
        "iam:*",
        "logs:*",
      ]),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    return id;
  }
}