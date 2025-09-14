"use client";

import { useState } from "react";

type Product = {
  id: number;
  name: string;
  price: number;
  inStock: boolean;
};

export default function ProductActions({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  const handleAddToCart = async () => {
    setIsAdding(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsAdding(false);
    setShowNotification(true);
    
    // Hide notification after 3 seconds
    setTimeout(() => setShowNotification(false), 3000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center border rounded-md">
          <button
            className="px-3 py-1 hover:bg-accent transition-colors"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
          >
            -
          </button>
          <span className="px-4 py-1 min-w-[50px] text-center">{quantity}</span>
          <button
            className="px-3 py-1 hover:bg-accent transition-colors"
            onClick={() => setQuantity(quantity + 1)}
          >
            +
          </button>
        </div>
        
        <span className="text-muted-foreground">
          ${(product.price * quantity).toFixed(2)} total
        </span>
      </div>

      <button
        className={`w-full rounded-md px-4 py-2 font-medium transition-colors ${
          product.inStock
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "bg-muted text-muted-foreground cursor-not-allowed"
        }`}
        onClick={handleAddToCart}
        disabled={!product.inStock || isAdding}
      >
        {isAdding ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Adding...
          </span>
        ) : product.inStock ? (
          "Add to Cart"
        ) : (
          "Out of Stock"
        )}
      </button>

      {showNotification && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-lg animate-in slide-in-from-bottom-2">
          Added {quantity} {product.name} to cart!
        </div>
      )}
    </div>
  );
}