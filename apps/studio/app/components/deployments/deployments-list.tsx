import { Link } from "react-router";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@nucel.cloud/design-system/components/ui/table";
import { Button } from "@nucel.cloud/design-system/components/ui/button";
import { Badge } from "@nucel.cloud/design-system/components/ui/badge";
import { DeploymentStatusIcon } from "~/components/projects/deployment-status-icon";
import { formatRelativeTime, timeAgo } from "~/lib/utils/date";
import { ExternalLink, GitCommit, User } from "lucide-react";

interface Deployment {
  id: string;
  projectId: string;
  projectName?: string | null;
  projectSlug?: string | null;
  repository?: string | null;
  commitSha: string;
  commitMessage: string | null;
  branch: string;
  status: string;
  commitAuthor: string | null;
  deploymentUrl: string | null;
  completedAt: Date | string | null;
  createdAt: Date | string;
}

interface DeploymentsListProps {
  deployments: Deployment[];
  showProject?: boolean;
}

export function DeploymentsList({ deployments, showProject = false }: DeploymentsListProps) {
  if (deployments.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">No deployments yet</p>
      </div>
    );
  }
  
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            {showProject && <TableHead>Project</TableHead>}
            <TableHead>Commit</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Time</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deployments.map((deployment) => (
            <TableRow key={deployment.id}>
              <TableCell>
                <DeploymentStatusIcon status={deployment.status} showLabel />
              </TableCell>
              
              {showProject && (
                <TableCell>
                  <Link 
                    to={`/dashboard/projects/${deployment.projectId}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {deployment.projectName}
                  </Link>
                </TableCell>
              )}
              
              <TableCell>
                <div className="flex items-center gap-2">
                  <GitCommit className="h-3 w-3 text-muted-foreground" />
                  <div className="max-w-[200px]">
                    <code className="text-xs">{deployment.commitSha.slice(0, 7)}</code>
                    {deployment.commitMessage && (
                      <p className="text-xs text-muted-foreground truncate">
                        {deployment.commitMessage}
                      </p>
                    )}
                  </div>
                </div>
              </TableCell>
              
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {deployment.branch}
                </Badge>
              </TableCell>
              
              <TableCell>
                {deployment.commitAuthor && (
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {deployment.commitAuthor}
                    </span>
                  </div>
                )}
              </TableCell>
              
              <TableCell>
                {deployment.completedAt && (
                  <span className="text-sm text-muted-foreground">
                    {calculateDuration(deployment.createdAt, deployment.completedAt)}
                  </span>
                )}
              </TableCell>
              
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {timeAgo(deployment.createdAt)}
                </span>
              </TableCell>
              
              <TableCell className="text-right">
                {deployment.deploymentUrl && (
                  <a 
                    href={deployment.deploymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </a>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function calculateDuration(start: Date | string, end: Date | string): string {
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  const duration = Math.floor((endTime - startTime) / 1000);
  
  if (duration < 60) return `${duration}s`;
  if (duration < 3600) return `${Math.floor(duration / 60)}m ${duration % 60}s`;
  
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  return `${hours}h ${minutes}m`;
}