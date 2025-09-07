import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "react-router";
import { data } from "react-router";
import type { Route } from "./+types/root";
import { getToast } from "remix-toast";
import { Providers } from "./components/providers";
import { Toast } from "./components/toast";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Oxanium:wght@200..800&family=Merriweather:ital,wght@0,300;0,400;0,700;0,900;1,300;1,400;1,700;1,900&family=Fira+Code:wght@300..700&display=swap",
  },
];

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { toast, headers } = await getToast(request);
  return data({ toast }, { headers });
};

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Providers>{children}</Providers>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const { toast: toastData } = useLoaderData<typeof loader>();

  return (
    <>
      <Outlet />
      {toastData && (
        <Toast
          message={toastData.message}
          type={toastData.type as "success" | "error" | "info" | "warning"}
          description={toastData.description}
        />
      )}
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1 className="text-4xl font-bold text-destructive mb-4">{message}</h1>
      <p className="text-muted-foreground mb-4">{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto bg-muted rounded-lg">
          <code className="text-xs">{stack}</code>
        </pre>
      )}
    </main>
  );
}
