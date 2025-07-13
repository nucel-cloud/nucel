import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";

type Props = {
  params: Promise<{ slug: string }>;
};

// Mock blog post data
const posts = {
  "nextjs-15-features": {
    title: "What's New in Next.js 15",
    author: "Sarah Chen",
    date: "2024-01-13",
    readTime: "5 min read",
    content: `
# What's New in Next.js 15

Next.js 15 brings exciting new features and improvements that make building web applications even better.

## Key Features

### Improved Performance
The new version includes significant performance improvements, with faster builds and better runtime performance.

### Enhanced Developer Experience
New debugging tools and better error messages make development smoother than ever.

### Streaming Improvements
React Server Components streaming has been optimized for faster initial page loads.

## Getting Started

To upgrade to Next.js 15, run:

\`\`\`bash
npm install next@latest react@latest react-dom@latest
\`\`\`

## Conclusion

Next.js 15 represents a significant step forward in web development, offering better performance, improved developer experience, and new features that make building modern web applications easier than ever.
    `,
    tags: ["Next.js", "React", "Web Development"],
  },
  "server-components-guide": {
    title: "Complete Guide to React Server Components",
    author: "Mike Johnson",
    date: "2024-01-12",
    readTime: "8 min read",
    content: `
# Complete Guide to React Server Components

React Server Components represent a paradigm shift in how we build React applications.

## What are Server Components?

Server Components are React components that render on the server and send HTML to the client, reducing JavaScript bundle size and improving performance.

## Benefits

1. **Zero Bundle Size**: Server Components don't add to your JavaScript bundle
2. **Direct Backend Access**: Access databases and APIs directly
3. **Automatic Code Splitting**: Only client components are bundled
4. **Improved SEO**: Full HTML sent from server

## Example

\`\`\`jsx
// This component runs on the server
async function ProductList() {
  const products = await db.products.findMany();
  
  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
\`\`\`

## Best Practices

- Use Server Components by default
- Only use Client Components when needed for interactivity
- Leverage streaming for better perceived performance
    `,
    tags: ["React", "Server Components", "Performance"],
  },
  "edge-runtime-explained": {
    title: "Understanding the Edge Runtime",
    author: "Emma Wilson",
    date: "2024-01-11",
    readTime: "6 min read",
    content: `
# Understanding the Edge Runtime

The Edge Runtime enables you to run your code closer to your users for ultra-low latency.

## What is Edge Runtime?

Edge Runtime is a lightweight JavaScript runtime that runs at the edge of the network, close to your users.

## Benefits

- **Ultra-low latency**: Code runs geographically close to users
- **Global scale**: Automatically scales across regions
- **Cost effective**: Pay only for what you use
- **Web API compatible**: Uses standard Web APIs

## Use Cases

1. **API Routes**: Handle requests at the edge
2. **Middleware**: Process requests before they reach your application
3. **Static generation**: Generate pages on-demand at the edge

## Example

\`\`\`typescript
export const runtime = 'edge';

export async function GET(request: Request) {
  return new Response('Hello from the edge!');
}
\`\`\`

## Conclusion

Edge Runtime is perfect for applications that need global low latency and can benefit from running code closer to users.
    `,
    tags: ["Edge Computing", "Performance", "Infrastructure"],
  },
  "typescript-best-practices": {
    title: "TypeScript Best Practices in 2024",
    author: "David Kim",
    date: "2024-01-10",
    readTime: "7 min read",
    content: `
# TypeScript Best Practices in 2024

Modern TypeScript patterns and practices for building type-safe applications.

## Strict Configuration

Always enable strict mode in your tsconfig.json:

\`\`\`json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
\`\`\`

## Type Inference

Let TypeScript infer types when possible:

\`\`\`typescript
// ❌ Avoid
const numbers: Array<number> = [1, 2, 3];

// ✅ Prefer
const numbers = [1, 2, 3];
\`\`\`

## Utility Types

Use built-in utility types:

\`\`\`typescript
type User = {
  id: string;
  name: string;
  email: string;
};

type PartialUser = Partial<User>;
type UserWithoutId = Omit<User, 'id'>;
type UserId = Pick<User, 'id'>;
\`\`\`

## Const Assertions

Use const assertions for literal types:

\`\`\`typescript
const config = {
  api: 'https://api.example.com',
  timeout: 5000,
} as const;
\`\`\`

## Conclusion

Following these TypeScript best practices will help you build more maintainable and type-safe applications.
    `,
    tags: ["TypeScript", "Best Practices", "Development"],
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = posts[slug as keyof typeof posts];
  
  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  return {
    title: post.title,
    description: `${post.content.slice(0, 150)}...`,
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: `${post.content.slice(0, 150)}...`,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
    },
  };
}

export async function generateStaticParams() {
  return Object.keys(posts).map((slug) => ({
    slug: slug,
  }));
}

async function getPost(slug: string) {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const post = posts[slug as keyof typeof posts];
  if (!post) {
    notFound();
  }
  
  return { ...post, slug };
}

async function getRelatedPosts(currentSlug: string) {
  await new Promise(resolve => setTimeout(resolve, 50));
  
  return Object.entries(posts)
    .filter(([slug]) => slug !== currentSlug)
    .slice(0, 2)
    .map(([slug, post]) => ({ slug, ...post }));
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  const relatedPosts = await getRelatedPosts(slug);

  return (
    <article className="container py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <Link 
            href="/blog" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to blog
          </Link>
        </div>

        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{post.author}</span>
            <span>•</span>
            <time>{post.date}</time>
            <span>•</span>
            <span>{post.readTime}</span>
          </div>
          
          <div className="flex gap-2 mt-4">
            {post.tags.map((tag) => (
              <span 
                key={tag} 
                className="text-xs px-2 py-1 bg-muted rounded-md"
              >
                {tag}
              </span>
            ))}
          </div>
        </header>

        <div 
          className="prose prose-gray dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <div className="mt-12 pt-8 border-t">
          <h2 className="text-2xl font-semibold mb-4">Related Posts</h2>
          <div className="grid gap-4">
            {relatedPosts.map((related) => (
              <Link 
                key={related.slug}
                href={`/blog/${related.slug}`}
                className="group border rounded-lg p-4 transition-colors hover:border-primary"
              >
                <h3 className="font-semibold group-hover:text-primary transition-colors">
                  {related.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">{related.readTime}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}