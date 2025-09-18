import { useLoaderData, Link } from "react-router";
import type { Route } from "./+types/projects";
import { SiteHeader } from "~/components/site-header";
import { requireUser } from "~/lib/sessions.server";
import { getUserProjects } from "~/lib/projects.server";
import { Button } from "@nucel.cloud/design-system/components/ui/button";
import { Rocket } from "lucide-react";
import { ProjectCardV2 } from "~/components/projects/project-card-v2";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser(request);
  
  // For now, use the existing projects as "cells" until migration
  // Each project in the current DB will be treated as a cell
  const cells = await getUserProjects(user.id);
  
  // Group cells by a virtual project (for now, we'll show them as individual items)
  // After migration, this will properly group cells under projects
  const projectsWithCells = cells.map(cell => ({
    id: cell.id,
    name: cell.name,
    description: `${cell.framework} application`,
    cells: [{
      ...cell,
      cellType: cell.framework?.includes('next') || cell.framework?.includes('react') || cell.framework?.includes('svelte') 
        ? 'frontend' 
        : cell.framework === 'hono' 
        ? 'backend' 
        : 'fullstack',
      latestDeployment: null,
      deploymentCount: 0,
    }],
  }));
  
  return { projects: projectsWithCells, user };
}

export default function Projects() {
  const { projects } = useLoaderData<typeof loader>();
  
  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-semibold">Projects</h1>
                  <p className="text-muted-foreground">
                    Manage your deployed projects and applications.
                  </p>
                </div>
                <Link to="/onboarding">
                  <Button>
                    <Rocket className="mr-2 h-4 w-4" />
                    New Project
                  </Button>
                </Link>
              </div>
              
              {projects.length === 0 ? (
                <div className="rounded-lg border bg-card p-8 text-center">
                  <p className="text-muted-foreground mb-4">No projects yet</p>
                  <Link to="/onboarding">
                    <Button>Create your first project</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {projects.map((project: any) => (
                    <ProjectCardV2 key={project.id} project={project} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}