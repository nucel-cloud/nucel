import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog",
  description: "Read our latest articles and tutorials",
};

// Mock blog posts
const posts = [
  {
    slug: "nextjs-15-features",
    title: "What's New in Next.js 15",
    excerpt: "Explore the latest features and improvements in Next.js 15, including enhanced performance and developer experience.",
    date: "2024-01-13",
    author: "Sarah Chen",
    readTime: "5 min read",
  },
  {
    slug: "server-components-guide",
    title: "Complete Guide to React Server Components",
    excerpt: "Learn how to leverage React Server Components for better performance and simpler data fetching.",
    date: "2024-01-12",
    author: "Mike Johnson",
    readTime: "8 min read",
  },
  {
    slug: "edge-runtime-explained",
    title: "Understanding the Edge Runtime",
    excerpt: "Deep dive into Edge Runtime and how it can improve your application's performance globally.",
    date: "2024-01-11",
    author: "Emma Wilson",
    readTime: "6 min read",
  },
  {
    slug: "typescript-best-practices",
    title: "TypeScript Best Practices in 2024",
    excerpt: "Modern TypeScript patterns and practices for building type-safe applications.",
    date: "2024-01-10",
    author: "David Kim",
    readTime: "7 min read",
  },
];

export default function BlogPage() {
  return (
    <div className="container py-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Blog</h1>
        
        <div className="space-y-8">
          {posts.map((post) => (
            <article key={post.slug} className="border-b pb-8 last:border-0">
              <Link href={`/blog/${post.slug}`} className="group">
                <h2 className="text-2xl font-semibold mb-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h2>
              </Link>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                <span>{post.author}</span>
                <span>•</span>
                <time>{post.date}</time>
                <span>•</span>
                <span>{post.readTime}</span>
              </div>
              
              <p className="text-muted-foreground mb-4">{post.excerpt}</p>
              
              <Link 
                href={`/blog/${post.slug}`}
                className="text-primary hover:underline text-sm font-medium"
              >
                Read more →
              </Link>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}