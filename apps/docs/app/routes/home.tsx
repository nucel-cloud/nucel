import type { Route } from './+types/home';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { Link } from 'react-router';
import { baseOptions } from '@/lib/layout.shared';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Pulumi AWS Framework Documentation' },
    { name: 'description', content: 'Deploy Next.js, SvelteKit, and React Router apps to AWS with Pulumi' },
  ];
}

export default function Home() {
  return (
    <HomeLayout {...baseOptions()}>
      <div className="flex flex-col items-center justify-center text-center flex-1 px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Pulumi AWS Frameworks
          </h1>
          <p className="text-xl text-fd-muted-foreground mb-8">
            Deploy your Next.js, SvelteKit, and React Router applications to AWS with ease using our pre-built Pulumi components.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-12">
            <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold mb-2">Next.js</h3>
              <p className="text-sm text-fd-muted-foreground mb-4">
                Deploy Next.js apps with OpenNext to AWS Lambda, CloudFront, and S3
              </p>
              <Link
                className="text-sm text-blue-600 hover:underline"
                to="/docs/packages/nextjs"
              >
                Learn more →
              </Link>
            </div>
            
            <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold mb-2">SvelteKit</h3>
              <p className="text-sm text-fd-muted-foreground mb-4">
                Deploy SvelteKit applications to AWS Lambda with CloudFront CDN
              </p>
              <Link
                className="text-sm text-blue-600 hover:underline"
                to="/docs/packages/sveltekit"
              >
                Learn more →
              </Link>
            </div>
            
            <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold mb-2">React Router</h3>
              <p className="text-sm text-fd-muted-foreground mb-4">
                Deploy React Router v7 apps to AWS Lambda, CloudFront, and S3
              </p>
              <Link
                className="text-sm text-blue-600 hover:underline"
                to="/docs/packages/react-router"
              >
                Learn more →
              </Link>
            </div>
          </div>
          
          <div className="flex gap-4 justify-center">
            <Link
              className="bg-fd-primary text-fd-primary-foreground rounded-full font-medium px-6 py-3"
              to="/docs"
            >
              Get Started
            </Link>
            <a
              className="border border-fd-border rounded-full font-medium px-6 py-3 hover:bg-fd-muted/50 transition-colors"
              href="https://github.com/DonsWayo/pulu-front"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </div>
    </HomeLayout>
  );
}
