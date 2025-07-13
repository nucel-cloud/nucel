import "./globals.css";
import "@repo/ui/styles.css";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

export const metadata: Metadata = {
  title: {
    default: "Pulu Web",
    template: "%s | Pulu Web",
  },
  description: "A modern web application built with Next.js 15",
  keywords: ["Next.js", "React", "TypeScript", "Pulu"],
  authors: [{ name: "Pulu Team" }],
  openGraph: {
    title: "Pulu Web",
    description: "A modern web application built with Next.js 15",
    siteName: "Pulu Web",
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans antialiased">
        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
              <div className="mr-4 flex">
                <a href="/" className="mr-6 flex items-center space-x-2">
                  <span className="font-bold">Pulu Web</span>
                </a>
                <nav className="flex items-center gap-6 text-sm">
                  <a href="/about" className="transition-colors hover:text-foreground/80">
                    About
                  </a>
                  <a href="/products" className="transition-colors hover:text-foreground/80">
                    Products
                  </a>
                  <a href="/blog" className="transition-colors hover:text-foreground/80">
                    Blog
                  </a>
                  <a href="/dashboard" className="transition-colors hover:text-foreground/80">
                    Dashboard
                  </a>
                </nav>
              </div>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t py-6 md:py-0">
            <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
              <p className="text-center text-sm leading-loose text-muted-foreground">
                Built with Next.js 15. The source code is available on GitHub.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}