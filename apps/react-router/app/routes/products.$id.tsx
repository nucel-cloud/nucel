import { useState, useEffect } from "react";
import { Link, useParams } from "react-router";
import type { Route } from "./+types/products.$id";

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
}

export function meta({ data }: Route.MetaArgs) {
  const product = data as Product | null;
  return [
    { title: product ? `${product.name} - React Router` : "Product - React Router" },
    { 
      name: "description", 
      content: product ? `View details for ${product.name}` : "Product details" 
    },
  ];
}

export async function loader({ params }: Route.LoaderArgs) {
  try {
    const response = await fetch(`${process.env.ORIGIN || 'http://localhost:5174'}/api/products/${params.id}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Product not found');
    }
    
    return data;
  } catch (error) {
    return null;
  }
}

export default function ProductDetail({ loaderData }: Route.ComponentProps) {
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(loaderData);
  const [loading, setLoading] = useState(!loaderData);
  const [error, setError] = useState<string | null>(null);

  async function fetchProduct(id: string) {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/products/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch product");
      }

      setProduct(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!loaderData && params.id) {
      fetchProduct(params.id);
    }
  }, [params.id, loaderData]);

  if (loading) {
    return (
      <div className="container py-10 max-w-4xl mx-auto px-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-32 bg-gray-200 rounded mb-6"></div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-10 max-w-4xl mx-auto px-4">
        <div className="text-center py-10">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            to="/products"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-10 max-w-4xl mx-auto px-4">
        <div className="text-center py-10">
          <h1 className="text-2xl font-bold text-gray-600 mb-4">Product Not Found</h1>
          <Link
            to="/products"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const getProductDescription = (id: number) => {
    switch (id) {
      case 1:
        return "Next.js Enterprise is a comprehensive framework solution for building large-scale applications. It includes advanced features like ISR, middleware, and edge runtime support.";
      case 2:
        return "React Server Components revolutionize how we build React applications by enabling server-side rendering at the component level with zero client-side JavaScript.";
      case 3:
        return "Turbo Build System is a high-performance build tool that makes your development workflow faster with intelligent caching and parallel execution.";
      case 4:
        return "Vercel Analytics provides real-time insights into your application's performance, user behavior, and Core Web Vitals metrics.";
      case 5:
        return "Edge Runtime enables you to run your application code at the edge, closer to your users, for improved performance and reduced latency.";
      default:
        return "This product offers cutting-edge technology solutions for modern web development.";
    }
  };

  return (
    <div className="container py-10 max-w-4xl mx-auto px-4">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm">
        <ol className="flex items-center space-x-2">
          <li>
            <Link to="/" className="text-gray-500 hover:text-gray-700">
              Home
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li>
            <Link to="/products" className="text-gray-500 hover:text-gray-700">
              Products
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-900">{product.name}</li>
        </ol>
      </nav>

      {/* Product Details */}
      <div className="bg-white border rounded-lg p-8">
        <div className="mb-4">
          <span className="inline-block px-3 py-1 text-sm bg-gray-100 rounded-full">
            {product.category}
          </span>
        </div>

        <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

        <div className="mb-6">
          <span className="text-4xl font-bold text-blue-600">${product.price}</span>
          <span className="text-gray-500 ml-2">USD</span>
        </div>

        <div className="prose prose-gray max-w-none mb-8">
          <h2 className="text-xl font-semibold mb-3">Product Description</h2>
          <p className="text-gray-600">{getProductDescription(product.id)}</p>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-3">Key Features</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Enterprise-ready solution</li>
            <li>Scalable architecture</li>
            <li>Premium support included</li>
            <li>Regular updates and maintenance</li>
            <li>Comprehensive documentation</li>
          </ul>
        </div>

        <div className="flex gap-4 mt-8">
          <button className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Add to Cart
          </button>
          <Link
            to="/products"
            className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back to Products
          </Link>
        </div>
      </div>

      {/* Related Products */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-6">Related Products</h2>
        <div className="text-gray-600">
          <p>
            Check out other products in the <strong>{product.category}</strong> category.
          </p>
          <Link
            to={`/products?category=${encodeURIComponent(product.category)}`}
            className="text-blue-600 hover:underline mt-2 inline-block"
          >
            View all {product.category} products →
          </Link>
        </div>
      </div>
    </div>
  );
}