import { auth } from "./auth.server";

export async function getSession(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return null;
  }

  return session;
}

export async function requireSession(request: Request) {
  const session = await getSession(request);

  if (!session) {
    throw new Response("Unauthorized", { status: 401 });
  }

  return session;
}

export async function requireUser(request: Request) {
  const session = await requireSession(request);

  // Get the user from the session
  const user = await auth.api.getUser({ headers: request.headers });

  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  return user;
}

export async function requireAdmin(request: Request) {
  const user = await requireUser(request);

  // Check if user has admin role
  if (!user || user.role !== "admin") {
    throw new Response("Forbidden", { status: 403 });
  }

  return user;
}
