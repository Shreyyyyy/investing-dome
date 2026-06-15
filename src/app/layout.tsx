import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SHREY HERITAGE CLUB - AI Planner",
  description: "Shrey's Bespoke Investment & Wealth Management Planning",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col bg-cream-50 selection:bg-brass-500 selection:text-white">
        <header className="border-b border-cream-200 py-6 px-4 md:px-12 flex justify-between items-center bg-cream-50">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-widest text-brass-600 font-bold">ESTABLISHED 2026</span>
            <span className="font-serif text-2xl font-bold text-hunter-800 tracking-tight">SHREY HERITAGE CLUB</span>
          </div>
          <div className="flex items-center space-x-2 text-xs uppercase tracking-wider text-brass-600">
            <span>Premium Wealth Management</span>
          </div>
        </header>
        
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        
        <footer className="border-t border-cream-200 py-8 px-4 text-center text-xs uppercase tracking-widest text-brass-600 bg-cream-50">
          © {new Date().getFullYear()} SHREY HERITAGE CLUB. ALL RIGHTS RESERVED. SECURED VIA OAUTH2 & GROQ AI.
        </footer>
      </body>
    </html>
  );
}
