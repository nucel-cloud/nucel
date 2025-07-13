"use client";

import { useRouter } from "next/navigation";
import { FormEvent } from "react";

export default function SearchForm() {
  const router = useRouter();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const search = formData.get("search") as string;
    
    if (search) {
      router.push(`/search?q=${encodeURIComponent(search)}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        name="search"
        placeholder="Search products..."
        className="flex-1 rounded-md border px-3 py-2 text-sm"
      />
      <button
        type="submit"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Search
      </button>
    </form>
  );
}