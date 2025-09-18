import { Link } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@nucel.cloud/design-system/components/ui/card";
import { Badge } from "@nucel.cloud/design-system/components/ui/badge";
import { Button } from "@nucel.cloud/design-system/components/ui/button";
import { ArrowRight, Github, Globe, Clock } from "lucide-react";
import { DeploymentStatusIcon } from "./deployment-status-icon";
import { formatRelativeTime } from "~/lib/utils/date";

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    slug: string;
    githubRepo: string;
    framework?: string;
    latestDeployment?: {
      id: string;
      status: string;
      createdAt: string;
      deploymentUrl?: string;
      branch: string;
    } | null;
    deploymentCount: number;
  };
}

const FRAMEWORK_LABELS: Record<string, string> = {
  'nextjs': 'Next.js',
  'sveltekit': 'SvelteKit',
  'react-router': 'React Router',
  'react': 'React',
  'hono': 'Hono',
};

export function ProjectCard({ project }: ProjectCardProps) {
  const frameworkLabel = FRAMEWORK_LABELS[project.framework || ''] || project.framework || 'Unknown';
  
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{project.name}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Github className="h-3 w-3" />
              <span className="text-xs">{project.githubRepo}</span>
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-xs">
            {frameworkLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {project.latestDeployment ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Latest deployment</span>
              <DeploymentStatusIcon status={project.latestDeployment.status} showLabel />
            </div>
            
            {project.latestDeployment.deploymentUrl && (
              <a 
                href={project.latestDeployment.deploymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600"
              >
                <Globe className="h-3 w-3" />
                <span className="truncate">
                  {new URL(project.latestDeployment.deploymentUrl).hostname}
                </span>
              </a>
            )}
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{formatRelativeTime(project.latestDeployment.createdAt)}</span>
              <span>•</span>
              <span>{project.latestDeployment.branch}</span>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            No deployments yet
          </div>
        )}
        
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs text-muted-foreground">
            {project.deploymentCount} {project.deploymentCount === 1 ? 'deployment' : 'deployments'}
          </span>
          <Link to={`/dashboard/projects/${project.id}`}>
            <Button variant="ghost" size="sm" className="h-8">
              View Details
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}