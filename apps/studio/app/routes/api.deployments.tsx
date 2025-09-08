import type { Route } from "./+types/api.deployments";
import { requireUser } from "~/lib/sessions.server";
import { getUserDeployments } from "~/lib/deployments.server";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser(request);
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") || "20");

  const deployments = await getUserDeployments(user.id, limit);

  return Response.json({ deployments });
}