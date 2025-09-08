import { db, deployment, project } from "@nucel/database";
import { eq, desc, and } from "drizzle-orm";

interface DeploymentWithProject {
  id: string;
  projectId: string;
  projectName: string | null;
  projectSlug: string | null;
  repository: string | null;
  commitSha: string;
  commitMessage: string | null;
  branch: string;
  status: string;
  commitAuthor: string | null;
  deploymentUrl: string | null;
  buildLogs: string | null;
  completedAt: Date | null;
  createdAt: Date;
}

// Get deployments for a user
export async function getUserDeployments(userId: string, limit = 20): Promise<DeploymentWithProject[]> {
  const deployments = await db
    .select({
      id: deployment.id,
      projectId: deployment.projectId,
      projectName: project.name,
      projectSlug: project.slug,
      repository: project.githubRepo,
      commitSha: deployment.commitSha,
      commitMessage: deployment.commitMessage,
      branch: deployment.branch,
      status: deployment.status,
      commitAuthor: deployment.commitAuthor,
      deploymentUrl: deployment.deploymentUrl,
      buildLogs: deployment.buildLogs,
      completedAt: deployment.completedAt,
      createdAt: deployment.createdAt,
    })
    .from(deployment)
    .leftJoin(project, eq(deployment.projectId, project.id))
    .where(eq(project.userId, userId))
    .orderBy(desc(deployment.createdAt))
    .limit(limit);

  return deployments;
}

// Get deployments for a specific project
export async function getProjectDeployments(
  projectId: string,
  userId: string,
  limit = 20
): Promise<DeploymentWithProject[]> {
  const deployments = await db
    .select({
      id: deployment.id,
      projectId: deployment.projectId,
      projectName: project.name,
      projectSlug: project.slug,
      repository: project.githubRepo,
      commitSha: deployment.commitSha,
      commitMessage: deployment.commitMessage,
      branch: deployment.branch,
      status: deployment.status,
      commitAuthor: deployment.commitAuthor,
      deploymentUrl: deployment.deploymentUrl,
      buildLogs: deployment.buildLogs,
      completedAt: deployment.completedAt,
      createdAt: deployment.createdAt,
    })
    .from(deployment)
    .leftJoin(project, eq(deployment.projectId, project.id))
    .where(
      and(
        eq(deployment.projectId, projectId),
        eq(project.userId, userId)
      )
    )
    .orderBy(desc(deployment.createdAt))
    .limit(limit);

  return deployments;
}

// Get a single deployment
export async function getDeployment(
  deploymentId: string,
  userId: string
): Promise<DeploymentWithProject | null> {
  const deployments = await db
    .select({
      id: deployment.id,
      projectId: deployment.projectId,
      projectName: project.name,
      projectSlug: project.slug,
      repository: project.githubRepo,
      commitSha: deployment.commitSha,
      commitMessage: deployment.commitMessage,
      branch: deployment.branch,
      status: deployment.status,
      commitAuthor: deployment.commitAuthor,
      deploymentUrl: deployment.deploymentUrl,
      buildLogs: deployment.buildLogs,
      completedAt: deployment.completedAt,
      createdAt: deployment.createdAt,
    })
    .from(deployment)
    .leftJoin(project, eq(deployment.projectId, project.id))
    .where(
      and(
        eq(deployment.id, deploymentId),
        eq(project.userId, userId)
      )
    )
    .limit(1);

  return deployments[0] || null;
}

// Update deployment status
export async function updateDeploymentStatus(
  deploymentId: string,
  status: "pending" | "building" | "deploying" | "ready" | "failed" | "cancelled",
  details?: {
    deploymentUrl?: string;
    buildLogs?: string;
    error?: string;
  }
) {
  const updates: Record<string, unknown> = {
    status,
  };

  if (status === "ready" || status === "failed" || status === "cancelled") {
    updates.completedAt = new Date();
  }

  if (details?.deploymentUrl) {
    updates.deploymentUrl = details.deploymentUrl;
  }

  if (details?.buildLogs) {
    updates.buildLogs = details.buildLogs;
  }

  if (details?.error) {
    updates.error = details.error;
  }

  await db
    .update(deployment)
    .set(updates)
    .where(eq(deployment.id, deploymentId));
}

// Get deployment statistics for a project
export async function getProjectDeploymentStats(projectId: string, userId: string) {
  // Verify project ownership
  const proj = await db
    .select()
    .from(project)
    .where(
      and(
        eq(project.id, projectId),
        eq(project.userId, userId)
      )
    )
    .limit(1);

  if (proj.length === 0) {
    throw new Error("Project not found");
  }

  // Get all deployments for stats
  const deployments = await db
    .select({
      status: deployment.status,
      createdAt: deployment.createdAt,
      completedAt: deployment.completedAt,
    })
    .from(deployment)
    .where(eq(deployment.projectId, projectId));

  const stats = {
    total: deployments.length,
    success: deployments.filter(d => d.status === "ready").length,
    failed: deployments.filter(d => d.status === "failed").length,
    pending: deployments.filter(d => d.status === "pending").length,
    building: deployments.filter(d => d.status === "building").length,
    deploying: deployments.filter(d => d.status === "deploying").length,
    cancelled: deployments.filter(d => d.status === "cancelled").length,
    averageDeploymentTime: 0,
    lastDeployment: deployments[0] || null,
  };

  // Calculate average deployment time
  const completedDeployments = deployments.filter(
    d => d.status === "ready" && d.completedAt && d.createdAt
  );

  if (completedDeployments.length > 0) {
    const totalTime = completedDeployments.reduce((acc, d) => {
      const duration = d.completedAt!.getTime() - d.createdAt.getTime();
      return acc + duration;
    }, 0);
    stats.averageDeploymentTime = Math.round(totalTime / completedDeployments.length / 1000); // in seconds
  }

  return stats;
}