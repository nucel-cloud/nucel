import { redirect } from "react-router";
import { getSession } from "~/lib/sessions.server";
import { auth } from "~/lib/auth.server";

export async function authMiddleware({ request }: { request: Request }) {
  const session = await getSession(request);

  if (!session) {
    // Store the requested URL to redirect back after login
    const url = new URL(request.url);
    const redirectTo = url.pathname + url.search;

    throw redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  return session;
}

export async function optionalAuthMiddleware({
  request,
}: {
  request: Request;
}) {
  const session = await getSession(request);
  return session;
}

export async function adminMiddleware({ request }: { request: Request }) {
  const session = await getSession(request);

  if (!session) {
    throw redirect("/login");
  }

  // Get user to check role
  const user = await auth.api.getUser({ headers: request.headers });

  if (!user || user.role !== "admin") {
    throw new Response("Forbidden", { status: 403 });
  }

  return { session, user };
}
