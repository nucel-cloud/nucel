import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container py-10">
      <div className="mx-auto flex max-w-md flex-col items-center justify-center text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Page not found</h2>
        <p className="text-muted-foreground mb-8">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <Link
          href="/"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
}