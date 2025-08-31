import { useState, useEffect } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/dashboard";

interface ApiHealth {
  status: string;
  timestamp: string;
  environment?: string;
  uptime?: number | string;
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard - React Router" },
    { name: "description", content: "System dashboard and monitoring" },
  ];
}

export default function Dashboard() {
  const [apiHealth, setApiHealth] = useState<ApiHealth>({ 
    status: "checking...", 
    timestamp: "" 
  });
  const [productCount, setProductCount] = useState(0);
  const [loading, setLoading] = useState(true);

  async function fetchDashboardData() {
    setLoading(true);

    try {
      // Fetch health status
      const healthResponse = await fetch("/api/health");
      if (healthResponse.ok) {
        const health = await healthResponse.json();
        setApiHealth(health);
      }

      // Fetch product count
      const productsResponse = await fetch("/api/products");
      if (productsResponse.ok) {
        const data = await productsResponse.json();
        setProductCount(data.total);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboardData();

    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);

    return () => clearInterval(interval);
  }, []);

  const formatUptime = (uptime: number | string) => {
    if (typeof uptime === "number") {
      const minutes = Math.floor(uptime / 60);
      const seconds = Math.floor(uptime % 60);
      return `${minutes}m ${seconds}s`;
    }
    return uptime || "N/A";
  };

  return (
    <div className="container py-10 max-w-6xl mx-auto px-4">
      <h1 className="text-4xl font-bold mb-8">Dashboard</h1>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* API Health Status */}
            <div className="border rounded-lg p-6">
              <h2 className="text-sm font-medium text-gray-600 mb-2">API Status</h2>
              <p className="text-2xl font-bold">
                <span
                  className={
                    apiHealth.status === "healthy"
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {apiHealth.status === "healthy" ? "✓ Healthy" : "✗ Unhealthy"}
                </span>
              </p>
              {apiHealth.timestamp && (
                <p className="text-xs text-gray-500 mt-2">
                  Last checked: {new Date(apiHealth.timestamp).toLocaleTimeString()}
                </p>
              )}
            </div>

            {/* Product Count */}
            <div className="border rounded-lg p-6">
              <h2 className="text-sm font-medium text-gray-600 mb-2">
                Total Products
              </h2>
              <p className="text-2xl font-bold text-blue-600">{productCount}</p>
            </div>

            {/* Environment */}
            <div className="border rounded-lg p-6">
              <h2 className="text-sm font-medium text-gray-600 mb-2">Environment</h2>
              <p className="text-2xl font-bold">
                {apiHealth.environment || "development"}
              </p>
            </div>

            {/* Uptime */}
            <div className="border rounded-lg p-6">
              <h2 className="text-sm font-medium text-gray-600 mb-2">Uptime</h2>
              <p className="text-2xl font-bold">{formatUptime(apiHealth.uptime!)}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
            <div className="flex gap-4 flex-wrap">
              <Link
                to="/products"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Products
              </Link>
              <Link
                to="/about"
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                About Us
              </Link>
              <button
                onClick={fetchDashboardData}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}