import { useLoaderData, Link } from "react-router";
import type { Route } from "./+types/projects.$projectId";
import { SiteHeader } from "~/components/site-header";
import { requireUser } from "~/lib/sessions.server";
import { getProject } from "~/lib/projects.server";
import { getProjectDeployments, getProjectDeploymentStats } from "~/lib/deployments.server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@nucel.cloud/design-system/components/ui/card";
import { Button } from "@nucel.cloud/design-system/components/ui/button";
import { Badge } from "@nucel.cloud/design-system/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@nucel.cloud/design-system/components/ui/tabs";
import { ArrowLeft, Github, Globe, Settings, Rocket, Activity } from "lucide-react";
import { DeploymentsList } from "~/components/deployments/deployments-list";
import { ProjectStats } from "~/components/projects/project-stats";
import { ProjectSettings } from "~/components/projects/project-settings";

export async function loader({ request, params }: Route.LoaderArgs) {
  const user = await requireUser(request);
  const { projectId } = params;
  
  const project = await getProject(projectId, user.id);
  
  if (!project) {
    throw new Response("Project not found", { status: 404 });
  }
  
  const [deployments, stats] = await Promise.all([
    getProjectDeployments(projectId, user.id, 10),
    getProjectDeploymentStats(projectId, user.id)
  ]);
  
  return { project, deployments, stats, user };
}

export default function ProjectDetail() {
  const { project, deployments, stats } = useLoaderData<typeof loader>();
  
  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              {/* Header */}
              <div className="mb-6">
                <Link to="/dashboard/projects">
                  <Button variant="ghost" size="sm" className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Projects
                  </Button>
                </Link>
                
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-semibold mb-2">{project.name}</h1>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <a 
                        href={`https://github.com/${project.githubRepo}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-foreground"
                      >
                        <Github className="h-4 w-4" />
                        {project.githubRepo}
                      </a>
                      {project.domains && JSON.parse(project.domains).length > 0 && (
                        <a 
                          href={`https://${JSON.parse(project.domains)[0]}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          <Globe className="h-4 w-4" />
                          {JSON.parse(project.domains)[0]}
                        </a>
                      )}
                      <Badge variant="secondary">{project.framework}</Badge>
                    </div>
                  </div>
                  
                  <Button>
                    <Rocket className="mr-2 h-4 w-4" />
                    Deploy
                  </Button>
                </div>
              </div>
              
              {/* Stats Cards */}
              <ProjectStats stats={stats} />
              
              {/* Tabs */}
              <Tabs defaultValue="deployments" className="mt-6">
                <TabsList>
                  <TabsTrigger value="deployments">
                    <Activity className="mr-2 h-4 w-4" />
                    Deployments
                  </TabsTrigger>
                  <TabsTrigger value="settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="deployments" className="mt-4">
                  <DeploymentsList deployments={deployments} />
                </TabsContent>
                
                <TabsContent value="settings" className="mt-4">
                  <ProjectSettings project={project} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}