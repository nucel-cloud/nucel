import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Learn more about Pulu Web and our mission",
};

export default function AboutPage() {
  return (
    <div className="container py-10">
      <div className="mx-auto max-w-[800px]">
        <h1 className="text-4xl font-bold mb-6">About Pulu Web</h1>
        
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-muted-foreground mb-6">
            Pulu Web is a modern web application built with the latest web technologies,
            showcasing the power of Next.js 15 and React Server Components.
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
            <p className="text-muted-foreground">
              We're dedicated to building fast, accessible, and user-friendly web applications
              that leverage the latest advancements in web technology. Our platform demonstrates
              best practices in modern web development.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Technology Stack</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Next.js 15 with App Router</li>
              <li>React 19 with Server Components</li>
              <li>TypeScript for type safety</li>
              <li>Tailwind CSS for styling</li>
              <li>Pulumi for infrastructure as code</li>
              <li>AWS for cloud hosting</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Features</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Performance First</h3>
                <p className="text-sm text-muted-foreground">
                  Built with performance in mind, utilizing server-side rendering,
                  streaming, and edge computing.
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">SEO Optimized</h3>
                <p className="text-sm text-muted-foreground">
                  Full SEO support with metadata API, sitemaps, and structured data.
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Type Safe</h3>
                <p className="text-sm text-muted-foreground">
                  End-to-end type safety with TypeScript throughout the stack.
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Modern Architecture</h3>
                <p className="text-sm text-muted-foreground">
                  Leveraging the latest React features including Server Components
                  and Suspense.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Get Started</h2>
            <p className="text-muted-foreground">
              Ready to explore what we've built? Check out our{" "}
              <a href="/dashboard" className="text-primary hover:underline">
                Dashboard
              </a>{" "}
              or browse our{" "}
              <a href="/products" className="text-primary hover:underline">
                Products
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}