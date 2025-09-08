import type { Route } from "./+types/api.projects.$projectId.deployments";
import { requireUser } from "~/lib/sessions.server";
import { getProjectDeployments, getProjectDeploymentStats } from "~/lib/deployments.server";

export async function loader({ request, params }: Route.LoaderArgs) {
  const user = await requireUser(request);
  const { projectId } = params;
  const url = new URL(request.url);
  
  const includeStats = url.searchParams.get("stats") === "true";
  const limit = parseInt(url.searchParams.get("limit") || "20");

  const deployments = await getProjectDeployments(projectId, user.id, limit);
  
  const response: Record<string, unknown> = { deployments };
  
  if (includeStats) {
    const stats = await getProjectDeploymentStats(projectId, user.id);
    response.stats = stats;
  }

  return Response.json(response);
}