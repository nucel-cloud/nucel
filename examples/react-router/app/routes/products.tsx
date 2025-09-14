import { useState, useEffect } from "react";
import { Link, Outlet, useParams } from "react-router";
import type { Route } from "./+types/products";

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Products - React Router" },
    { name: "description", content: "Browse our product catalog" },
  ];
}

export default function Products() {
  const params = useParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("");

  async function fetchProducts(category?: string) {
    setLoading(true);
    setError(null);

    try {
      const url = category
        ? `/api/products?category=${encodeURIComponent(category)}`
        : "/api/products";

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch products");
      }

      setProducts(data.products);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  function handleCategoryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedCategory(e.target.value);
    fetchProducts(e.target.value);
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  // If we have a product ID in params, render the Outlet for the child route
  if (params.id) {
    return <Outlet />;
  }

  return (
    <div className="container py-10 max-w-6xl mx-auto px-4">
      <h1 className="text-4xl font-bold mb-8">Products</h1>

      <div className="mb-6">
        <label htmlFor="category" className="block text-sm font-medium mb-2">
          Filter by Category:
        </label>
        <select
          id="category"
          value={selectedCategory}
          onChange={handleCategoryChange}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          <option value="Framework">Framework</option>
          <option value="Library">Library</option>
          <option value="Tool">Tool</option>
          <option value="Service">Service</option>
          <option value="Infrastructure">Infrastructure</option>
        </select>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Error: {error}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-10 text-gray-500">No products found.</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Link
              key={product.id}
              to={`/products/${product.id}`}
              className="border rounded-lg p-6 hover:shadow-lg transition-shadow block"
            >
              <h2 className="text-xl font-semibold mb-2">{product.name}</h2>
              <p className="text-gray-600 mb-4">
                <span className="inline-block px-2 py-1 text-xs bg-gray-100 rounded">
                  {product.category}
                </span>
              </p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-blue-600">
                  ${product.price}
                </p>
                <span className="text-blue-600 text-sm hover:underline">
                  View Details →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}