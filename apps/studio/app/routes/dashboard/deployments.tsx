import { useLoaderData } from "react-router";
import type { Route } from "./+types/deployments";
import { SiteHeader } from "~/components/site-header";
import { requireUser } from "~/lib/sessions.server";
import { getUserDeployments } from "~/lib/deployments.server";
import { DeploymentsList } from "~/components/deployments/deployments-list";
import { Card, CardContent, CardHeader, CardTitle } from "@nucel.cloud/design-system/components/ui/card";
import { Activity, TrendingUp, Clock, AlertCircle } from "lucide-react";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser(request);
  
  // Directly call the data fetching logic
  const deployments = await getUserDeployments(user.id, 50);
  
  return { deployments, user };
}

export default function Deployments() {
  const { deployments } = useLoaderData<typeof loader>();
  
  // Calculate stats
  const stats = {
    total: deployments.length,
    today: deployments.filter((d: any) => {
      const date = new Date(d.createdAt);
      const today = new Date();
      return date.toDateString() === today.toDateString();
    }).length,
    active: deployments.filter((d: any) => 
      ['pending', 'building', 'deploying'].includes(d.status)
    ).length,
    failed: deployments.filter((d: any) => d.status === 'failed').length,
  };
  
  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              <div className="mb-6">
                <h1 className="text-2xl font-semibold">Deployments</h1>
                <p className="text-muted-foreground">
                  Monitor and manage all deployments across your projects.
                </p>
              </div>
              
              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-4 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Deployments</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.total}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Today</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.today}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.active}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Failed</CardTitle>
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.failed}</div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Deployments List */}
              <DeploymentsList deployments={deployments} showProject={true} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}