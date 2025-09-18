import { db, project, deployment } from "@nucel/database";
// TODO: Import cell table after migration
// import { cell } from "@nucel/database";
import { eq, and, desc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

// Types
export interface ProjectWithCells {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  status: string;
  createdAt: Date;
  cells: CellInfo[];
}

export interface CellInfo {
  id: string;
  name: string;
  slug: string;
  cellType: string;
  framework?: string | null;
  status: string;
  lastDeployment?: {
    id: string;
    status: string;
    createdAt: Date;
    deploymentUrl?: string | null;
  };
  deploymentCount: number;
}

// Create a new project
export async function createProject(params: {
  userId: string;
  name: string;
  description?: string;
}) {
  const projectId = nanoid();
  const slug = params.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  
  await db.insert(project).values({
    id: projectId,
    userId: params.userId,
    name: params.name,
    slug,
    description: params.description,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  
  return projectId;
}

// Create a new cell within a project
export async function createCell(params: {
  projectId: string;
  name: string;
  cellType: 'frontend' | 'backend' | 'worker' | 'static' | 'fullstack';
  githubRepo: string;
  framework: string;
  monorepoPath?: string;
  buildCommand?: string;
  outputDirectory?: string;
}) {
  const cellId = nanoid();
  const slug = params.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  
  await db.insert(cell).values({
    id: cellId,
    projectId: params.projectId,
    name: params.name,
    slug,
    cellType: params.cellType,
    githubRepo: params.githubRepo,
    monorepoPath: params.monorepoPath,
    framework: params.framework,
    buildCommand: params.buildCommand || getDefaultBuildCommand(params.framework),
    outputDirectory: params.outputDirectory || getDefaultOutputDirectory(params.framework),
    installCommand: 'npm ci',
    nodeVersion: '20',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  
  return cellId;
}

// Get all projects with their cells for a user
export async function getUserProjectsWithCells(userId: string): Promise<ProjectWithCells[]> {
  // First get all projects
  const projects = await db
    .select()
    .from(project)
    .where(eq(project.userId, userId))
    .orderBy(desc(project.createdAt));
  
  // Then get cells and deployment info for each project
  const projectsWithCells = await Promise.all(
    projects.map(async (proj) => {
      const cells = await db
        .select()
        .from(cell)
        .where(eq(cell.projectId, proj.id))
        .orderBy(cell.name);
      
      // Get deployment stats for each cell
      const cellsWithStats = await Promise.all(
        cells.map(async (c) => {
          // Get latest deployment
          const latestDeployment = await db
            .select({
              id: deployment.id,
              status: deployment.status,
              createdAt: deployment.createdAt,
              deploymentUrl: deployment.deploymentUrl,
            })
            .from(deployment)
            .where(eq(deployment.cellId, c.id))
            .orderBy(desc(deployment.createdAt))
            .limit(1);
          
          // Get deployment count
          const deploymentCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(deployment)
            .where(eq(deployment.cellId, c.id));
          
          return {
            id: c.id,
            name: c.name,
            slug: c.slug,
            cellType: c.cellType,
            framework: c.framework,
            status: c.status,
            lastDeployment: latestDeployment[0],
            deploymentCount: Number(deploymentCount[0]?.count || 0),
          };
        })
      );
      
      return {
        id: proj.id,
        name: proj.name,
        slug: proj.slug,
        description: proj.description,
        status: proj.status,
        createdAt: proj.createdAt,
        cells: cellsWithStats,
      };
    })
  );
  
  return projectsWithCells;
}

// Get a single project with its cells
export async function getProjectWithCells(projectId: string, userId: string): Promise<ProjectWithCells | null> {
  const projects = await db
    .select()
    .from(project)
    .where(and(eq(project.id, projectId), eq(project.userId, userId)))
    .limit(1);
  
  if (projects.length === 0) return null;
  
  const proj = projects[0];
  
  // Get cells for this project
  const cells = await db
    .select()
    .from(cell)
    .where(eq(cell.projectId, projectId))
    .orderBy(cell.name);
  
  // Get deployment stats for each cell
  const cellsWithStats = await Promise.all(
    cells.map(async (c) => {
      const latestDeployment = await db
        .select({
          id: deployment.id,
          status: deployment.status,
          createdAt: deployment.createdAt,
          deploymentUrl: deployment.deploymentUrl,
        })
        .from(deployment)
        .where(eq(deployment.cellId, c.id))
        .orderBy(desc(deployment.createdAt))
        .limit(1);
      
      const deploymentCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(deployment)
        .where(eq(deployment.cellId, c.id));
      
      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        cellType: c.cellType,
        framework: c.framework,
        status: c.status,
        lastDeployment: latestDeployment[0],
        deploymentCount: Number(deploymentCount[0]?.count || 0),
      };
    })
  );
  
  return {
    id: proj.id,
    name: proj.name,
    slug: proj.slug,
    description: proj.description,
    status: proj.status,
    createdAt: proj.createdAt,
    cells: cellsWithStats,
  };
}

// Get a single cell
export async function getCell(cellId: string, userId: string) {
  const cells = await db
    .select({
      cell: cell,
      project: project,
    })
    .from(cell)
    .leftJoin(project, eq(cell.projectId, project.id))
    .where(
      and(
        eq(cell.id, cellId),
        eq(project.userId, userId)
      )
    )
    .limit(1);
  
  return cells[0] || null;
}

// Get deployments for a cell
export async function getCellDeployments(cellId: string, userId: string, limit = 20) {
  const deployments = await db
    .select({
      id: deployment.id,
      cellId: deployment.cellId,
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
    .leftJoin(cell, eq(deployment.cellId, cell.id))
    .leftJoin(project, eq(cell.projectId, project.id))
    .where(
      and(
        eq(deployment.cellId, cellId),
        eq(project.userId, userId)
      )
    )
    .orderBy(desc(deployment.createdAt))
    .limit(limit);
  
  return deployments;
}

// Helper functions
function getDefaultBuildCommand(framework: string): string {
  const buildCommands: Record<string, string> = {
    'nextjs': 'npm run build',
    'sveltekit': 'npm run build',
    'react-router': 'npm run build',
    'react': 'npm run build',
    'hono': 'npm run build',
    'express': 'npm run build',
    'fastify': 'npm run build',
    'static': 'echo "No build required"',
  };
  return buildCommands[framework] || 'npm run build';
}

function getDefaultOutputDirectory(framework: string): string {
  const outputDirs: Record<string, string> = {
    'nextjs': '.next',
    'sveltekit': 'build',
    'react-router': 'build',
    'react': 'dist',
    'hono': 'dist',
    'express': 'dist',
    'fastify': 'dist',
    'static': '.',
  };
  return outputDirs[framework] || 'dist';
}