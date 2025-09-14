import type { Route } from "./+types/api.products";

// Mock product data (same as Next.js)
const products = [
  { id: 1, name: "Next.js Enterprise", price: 299, category: "Framework" },
  { id: 2, name: "React Server Components", price: 199, category: "Library" },
  { id: 3, name: "Turbo Build System", price: 399, category: "Tool" },
  { id: 4, name: "Vercel Analytics", price: 99, category: "Service" },
  { id: 5, name: "Edge Runtime", price: 249, category: "Infrastructure" },
];

// GET /api/products
export async function loader({ request }: Route.LoaderArgs) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    
    let filteredProducts = products;
    
    if (category) {
      filteredProducts = products.filter(
        p => p.category.toLowerCase() === category.toLowerCase()
      );
    }
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return Response.json({
      products: filteredProducts,
      total: filteredProducts.length,
    });
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST /api/products
export async function action({ request }: Route.ActionArgs) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await request.json();
    
    // Validate request body
    if (!body.name || !body.price || !body.category) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Simulate creating a product
    const newProduct = {
      id: products.length + 1,
      name: body.name,
      price: body.price,
      category: body.category,
    };
    
    return Response.json(newProduct, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}