import { db, project, awsAccount, githubInstallation } from "@nucel/database";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NucelGitHubApp } from "@nucel.cloud/github-app";
import { readFileSync } from "fs";
import { join } from "path";

interface CreateProjectParams {
  userId: string;
  name: string;
  repository: string; // owner/repo format
  repositoryId: number;
  githubInstallationId: number;
  awsAccountId: string;
  framework: string;
  buildCommand?: string;
  outputDirectory?: string;
  installCommand?: string;
  nodeVersion?: string;
  branch?: string;
}

// Create a new project when user selects repository in onboarding
export async function createProject(params: CreateProjectParams) {
  const {
    userId,
    name,
    repository,
    repositoryId,
    githubInstallationId,
    awsAccountId,
    framework,
    buildCommand,
    outputDirectory,
    installCommand,
    nodeVersion = "20",
    branch = "main",
  } = params;

  // Generate a unique slug from the project name
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  let slug = baseSlug;
  let counter = 1;
  
  // Check if slug exists and generate a unique one
  while (true) {
    const existing = await db
      .select()
      .from(project)
      .where(eq(project.slug, slug))
      .limit(1);
    
    if (existing.length === 0) break;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  // Create the project
  const projectId = nanoid();
  await db.insert(project).values({
    id: projectId,
    userId,
    name,
    slug,
    githubRepo: repository,
    githubRepoId: repositoryId,
    githubInstallationId,
    awsAccountId,
    defaultBranch: branch,
    framework,
    buildCommand: buildCommand || getDefaultBuildCommand(framework),
    outputDirectory: outputDirectory || getDefaultOutputDirectory(framework),
    installCommand: installCommand || "npm ci",
    nodeVersion,
    pulumiStackName: "production",
    awsRegion: "us-east-1",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return projectId;
}

// Get projects for a user
export async function getUserProjects(userId: string) {
  const projects = await db
    .select()
    .from(project)
    .where(eq(project.userId, userId))
    .orderBy(project.createdAt);

  return projects;
}

// Get a single project by ID
export async function getProject(projectId: string, userId: string) {
  const projects = await db
    .select()
    .from(project)
    .where(and(eq(project.id, projectId), eq(project.userId, userId)))
    .limit(1);

  return projects[0] || null;
}

// Get project by repository (for webhook verification)
export async function getProjectByRepository(
  repository: string,
  installationId: number
) {
  const projects = await db
    .select()
    .from(project)
    .where(
      and(
        eq(project.githubRepo, repository),
        eq(project.githubInstallationId, installationId)
      )
    )
    .limit(1);

  return projects[0] || null;
}

// Setup GitHub secrets for the project
export async function setupGitHubSecrets(projectId: string, userId: string) {
  // Get project with AWS account info
  const projectData = await db
    .select({
      project: project,
      awsAccount: awsAccount,
    })
    .from(project)
    .leftJoin(awsAccount, eq(project.awsAccountId, awsAccount.id))
    .where(and(eq(project.id, projectId), eq(project.userId, userId)))
    .limit(1);

  if (!projectData.length || !projectData[0].awsAccount) {
    throw new Error("Project or AWS account not found");
  }

  const { project: proj, awsAccount: aws } = projectData[0];

  // Initialize GitHub App
  const githubApp = new NucelGitHubApp({
    appId: process.env.GITHUB_APP_ID!,
    privateKey: process.env.GITHUB_APP_PRIVATE_KEY!,
    webhookSecret: process.env.GITHUB_WEBHOOK_SECRET!,
  });

  const [owner, repo] = proj.githubRepo.split("/");

  // Create or update secrets using the GitHub App's method
  const secrets = {
    NUCEL_PROJECT_ID: projectId,
    NUCEL_AWS_ROLE_ARN: aws.roleArn,
    NUCEL_EXTERNAL_ID: aws.externalId,
    AWS_REGION: proj.awsRegion || "us-east-1",
  };

  const results = await githubApp.createOrUpdateRepoSecrets({
    installationId: proj.githubInstallationId!,
    owner,
    repo,
    secrets,
  });

  // Update project to mark secrets as configured
  await db
    .update(project)
    .set({ 
      githubSecretsConfigured: true,
      updatedAt: new Date(),
    })
    .where(eq(project.id, projectId));

  return results;
}

// Create GitHub workflow file
export async function createGitHubWorkflow(projectId: string, userId: string) {
  const proj = await getProject(projectId, userId);
  if (!proj) throw new Error("Project not found");

  // Initialize GitHub App
  const githubApp = new NucelGitHubApp({
    appId: process.env.GITHUB_APP_ID!,
    privateKey: process.env.GITHUB_APP_PRIVATE_KEY!,
    webhookSecret: process.env.GITHUB_WEBHOOK_SECRET!,
  });

  const [owner, repo] = proj.githubRepo.split("/");

  // Read the workflow template
  const templatePath = join(process.cwd(), "app", "templates", "github-workflow.yml");
  let workflowContent = readFileSync(templatePath, "utf-8");

  // Replace placeholders with actual values
  const replacements = {
    "{{DEFAULT_BRANCH}}": proj.defaultBranch || "main",
    "{{NODE_VERSION}}": proj.nodeVersion || "20",
    "{{INSTALL_COMMAND}}": proj.installCommand || "npm ci",
    "{{BUILD_COMMAND}}": proj.buildCommand || "npm run build",
    "{{PULUMI_STACK_NAME}}": proj.pulumiStackName || "production",
  };

  for (const [placeholder, value] of Object.entries(replacements)) {
    workflowContent = workflowContent.replace(new RegExp(placeholder, "g"), value);
  }

  try {
    // Use the GitHub App's method to create or update the workflow file
    const result = await githubApp.createOrUpdateWorkflowFile({
      installationId: proj.githubInstallationId!,
      owner,
      repo,
      path: ".github/workflows/nucel-deploy.yml",
      content: workflowContent,
      message: "Add Nucel deployment workflow",
    });

    // Update project to mark workflow as created
    await db
      .update(project)
      .set({ 
        workflowFileCreated: true,
        updatedAt: new Date(),
      })
      .where(eq(project.id, projectId));

    return result;
  } catch (error) {
    console.error("Error creating workflow file:", error);
    throw error;
  }
}

// Helper functions
function getDefaultBuildCommand(framework: string): string {
  switch (framework) {
    case "nextjs":
      return "npm run build";
    case "sveltekit":
      return "npm run build";
    case "react-router":
      return "npm run build";
    case "react":
      return "npm run build";
    default:
      return "npm run build";
  }
}

function getDefaultOutputDirectory(framework: string): string {
  switch (framework) {
    case "nextjs":
      return ".next";
    case "sveltekit":
      return "build";
    case "react-router":
      return "build";
    case "react":
      return "dist";
    default:
      return "dist";
  }
}

