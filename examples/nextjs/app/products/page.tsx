import { Suspense } from "react";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Products",
  description: "Browse our product catalog",
};

// Simulate fetching products from an API
async function getProducts() {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return [
    { id: 1, name: "Next.js Enterprise", price: 299, category: "Framework" },
    { id: 2, name: "React Server Components", price: 199, category: "Library" },
    { id: 3, name: "Turbo Build System", price: 399, category: "Tool" },
    { id: 4, name: "Vercel Analytics", price: 99, category: "Service" },
    { id: 5, name: "Edge Runtime", price: 249, category: "Infrastructure" },
  ];
}

// Loading skeleton
function ProductsSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="rounded-lg border p-6 space-y-3">
          <div className="h-6 bg-muted animate-pulse rounded w-3/4" />
          <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
          <div className="h-8 bg-muted animate-pulse rounded w-1/3" />
        </div>
      ))}
    </div>
  );
}

// Server Component for products list
async function ProductsList() {
  const products = await getProducts();

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <Link
          key={product.id}
          href={`/products/${product.id}`}
          className="group rounded-lg border p-6 transition-colors hover:border-primary"
        >
          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">{product.category}</p>
          <p className="text-2xl font-bold mt-4">${product.price}</p>
          <p className="text-sm text-primary mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            View details →
          </p>
        </Link>
      ))}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Products</h1>
        <p className="text-muted-foreground">
          Explore our cutting-edge development tools and services
        </p>
      </div>

      <Suspense fallback={<ProductsSkeleton />}>
        <ProductsList />
      </Suspense>
    </div>
  );
}