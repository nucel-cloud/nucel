import type { Route } from "./+types/api.products.$id";

// Mock product data (same as Next.js)
const products = [
  { id: 1, name: "Next.js Enterprise", price: 299, category: "Framework" },
  { id: 2, name: "React Server Components", price: 199, category: "Library" },
  { id: 3, name: "Turbo Build System", price: 399, category: "Tool" },
  { id: 4, name: "Vercel Analytics", price: 99, category: "Service" },
  { id: 5, name: "Edge Runtime", price: 249, category: "Infrastructure" },
];

// GET /api/products/:id
export async function loader({ params }: Route.LoaderArgs) {
  try {
    const productId = parseInt(params.id);
    const product = products.find(p => p.id === productId);
    
    if (!product) {
      return Response.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return Response.json(product);
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}