import { useState, useEffect } from "react";
import type { Route } from "./+types/_index";

interface ServerData {
  message: string;
  timestamp: string;
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "React Router Features Demo" },
    { name: "description", content: "React Router v7 with Server-Side Rendering" },
  ];
}

export default function Index() {
  const [serverData, setServerData] = useState<ServerData | null>(null);
  const [loading, setLoading] = useState(true);

  // Simulate async data fetching like Next.js Server Components
  async function getServerData() {
    await new Promise(resolve => setTimeout(resolve, 100));
    return {
      message: "Hello from React Router Server!",
      timestamp: new Date().toISOString()
    };
  }

  useEffect(() => {
    getServerData().then(data => {
      setServerData(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="container py-10 max-w-2xl mx-auto px-4">
      <h1 className="text-4xl font-bold mb-8">React Router Features Demo</h1>

      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Server-Side Rendering with Loading States</h2>
          {loading ? (
            <div className="animate-pulse">Loading...</div>
          ) : serverData ? (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold">Server Component</h3>
              <p className="text-sm text-gray-600">{serverData.message}</p>
              <p className="text-xs text-gray-500">Fetched at: {serverData.timestamp}</p>
            </div>
          ) : null}
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Features</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>File-based routing with route modules</li>
            <li>Server-side rendering by default</li>
            <li>Built-in loading states</li>
            <li>SEO with meta management</li>
            <li>TypeScript support</li>
            <li>Tailwind CSS v4 styling</li>
          </ul>
        </section>
      </div>
    </div>
  );
}