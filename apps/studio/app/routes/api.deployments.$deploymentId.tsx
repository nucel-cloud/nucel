import type { Route } from "./+types/api.deployments.$deploymentId";
import { requireUser } from "~/lib/sessions.server";
import { getDeployment, updateDeploymentStatus } from "~/lib/deployments.server";

export async function loader({ request, params }: Route.LoaderArgs) {
  const user = await requireUser(request);
  const { deploymentId } = params;

  const deployment = await getDeployment(deploymentId, user.id);
  
  if (!deployment) {
    throw new Response("Deployment not found", { status: 404 });
  }

  return Response.json(deployment);
}

export async function action({ request, params }: Route.ActionArgs) {
  const user = await requireUser(request);
  const { deploymentId } = params;
  
  // Verify deployment ownership
  const deployment = await getDeployment(deploymentId, user.id);
  if (!deployment) {
    throw new Response("Deployment not found", { status: 404 });
  }

  const data = await request.json();
  const { status, deploymentUrl, logUrl, error } = data;

  if (!status) {
    throw new Response("Status is required", { status: 400 });
  }

  const validStatuses = ["pending", "building", "deploying", "success", "failed", "cancelled"];
  if (!validStatuses.includes(status)) {
    throw new Response("Invalid status", { status: 400 });
  }

  await updateDeploymentStatus(deploymentId, status, {
    deploymentUrl,
    logUrl,
    error,
  });

  return Response.json({ success: true });
}