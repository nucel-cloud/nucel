import { Suspense } from "react";

// Server Component with async data fetching
async function getServerData() {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 100));
  return { message: "Hello from Server Component!", timestamp: new Date().toISOString() };
}

// Loading component
function Loading() {
  return <div className="animate-pulse">Loading...</div>;
}

// Async Server Component
async function ServerMessage() {
  const data = await getServerData();
  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold">Server Component</h3>
      <p className="text-sm text-muted-foreground">{data.message}</p>
      <p className="text-xs text-muted-foreground">Fetched at: {data.timestamp}</p>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="container py-10 max-w-2xl">
      <h1 className="text-4xl font-bold mb-8">Next.js 15 Features Demo</h1>
      
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Server Components with Suspense</h2>
          <Suspense fallback={<Loading />}>
            <ServerMessage />
          </Suspense>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Features</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>App Router with file-based routing</li>
            <li>Server Components by default</li>
            <li>Streaming with Suspense</li>
            <li>Built-in SEO with metadata API</li>
            <li>TypeScript support</li>
            <li>Tailwind CSS styling</li>
          </ul>
        </section>
      </div>
    </div>
  );
}