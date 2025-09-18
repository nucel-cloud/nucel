import { Card, CardContent, CardHeader, CardTitle } from "@nucel.cloud/design-system/components/ui/card";
import { Activity, CheckCircle, XCircle, Clock, TrendingUp } from "lucide-react";

interface ProjectStatsProps {
  stats: {
    total: number;
    success: number;
    failed: number;
    pending: number;
    building: number;
    deploying: number;
    cancelled: number;
    averageDeploymentTime: number;
  };
}

export function ProjectStats({ stats }: ProjectStatsProps) {
  const successRate = stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0;
  
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Deployments</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">
            All time deployments
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{successRate}%</div>
          <p className="text-xs text-muted-foreground">
            {stats.success} successful
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.pending + stats.building + stats.deploying}
          </div>
          <p className="text-xs text-muted-foreground">
            Currently running
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Deploy Time</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.averageDeploymentTime > 60 
              ? `${Math.round(stats.averageDeploymentTime / 60)}m`
              : `${stats.averageDeploymentTime}s`
            }
          </div>
          <p className="text-xs text-muted-foreground">
            Average duration
          </p>
        </CardContent>
      </Card>
    </div>
  );
}