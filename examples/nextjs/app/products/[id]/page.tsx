import { notFound } from "next/navigation";
import { Metadata } from "next";
import ProductActions from "./product-actions";

type Props = {
  params: Promise<{ id: string }>;
};

// Mock product data
const products = {
  "1": { 
    id: 1, 
    name: "Next.js Enterprise", 
    price: 299, 
    category: "Framework",
    description: "The React framework for production-grade applications",
    features: [
      "Server Components",
      "App Router",
      "Built-in optimizations",
      "TypeScript support"
    ],
    inStock: true
  },
  "2": { 
    id: 2, 
    name: "React Server Components", 
    price: 199, 
    category: "Library",
    description: "Revolutionary approach to building React applications",
    features: [
      "Zero bundle size",
      "Direct database access",
      "Automatic code splitting",
      "Streaming SSR"
    ],
    inStock: true
  },
  "3": { 
    id: 3, 
    name: "Turbo Build System", 
    price: 399, 
    category: "Tool",
    description: "High-performance build system for JavaScript and TypeScript",
    features: [
      "Incremental builds",
      "Remote caching",
      "Parallel execution",
      "Monorepo support"
    ],
    inStock: false
  },
  "4": { 
    id: 4, 
    name: "Vercel Analytics", 
    price: 99, 
    category: "Service",
    description: "Real-time analytics for your web applications",
    features: [
      "Core Web Vitals",
      "Custom events",
      "No performance impact",
      "Privacy-focused"
    ],
    inStock: true
  },
  "5": { 
    id: 5, 
    name: "Edge Runtime", 
    price: 249, 
    category: "Infrastructure",
    description: "Run your code at the edge for ultra-low latency",
    features: [
      "Global distribution",
      "Instant cold starts",
      "Web API compatible",
      "Automatic scaling"
    ],
    inStock: true
  }
};

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = products[id as keyof typeof products];
  
  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      type: "website",
    },
  };
}

// Generate static params for build time
export async function generateStaticParams() {
  return Object.keys(products).map((id) => ({
    id: id,
  }));
}

async function getProduct(id: string) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const product = products[id as keyof typeof products];
  if (!product) {
    notFound();
  }
  
  return product;
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = await getProduct(id);

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Link 
            href="/products" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to products
          </Link>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <div className="rounded-lg border p-8 mb-6">
              <div className="aspect-square bg-muted rounded flex items-center justify-center">
                <span className="text-4xl font-bold text-muted-foreground">
                  {product.name[0]}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <p className="text-muted-foreground mb-4">{product.category}</p>
            
            <div className="text-4xl font-bold mb-6">${product.price}</div>
            
            <div className="mb-6">
              <p className="text-muted-foreground">{product.description}</p>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-2">Features</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {product.features.map((feature, i) => (
                  <li key={i}>{feature}</li>
                ))}
              </ul>
            </div>

            <ProductActions product={product} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Import Next.js Link
import Link from "next/link";