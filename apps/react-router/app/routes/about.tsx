import type { Route } from "./+types/about";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "About - React Router" },
    { name: "description", content: "Learn more about Pulu Web and our mission" },
  ];
}

export default function About() {
  return (
    <div className="container py-10">
      <div className="mx-auto max-w-[800px]">
        <h1 className="text-4xl font-bold mb-6">About Pulu Web</h1>
        
        <div className="prose prose-gray max-w-none">
          <p className="text-lg text-gray-600 mb-6">
            Pulu Web is a modern web application built with the latest web technologies,
            showcasing the power of React Router and server-side rendering.
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
            <p className="text-gray-600">
              We're dedicated to building fast, accessible, and user-friendly web applications
              that leverage the latest advancements in web technology. Our platform demonstrates
              best practices in modern web development.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Technology Stack</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>React Router v7 with file-based routing</li>
              <li>React 19 with server components</li>
              <li>TypeScript for type safety</li>
              <li>Tailwind CSS v4 for styling</li>
              <li>Pulumi for infrastructure as code</li>
              <li>AWS Lambda & CloudFront for hosting</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Features</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Performance First</h3>
                <p className="text-sm text-gray-600">
                  Built with performance in mind, utilizing server-side rendering,
                  streaming, and edge computing.
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">SEO Optimized</h3>
                <p className="text-sm text-gray-600">
                  Full SEO support with metadata management, sitemaps, and structured data.
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Type Safe</h3>
                <p className="text-sm text-gray-600">
                  End-to-end type safety with TypeScript throughout the stack.
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Modern Architecture</h3>
                <p className="text-sm text-gray-600">
                  Leveraging the latest React features including server components
                  and streaming SSR.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Get Started</h2>
            <p className="text-gray-600">
              Ready to explore what we've built? Check out our{" "}
              <a href="/dashboard" className="text-blue-600 hover:underline">
                Dashboard
              </a>{" "}
              or browse our{" "}
              <a href="/products" className="text-blue-600 hover:underline">
                Products
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}