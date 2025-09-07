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

  // Session already contains user data
  if (!session.user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  return session.user;
}

export async function requireAdmin(request: Request) {
  const user = await requireUser(request);

  // Check if user has admin role
  if (!user || user.role !== "admin") {
    throw new Response("Forbidden", { status: 403 });
  }

  return user;
}
