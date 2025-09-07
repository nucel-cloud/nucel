import type { Route } from "./+types/$";

export function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  
  // Handle Chrome DevTools and other well-known paths
  if (url.pathname.startsWith("/.well-known/")) {
    return new Response(JSON.stringify({}), { 
      status: 200,
      headers: {
        "Content-Type": "application/json",
      }
    });
  }
  
  // Return 404 for other unmatched routes
  throw new Response("Not Found", { status: 404 });
}

export function action({ request }: Route.ActionArgs) {
  const url = new URL(request.url);
  
  // Handle Chrome DevTools and other well-known paths for POST requests
  if (url.pathname.startsWith("/.well-known/")) {
    return new Response(JSON.stringify({}), { 
      status: 200,
      headers: {
        "Content-Type": "application/json",
      }
    });
  }
  
  throw new Response("Not Found", { status: 404 });
}

export default function CatchAll() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="mt-2 text-muted-foreground">Page not found</p>
      </div>
    </div>
  );
}