import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter, UNSAFE_withComponentProps, useLocation, Link, Outlet, UNSAFE_withErrorBoundaryProps, isRouteErrorResponse, Meta, Links, ScrollRestoration, Scripts, useParams } from "react-router";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { useState, useEffect } from "react";
const streamTimeout = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, routerContext, loadContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    let userAgent = request.headers.get("user-agent");
    let readyOption = userAgent && isbot(userAgent) || routerContext.isSpaMode ? "onAllReady" : "onShellReady";
    let timeoutId = setTimeout(
      () => abort(),
      streamTimeout + 1e3
    );
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(ServerRouter, { context: routerContext, url: request.url }),
      {
        [readyOption]() {
          shellRendered = true;
          const body = new PassThrough({
            final(callback) {
              clearTimeout(timeoutId);
              timeoutId = void 0;
              callback();
            }
          });
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          pipe(body);
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest,
  streamTimeout
}, Symbol.toStringTag, { value: "Module" }));
const links = () => [{
  rel: "preconnect",
  href: "https://fonts.googleapis.com"
}, {
  rel: "preconnect",
  href: "https://fonts.gstatic.com",
  crossOrigin: "anonymous"
}, {
  rel: "stylesheet",
  href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
}];
function Layout({
  children
}) {
  return /* @__PURE__ */ jsxs("html", {
    lang: "en",
    children: [/* @__PURE__ */ jsxs("head", {
      children: [/* @__PURE__ */ jsx("meta", {
        charSet: "utf-8"
      }), /* @__PURE__ */ jsx("meta", {
        name: "viewport",
        content: "width=device-width, initial-scale=1"
      }), /* @__PURE__ */ jsx(Meta, {}), /* @__PURE__ */ jsx(Links, {})]
    }), /* @__PURE__ */ jsxs("body", {
      children: [children, /* @__PURE__ */ jsx(ScrollRestoration, {}), /* @__PURE__ */ jsx(Scripts, {})]
    })]
  });
}
const root = UNSAFE_withComponentProps(function App() {
  const location = useLocation();
  return /* @__PURE__ */ jsxs("div", {
    className: "min-h-screen bg-white",
    children: [/* @__PURE__ */ jsx("nav", {
      className: "border-b",
      children: /* @__PURE__ */ jsx("div", {
        className: "container mx-auto px-4",
        children: /* @__PURE__ */ jsxs("div", {
          className: "flex h-16 items-center justify-between",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "flex items-center gap-6",
            children: [/* @__PURE__ */ jsx(Link, {
              to: "/",
              className: "text-xl font-bold",
              children: "Pulu Web"
            }), /* @__PURE__ */ jsxs("div", {
              className: "hidden md:flex items-center gap-4",
              children: [/* @__PURE__ */ jsx(Link, {
                to: "/",
                className: `px-3 py-2 text-sm font-medium ${location.pathname === "/" ? "text-blue-600" : "text-gray-700 hover:text-gray-900"}`,
                children: "Home"
              }), /* @__PURE__ */ jsx(Link, {
                to: "/about",
                className: `px-3 py-2 text-sm font-medium ${location.pathname === "/about" ? "text-blue-600" : "text-gray-700 hover:text-gray-900"}`,
                children: "About"
              }), /* @__PURE__ */ jsx(Link, {
                to: "/products",
                className: `px-3 py-2 text-sm font-medium ${location.pathname === "/products" ? "text-blue-600" : "text-gray-700 hover:text-gray-900"}`,
                children: "Products"
              }), /* @__PURE__ */ jsx(Link, {
                to: "/dashboard",
                className: `px-3 py-2 text-sm font-medium ${location.pathname === "/dashboard" ? "text-blue-600" : "text-gray-700 hover:text-gray-900"}`,
                children: "Dashboard"
              })]
            })]
          }), /* @__PURE__ */ jsx("div", {
            className: "flex items-center gap-4",
            children: /* @__PURE__ */ jsx("span", {
              className: "text-xs px-2 py-1 bg-green-100 text-green-800 rounded",
              children: "React Router"
            })
          })]
        })
      })
    }), /* @__PURE__ */ jsx("main", {
      children: /* @__PURE__ */ jsx(Outlet, {})
    }), /* @__PURE__ */ jsx("footer", {
      className: "border-t mt-auto",
      children: /* @__PURE__ */ jsx("div", {
        className: "container mx-auto px-4 py-6",
        children: /* @__PURE__ */ jsxs("div", {
          className: "flex items-center justify-between",
          children: [/* @__PURE__ */ jsx("p", {
            className: "text-sm text-gray-600",
            children: "© 2025 Pulu Web. Built with React Router."
          }), /* @__PURE__ */ jsxs("div", {
            className: "flex items-center gap-4",
            children: [/* @__PURE__ */ jsx("a", {
              href: "/api/health",
              className: "text-sm text-gray-600 hover:text-gray-900",
              children: "API Health"
            }), /* @__PURE__ */ jsx("a", {
              href: "/api/products",
              className: "text-sm text-gray-600 hover:text-gray-900",
              children: "API Products"
            })]
          })]
        })
      })
    })]
  });
});
const ErrorBoundary = UNSAFE_withErrorBoundaryProps(function ErrorBoundary2({
  error
}) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack;
  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details = error.status === 404 ? "The requested page could not be found." : error.statusText || details;
  }
  return /* @__PURE__ */ jsxs("main", {
    className: "pt-16 p-4 container mx-auto",
    children: [/* @__PURE__ */ jsx("h1", {
      children: message
    }), /* @__PURE__ */ jsx("p", {
      children: details
    }), stack]
  });
});
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ErrorBoundary,
  Layout,
  default: root,
  links
}, Symbol.toStringTag, { value: "Module" }));
const products$2 = [{
  id: 1,
  name: "Next.js Enterprise",
  price: 299,
  category: "Framework"
}, {
  id: 2,
  name: "React Server Components",
  price: 199,
  category: "Library"
}, {
  id: 3,
  name: "Turbo Build System",
  price: 399,
  category: "Tool"
}, {
  id: 4,
  name: "Vercel Analytics",
  price: 99,
  category: "Service"
}, {
  id: 5,
  name: "Edge Runtime",
  price: 249,
  category: "Infrastructure"
}];
async function loader$4({
  request
}) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get("category");
    let filteredProducts = products$2;
    if (category) {
      filteredProducts = products$2.filter((p) => p.category.toLowerCase() === category.toLowerCase());
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
    return Response.json({
      products: filteredProducts,
      total: filteredProducts.length
    });
  } catch (error) {
    return Response.json({
      error: "Failed to fetch products"
    }, {
      status: 500
    });
  }
}
async function action({
  request
}) {
  if (request.method !== "POST") {
    return Response.json({
      error: "Method not allowed"
    }, {
      status: 405
    });
  }
  try {
    const body = await request.json();
    if (!body.name || !body.price || !body.category) {
      return Response.json({
        error: "Missing required fields"
      }, {
        status: 400
      });
    }
    const newProduct = {
      id: products$2.length + 1,
      name: body.name,
      price: body.price,
      category: body.category
    };
    return Response.json(newProduct, {
      status: 201
    });
  } catch (error) {
    return Response.json({
      error: "Failed to create product"
    }, {
      status: 500
    });
  }
}
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action,
  loader: loader$4
}, Symbol.toStringTag, { value: "Module" }));
const products$1 = [{
  id: 1,
  name: "Next.js Enterprise",
  price: 299,
  category: "Framework"
}, {
  id: 2,
  name: "React Server Components",
  price: 199,
  category: "Library"
}, {
  id: 3,
  name: "Turbo Build System",
  price: 399,
  category: "Tool"
}, {
  id: 4,
  name: "Vercel Analytics",
  price: 99,
  category: "Service"
}, {
  id: 5,
  name: "Edge Runtime",
  price: 249,
  category: "Infrastructure"
}];
async function loader$3({
  params
}) {
  try {
    const productId = parseInt(params.id);
    const product = products$1.find((p) => p.id === productId);
    if (!product) {
      return Response.json({
        error: "Product not found"
      }, {
        status: 404
      });
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
    return Response.json(product);
  } catch (error) {
    return Response.json({
      error: "Failed to fetch product"
    }, {
      status: 500
    });
  }
}
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader: loader$3
}, Symbol.toStringTag, { value: "Module" }));
async function loader$2({
  request
}) {
  try {
    const health = {
      status: "healthy",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      version: process.env.APP_VERSION || "1.0.0",
      environment: process.env.NODE_ENV,
      uptime: process.uptime ? process.uptime() : "N/A"
    };
    return Response.json(health, {
      status: 200,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    });
  } catch (error) {
    return Response.json({
      status: "error",
      message: "Health check failed",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    }, {
      status: 503
    });
  }
}
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader: loader$2
}, Symbol.toStringTag, { value: "Module" }));
async function loader$1({
  request
}) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < 5; i++) {
        const chunk = `data: {"message": "Chunk ${i + 1}", "time": "${(/* @__PURE__ */ new Date()).toISOString()}"}

`;
        controller.enqueue(encoder.encode(chunk));
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    }
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    }
  });
}
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader: loader$1
}, Symbol.toStringTag, { value: "Module" }));
function meta$4({}) {
  return [{
    title: "Dashboard - React Router"
  }, {
    name: "description",
    content: "System dashboard and monitoring"
  }];
}
const dashboard = UNSAFE_withComponentProps(function Dashboard() {
  const [apiHealth, setApiHealth] = useState({
    status: "checking...",
    timestamp: ""
  });
  const [productCount, setProductCount] = useState(0);
  const [loading, setLoading] = useState(true);
  async function fetchDashboardData() {
    setLoading(true);
    try {
      const healthResponse = await fetch("/api/health");
      if (healthResponse.ok) {
        const health = await healthResponse.json();
        setApiHealth(health);
      }
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
    const interval = setInterval(fetchDashboardData, 3e4);
    return () => clearInterval(interval);
  }, []);
  const formatUptime = (uptime) => {
    if (typeof uptime === "number") {
      const minutes = Math.floor(uptime / 60);
      const seconds = Math.floor(uptime % 60);
      return `${minutes}m ${seconds}s`;
    }
    return uptime || "N/A";
  };
  return /* @__PURE__ */ jsxs("div", {
    className: "container py-10 max-w-6xl mx-auto px-4",
    children: [/* @__PURE__ */ jsx("h1", {
      className: "text-4xl font-bold mb-8",
      children: "Dashboard"
    }), loading ? /* @__PURE__ */ jsx("div", {
      className: "grid gap-6 md:grid-cols-2 lg:grid-cols-3",
      children: Array.from({
        length: 4
      }).map((_, i) => /* @__PURE__ */ jsxs("div", {
        className: "border rounded-lg p-6 animate-pulse",
        children: [/* @__PURE__ */ jsx("div", {
          className: "h-4 bg-gray-200 rounded mb-2"
        }), /* @__PURE__ */ jsx("div", {
          className: "h-8 bg-gray-200 rounded"
        })]
      }, i))
    }) : /* @__PURE__ */ jsxs(Fragment, {
      children: [/* @__PURE__ */ jsxs("div", {
        className: "grid gap-6 md:grid-cols-2 lg:grid-cols-3",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "border rounded-lg p-6",
          children: [/* @__PURE__ */ jsx("h2", {
            className: "text-sm font-medium text-gray-600 mb-2",
            children: "API Status"
          }), /* @__PURE__ */ jsx("p", {
            className: "text-2xl font-bold",
            children: /* @__PURE__ */ jsx("span", {
              className: apiHealth.status === "healthy" ? "text-green-600" : "text-red-600",
              children: apiHealth.status === "healthy" ? "✓ Healthy" : "✗ Unhealthy"
            })
          }), apiHealth.timestamp && /* @__PURE__ */ jsxs("p", {
            className: "text-xs text-gray-500 mt-2",
            children: ["Last checked: ", new Date(apiHealth.timestamp).toLocaleTimeString()]
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "border rounded-lg p-6",
          children: [/* @__PURE__ */ jsx("h2", {
            className: "text-sm font-medium text-gray-600 mb-2",
            children: "Total Products"
          }), /* @__PURE__ */ jsx("p", {
            className: "text-2xl font-bold text-blue-600",
            children: productCount
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "border rounded-lg p-6",
          children: [/* @__PURE__ */ jsx("h2", {
            className: "text-sm font-medium text-gray-600 mb-2",
            children: "Environment"
          }), /* @__PURE__ */ jsx("p", {
            className: "text-2xl font-bold",
            children: apiHealth.environment || "development"
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "border rounded-lg p-6",
          children: [/* @__PURE__ */ jsx("h2", {
            className: "text-sm font-medium text-gray-600 mb-2",
            children: "Uptime"
          }), /* @__PURE__ */ jsx("p", {
            className: "text-2xl font-bold",
            children: formatUptime(apiHealth.uptime)
          })]
        })]
      }), /* @__PURE__ */ jsxs("div", {
        className: "mt-8",
        children: [/* @__PURE__ */ jsx("h2", {
          className: "text-2xl font-semibold mb-4",
          children: "Quick Actions"
        }), /* @__PURE__ */ jsxs("div", {
          className: "flex gap-4 flex-wrap",
          children: [/* @__PURE__ */ jsx(Link, {
            to: "/products",
            className: "px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors",
            children: "View Products"
          }), /* @__PURE__ */ jsx(Link, {
            to: "/about",
            className: "px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors",
            children: "About Us"
          }), /* @__PURE__ */ jsx("button", {
            onClick: fetchDashboardData,
            className: "px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors",
            children: "Refresh Data"
          })]
        })]
      })]
    })]
  });
});
const route5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: dashboard,
  meta: meta$4
}, Symbol.toStringTag, { value: "Module" }));
function meta$3({}) {
  return [{
    title: "Products - React Router"
  }, {
    name: "description",
    content: "Browse our product catalog"
  }];
}
const products = UNSAFE_withComponentProps(function Products() {
  const params = useParams();
  const [products2, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  async function fetchProducts(category) {
    setLoading(true);
    setError(null);
    try {
      const url = category ? `/api/products?category=${encodeURIComponent(category)}` : "/api/products";
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
  function handleCategoryChange(e) {
    setSelectedCategory(e.target.value);
    fetchProducts(e.target.value);
  }
  useEffect(() => {
    fetchProducts();
  }, []);
  if (params.id) {
    return /* @__PURE__ */ jsx(Outlet, {});
  }
  return /* @__PURE__ */ jsxs("div", {
    className: "container py-10 max-w-6xl mx-auto px-4",
    children: [/* @__PURE__ */ jsx("h1", {
      className: "text-4xl font-bold mb-8",
      children: "Products"
    }), /* @__PURE__ */ jsxs("div", {
      className: "mb-6",
      children: [/* @__PURE__ */ jsx("label", {
        htmlFor: "category",
        className: "block text-sm font-medium mb-2",
        children: "Filter by Category:"
      }), /* @__PURE__ */ jsxs("select", {
        id: "category",
        value: selectedCategory,
        onChange: handleCategoryChange,
        className: "px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
        children: [/* @__PURE__ */ jsx("option", {
          value: "",
          children: "All Categories"
        }), /* @__PURE__ */ jsx("option", {
          value: "Framework",
          children: "Framework"
        }), /* @__PURE__ */ jsx("option", {
          value: "Library",
          children: "Library"
        }), /* @__PURE__ */ jsx("option", {
          value: "Tool",
          children: "Tool"
        }), /* @__PURE__ */ jsx("option", {
          value: "Service",
          children: "Service"
        }), /* @__PURE__ */ jsx("option", {
          value: "Infrastructure",
          children: "Infrastructure"
        })]
      })]
    }), loading ? /* @__PURE__ */ jsx("div", {
      className: "grid gap-6 md:grid-cols-2 lg:grid-cols-3",
      children: Array.from({
        length: 6
      }).map((_, i) => /* @__PURE__ */ jsxs("div", {
        className: "border rounded-lg p-6 animate-pulse",
        children: [/* @__PURE__ */ jsx("div", {
          className: "h-6 bg-gray-200 rounded mb-4"
        }), /* @__PURE__ */ jsx("div", {
          className: "h-4 bg-gray-200 rounded mb-2"
        }), /* @__PURE__ */ jsx("div", {
          className: "h-4 bg-gray-200 rounded w-2/3"
        })]
      }, i))
    }) : error ? /* @__PURE__ */ jsxs("div", {
      className: "bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg",
      children: ["Error: ", error]
    }) : products2.length === 0 ? /* @__PURE__ */ jsx("div", {
      className: "text-center py-10 text-gray-500",
      children: "No products found."
    }) : /* @__PURE__ */ jsx("div", {
      className: "grid gap-6 md:grid-cols-2 lg:grid-cols-3",
      children: products2.map((product) => /* @__PURE__ */ jsxs(Link, {
        to: `/products/${product.id}`,
        className: "border rounded-lg p-6 hover:shadow-lg transition-shadow block",
        children: [/* @__PURE__ */ jsx("h2", {
          className: "text-xl font-semibold mb-2",
          children: product.name
        }), /* @__PURE__ */ jsx("p", {
          className: "text-gray-600 mb-4",
          children: /* @__PURE__ */ jsx("span", {
            className: "inline-block px-2 py-1 text-xs bg-gray-100 rounded",
            children: product.category
          })
        }), /* @__PURE__ */ jsxs("div", {
          className: "flex items-center justify-between",
          children: [/* @__PURE__ */ jsxs("p", {
            className: "text-2xl font-bold text-blue-600",
            children: ["$", product.price]
          }), /* @__PURE__ */ jsx("span", {
            className: "text-blue-600 text-sm hover:underline",
            children: "View Details →"
          })]
        })]
      }, product.id))
    })]
  });
});
const route6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: products,
  meta: meta$3
}, Symbol.toStringTag, { value: "Module" }));
function meta$2({
  data
}) {
  const product = data;
  return [{
    title: product ? `${product.name} - React Router` : "Product - React Router"
  }, {
    name: "description",
    content: product ? `View details for ${product.name}` : "Product details"
  }];
}
async function loader({
  params
}) {
  try {
    const response = await fetch(`${process.env.ORIGIN || "http://localhost:5174"}/api/products/${params.id}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Product not found");
    }
    return data;
  } catch (error) {
    return null;
  }
}
const products_$id = UNSAFE_withComponentProps(function ProductDetail({
  loaderData
}) {
  const params = useParams();
  const [product, setProduct] = useState(loaderData);
  const [loading, setLoading] = useState(!loaderData);
  const [error, setError] = useState(null);
  async function fetchProduct(id) {
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
    return /* @__PURE__ */ jsx("div", {
      className: "container py-10 max-w-4xl mx-auto px-4",
      children: /* @__PURE__ */ jsxs("div", {
        className: "animate-pulse",
        children: [/* @__PURE__ */ jsx("div", {
          className: "h-8 bg-gray-200 rounded w-1/3 mb-4"
        }), /* @__PURE__ */ jsx("div", {
          className: "h-4 bg-gray-200 rounded w-1/4 mb-6"
        }), /* @__PURE__ */ jsx("div", {
          className: "h-32 bg-gray-200 rounded mb-6"
        }), /* @__PURE__ */ jsx("div", {
          className: "h-10 bg-gray-200 rounded w-32"
        })]
      })
    });
  }
  if (error) {
    return /* @__PURE__ */ jsx("div", {
      className: "container py-10 max-w-4xl mx-auto px-4",
      children: /* @__PURE__ */ jsxs("div", {
        className: "text-center py-10",
        children: [/* @__PURE__ */ jsx("h1", {
          className: "text-2xl font-bold text-red-600 mb-4",
          children: "Error"
        }), /* @__PURE__ */ jsx("p", {
          className: "text-gray-600 mb-6",
          children: error
        }), /* @__PURE__ */ jsx(Link, {
          to: "/products",
          className: "inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors",
          children: "Back to Products"
        })]
      })
    });
  }
  if (!product) {
    return /* @__PURE__ */ jsx("div", {
      className: "container py-10 max-w-4xl mx-auto px-4",
      children: /* @__PURE__ */ jsxs("div", {
        className: "text-center py-10",
        children: [/* @__PURE__ */ jsx("h1", {
          className: "text-2xl font-bold text-gray-600 mb-4",
          children: "Product Not Found"
        }), /* @__PURE__ */ jsx(Link, {
          to: "/products",
          className: "inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors",
          children: "Back to Products"
        })]
      })
    });
  }
  const getProductDescription = (id) => {
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
  return /* @__PURE__ */ jsxs("div", {
    className: "container py-10 max-w-4xl mx-auto px-4",
    children: [/* @__PURE__ */ jsx("nav", {
      className: "mb-6 text-sm",
      children: /* @__PURE__ */ jsxs("ol", {
        className: "flex items-center space-x-2",
        children: [/* @__PURE__ */ jsx("li", {
          children: /* @__PURE__ */ jsx(Link, {
            to: "/",
            className: "text-gray-500 hover:text-gray-700",
            children: "Home"
          })
        }), /* @__PURE__ */ jsx("li", {
          className: "text-gray-400",
          children: "/"
        }), /* @__PURE__ */ jsx("li", {
          children: /* @__PURE__ */ jsx(Link, {
            to: "/products",
            className: "text-gray-500 hover:text-gray-700",
            children: "Products"
          })
        }), /* @__PURE__ */ jsx("li", {
          className: "text-gray-400",
          children: "/"
        }), /* @__PURE__ */ jsx("li", {
          className: "text-gray-900",
          children: product.name
        })]
      })
    }), /* @__PURE__ */ jsxs("div", {
      className: "bg-white border rounded-lg p-8",
      children: [/* @__PURE__ */ jsx("div", {
        className: "mb-4",
        children: /* @__PURE__ */ jsx("span", {
          className: "inline-block px-3 py-1 text-sm bg-gray-100 rounded-full",
          children: product.category
        })
      }), /* @__PURE__ */ jsx("h1", {
        className: "text-3xl font-bold mb-4",
        children: product.name
      }), /* @__PURE__ */ jsxs("div", {
        className: "mb-6",
        children: [/* @__PURE__ */ jsxs("span", {
          className: "text-4xl font-bold text-blue-600",
          children: ["$", product.price]
        }), /* @__PURE__ */ jsx("span", {
          className: "text-gray-500 ml-2",
          children: "USD"
        })]
      }), /* @__PURE__ */ jsxs("div", {
        className: "prose prose-gray max-w-none mb-8",
        children: [/* @__PURE__ */ jsx("h2", {
          className: "text-xl font-semibold mb-3",
          children: "Product Description"
        }), /* @__PURE__ */ jsx("p", {
          className: "text-gray-600",
          children: getProductDescription(product.id)
        })]
      }), /* @__PURE__ */ jsxs("div", {
        className: "border-t pt-6",
        children: [/* @__PURE__ */ jsx("h3", {
          className: "text-lg font-semibold mb-3",
          children: "Key Features"
        }), /* @__PURE__ */ jsxs("ul", {
          className: "list-disc list-inside space-y-2 text-gray-600",
          children: [/* @__PURE__ */ jsx("li", {
            children: "Enterprise-ready solution"
          }), /* @__PURE__ */ jsx("li", {
            children: "Scalable architecture"
          }), /* @__PURE__ */ jsx("li", {
            children: "Premium support included"
          }), /* @__PURE__ */ jsx("li", {
            children: "Regular updates and maintenance"
          }), /* @__PURE__ */ jsx("li", {
            children: "Comprehensive documentation"
          })]
        })]
      }), /* @__PURE__ */ jsxs("div", {
        className: "flex gap-4 mt-8",
        children: [/* @__PURE__ */ jsx("button", {
          className: "px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors",
          children: "Add to Cart"
        }), /* @__PURE__ */ jsx(Link, {
          to: "/products",
          className: "px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors",
          children: "Back to Products"
        })]
      })]
    }), /* @__PURE__ */ jsxs("div", {
      className: "mt-12",
      children: [/* @__PURE__ */ jsx("h2", {
        className: "text-2xl font-semibold mb-6",
        children: "Related Products"
      }), /* @__PURE__ */ jsxs("div", {
        className: "text-gray-600",
        children: [/* @__PURE__ */ jsxs("p", {
          children: ["Check out other products in the ", /* @__PURE__ */ jsx("strong", {
            children: product.category
          }), " category."]
        }), /* @__PURE__ */ jsxs(Link, {
          to: `/products?category=${encodeURIComponent(product.category)}`,
          className: "text-blue-600 hover:underline mt-2 inline-block",
          children: ["View all ", product.category, " products →"]
        })]
      })]
    })]
  });
});
const route7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: products_$id,
  loader,
  meta: meta$2
}, Symbol.toStringTag, { value: "Module" }));
function meta$1({}) {
  return [{
    title: "React Router Features Demo"
  }, {
    name: "description",
    content: "React Router v7 with Server-Side Rendering"
  }];
}
const _index = UNSAFE_withComponentProps(function Index() {
  const [serverData, setServerData] = useState(null);
  const [loading, setLoading] = useState(true);
  async function getServerData() {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return {
      message: "Hello from React Router Server!",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  useEffect(() => {
    getServerData().then((data) => {
      setServerData(data);
      setLoading(false);
    });
  }, []);
  return /* @__PURE__ */ jsxs("div", {
    className: "container py-10 max-w-2xl mx-auto px-4",
    children: [/* @__PURE__ */ jsx("h1", {
      className: "text-4xl font-bold mb-8",
      children: "React Router Features Demo"
    }), /* @__PURE__ */ jsxs("div", {
      className: "space-y-6",
      children: [/* @__PURE__ */ jsxs("section", {
        children: [/* @__PURE__ */ jsx("h2", {
          className: "text-2xl font-semibold mb-4",
          children: "Server-Side Rendering with Loading States"
        }), loading ? /* @__PURE__ */ jsx("div", {
          className: "animate-pulse",
          children: "Loading..."
        }) : serverData ? /* @__PURE__ */ jsxs("div", {
          className: "border rounded-lg p-4",
          children: [/* @__PURE__ */ jsx("h3", {
            className: "font-semibold",
            children: "Server Component"
          }), /* @__PURE__ */ jsx("p", {
            className: "text-sm text-gray-600",
            children: serverData.message
          }), /* @__PURE__ */ jsxs("p", {
            className: "text-xs text-gray-500",
            children: ["Fetched at: ", serverData.timestamp]
          })]
        }) : null]
      }), /* @__PURE__ */ jsxs("section", {
        children: [/* @__PURE__ */ jsx("h2", {
          className: "text-2xl font-semibold mb-4",
          children: "Features"
        }), /* @__PURE__ */ jsxs("ul", {
          className: "list-disc list-inside space-y-2 text-gray-600",
          children: [/* @__PURE__ */ jsx("li", {
            children: "File-based routing with route modules"
          }), /* @__PURE__ */ jsx("li", {
            children: "Server-side rendering by default"
          }), /* @__PURE__ */ jsx("li", {
            children: "Built-in loading states"
          }), /* @__PURE__ */ jsx("li", {
            children: "SEO with meta management"
          }), /* @__PURE__ */ jsx("li", {
            children: "TypeScript support"
          }), /* @__PURE__ */ jsx("li", {
            children: "Tailwind CSS v4 styling"
          })]
        })]
      })]
    })]
  });
});
const route8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _index,
  meta: meta$1
}, Symbol.toStringTag, { value: "Module" }));
function meta({}) {
  return [{
    title: "About - React Router"
  }, {
    name: "description",
    content: "Learn more about Pulu Web and our mission"
  }];
}
const about = UNSAFE_withComponentProps(function About() {
  return /* @__PURE__ */ jsx("div", {
    className: "container py-10",
    children: /* @__PURE__ */ jsxs("div", {
      className: "mx-auto max-w-[800px]",
      children: [/* @__PURE__ */ jsx("h1", {
        className: "text-4xl font-bold mb-6",
        children: "About Pulu Web"
      }), /* @__PURE__ */ jsxs("div", {
        className: "prose prose-gray max-w-none",
        children: [/* @__PURE__ */ jsx("p", {
          className: "text-lg text-gray-600 mb-6",
          children: "Pulu Web is a modern web application built with the latest web technologies, showcasing the power of React Router and server-side rendering."
        }), /* @__PURE__ */ jsxs("section", {
          className: "mb-8",
          children: [/* @__PURE__ */ jsx("h2", {
            className: "text-2xl font-semibold mb-4",
            children: "Our Mission"
          }), /* @__PURE__ */ jsx("p", {
            className: "text-gray-600",
            children: "We're dedicated to building fast, accessible, and user-friendly web applications that leverage the latest advancements in web technology. Our platform demonstrates best practices in modern web development."
          })]
        }), /* @__PURE__ */ jsxs("section", {
          className: "mb-8",
          children: [/* @__PURE__ */ jsx("h2", {
            className: "text-2xl font-semibold mb-4",
            children: "Technology Stack"
          }), /* @__PURE__ */ jsxs("ul", {
            className: "list-disc list-inside space-y-2 text-gray-600",
            children: [/* @__PURE__ */ jsx("li", {
              children: "React Router v7 with file-based routing"
            }), /* @__PURE__ */ jsx("li", {
              children: "React 19 with server components"
            }), /* @__PURE__ */ jsx("li", {
              children: "TypeScript for type safety"
            }), /* @__PURE__ */ jsx("li", {
              children: "Tailwind CSS v4 for styling"
            }), /* @__PURE__ */ jsx("li", {
              children: "Pulumi for infrastructure as code"
            }), /* @__PURE__ */ jsx("li", {
              children: "AWS Lambda & CloudFront for hosting"
            })]
          })]
        }), /* @__PURE__ */ jsxs("section", {
          className: "mb-8",
          children: [/* @__PURE__ */ jsx("h2", {
            className: "text-2xl font-semibold mb-4",
            children: "Features"
          }), /* @__PURE__ */ jsxs("div", {
            className: "grid gap-4 md:grid-cols-2",
            children: [/* @__PURE__ */ jsxs("div", {
              className: "border rounded-lg p-4",
              children: [/* @__PURE__ */ jsx("h3", {
                className: "font-semibold mb-2",
                children: "Performance First"
              }), /* @__PURE__ */ jsx("p", {
                className: "text-sm text-gray-600",
                children: "Built with performance in mind, utilizing server-side rendering, streaming, and edge computing."
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "border rounded-lg p-4",
              children: [/* @__PURE__ */ jsx("h3", {
                className: "font-semibold mb-2",
                children: "SEO Optimized"
              }), /* @__PURE__ */ jsx("p", {
                className: "text-sm text-gray-600",
                children: "Full SEO support with metadata management, sitemaps, and structured data."
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "border rounded-lg p-4",
              children: [/* @__PURE__ */ jsx("h3", {
                className: "font-semibold mb-2",
                children: "Type Safe"
              }), /* @__PURE__ */ jsx("p", {
                className: "text-sm text-gray-600",
                children: "End-to-end type safety with TypeScript throughout the stack."
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "border rounded-lg p-4",
              children: [/* @__PURE__ */ jsx("h3", {
                className: "font-semibold mb-2",
                children: "Modern Architecture"
              }), /* @__PURE__ */ jsx("p", {
                className: "text-sm text-gray-600",
                children: "Leveraging the latest React features including server components and streaming SSR."
              })]
            })]
          })]
        }), /* @__PURE__ */ jsxs("section", {
          children: [/* @__PURE__ */ jsx("h2", {
            className: "text-2xl font-semibold mb-4",
            children: "Get Started"
          }), /* @__PURE__ */ jsxs("p", {
            className: "text-gray-600",
            children: ["Ready to explore what we've built? Check out our", " ", /* @__PURE__ */ jsx("a", {
              href: "/dashboard",
              className: "text-blue-600 hover:underline",
              children: "Dashboard"
            }), " ", "or browse our", " ", /* @__PURE__ */ jsx("a", {
              href: "/products",
              className: "text-blue-600 hover:underline",
              children: "Products"
            }), "."]
          })]
        })]
      })]
    })
  });
});
const route9 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: about,
  meta
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-v2NSV6UG.js", "imports": ["/assets/chunk-PVWAREVJ-BqQIE8w_.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": true, "module": "/assets/root-Cew8YXYc.js", "imports": ["/assets/chunk-PVWAREVJ-BqQIE8w_.js"], "css": ["/assets/root-4CZQeiK6.css"], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.products": { "id": "routes/api.products", "parentId": "root", "path": "api/products", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/api.products-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.products.$id": { "id": "routes/api.products.$id", "parentId": "routes/api.products", "path": ":id", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/api.products._id-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.health": { "id": "routes/api.health", "parentId": "root", "path": "api/health", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/api.health-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.stream": { "id": "routes/api.stream", "parentId": "root", "path": "api/stream", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/api.stream-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/dashboard": { "id": "routes/dashboard", "parentId": "root", "path": "dashboard", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/dashboard-DjzrfbOQ.js", "imports": ["/assets/chunk-PVWAREVJ-BqQIE8w_.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/products": { "id": "routes/products", "parentId": "root", "path": "products", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/products-C7Qu6OfE.js", "imports": ["/assets/chunk-PVWAREVJ-BqQIE8w_.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/products.$id": { "id": "routes/products.$id", "parentId": "routes/products", "path": ":id", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/products._id-CnI0bJwV.js", "imports": ["/assets/chunk-PVWAREVJ-BqQIE8w_.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/_index": { "id": "routes/_index", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/_index-B_GOc5eW.js", "imports": ["/assets/chunk-PVWAREVJ-BqQIE8w_.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/about": { "id": "routes/about", "parentId": "root", "path": "about", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/about-B_LAZD92.js", "imports": ["/assets/chunk-PVWAREVJ-BqQIE8w_.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 } }, "url": "/assets/manifest-7c77f3cc.js", "version": "7c77f3cc", "sri": void 0 };
const assetsBuildDirectory = "build/client";
const basename = "/";
const future = { "unstable_middleware": false, "unstable_optimizeDeps": false, "unstable_splitRouteModules": false, "unstable_subResourceIntegrity": false, "unstable_viteEnvironmentApi": false };
const ssr = true;
const isSpaMode = false;
const prerender = [];
const routeDiscovery = { "mode": "lazy", "manifestPath": "/__manifest" };
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/api.products": {
    id: "routes/api.products",
    parentId: "root",
    path: "api/products",
    index: void 0,
    caseSensitive: void 0,
    module: route1
  },
  "routes/api.products.$id": {
    id: "routes/api.products.$id",
    parentId: "routes/api.products",
    path: ":id",
    index: void 0,
    caseSensitive: void 0,
    module: route2
  },
  "routes/api.health": {
    id: "routes/api.health",
    parentId: "root",
    path: "api/health",
    index: void 0,
    caseSensitive: void 0,
    module: route3
  },
  "routes/api.stream": {
    id: "routes/api.stream",
    parentId: "root",
    path: "api/stream",
    index: void 0,
    caseSensitive: void 0,
    module: route4
  },
  "routes/dashboard": {
    id: "routes/dashboard",
    parentId: "root",
    path: "dashboard",
    index: void 0,
    caseSensitive: void 0,
    module: route5
  },
  "routes/products": {
    id: "routes/products",
    parentId: "root",
    path: "products",
    index: void 0,
    caseSensitive: void 0,
    module: route6
  },
  "routes/products.$id": {
    id: "routes/products.$id",
    parentId: "routes/products",
    path: ":id",
    index: void 0,
    caseSensitive: void 0,
    module: route7
  },
  "routes/_index": {
    id: "routes/_index",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route8
  },
  "routes/about": {
    id: "routes/about",
    parentId: "root",
    path: "about",
    index: void 0,
    caseSensitive: void 0,
    module: route9
  }
};
export {
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  prerender,
  publicPath,
  routeDiscovery,
  routes,
  ssr
};
