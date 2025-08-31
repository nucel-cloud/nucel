import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  Link,
  useLocation,
} from "react-router";

import type { Route } from "./+types/root";
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
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

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
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const location = useLocation();
  
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/" className="text-xl font-bold">
                Pulu Web
              </Link>
              <div className="hidden md:flex items-center gap-4">
                <Link 
                  to="/" 
                  className={`px-3 py-2 text-sm font-medium ${location.pathname === '/' ? 'text-blue-600' : 'text-gray-700 hover:text-gray-900'}`}
                >
                  Home
                </Link>
                <Link 
                  to="/about" 
                  className={`px-3 py-2 text-sm font-medium ${location.pathname === '/about' ? 'text-blue-600' : 'text-gray-700 hover:text-gray-900'}`}
                >
                  About
                </Link>
                <Link 
                  to="/products" 
                  className={`px-3 py-2 text-sm font-medium ${location.pathname === '/products' ? 'text-blue-600' : 'text-gray-700 hover:text-gray-900'}`}
                >
                  Products
                </Link>
                <Link 
                  to="/dashboard" 
                  className={`px-3 py-2 text-sm font-medium ${location.pathname === '/dashboard' ? 'text-blue-600' : 'text-gray-700 hover:text-gray-900'}`}
                >
                  Dashboard
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                React Router
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              © 2025 Pulu Web. Built with React Router.
            </p>
            <div className="flex items-center gap-4">
              <a href="/api/health" className="text-sm text-gray-600 hover:text-gray-900">
                API Health
              </a>
              <a href="/api/products" className="text-sm text-gray-600 hover:text-gray-900">
                API Products
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
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
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}