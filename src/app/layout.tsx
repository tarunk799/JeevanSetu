import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "JeevanSetu — Emergency Medical Profile Builder",
  description:
    "Upload messy medical records, prescriptions, and lab reports. Get a structured emergency medical profile shareable via QR code.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50" role="navigation" aria-label="Main navigation">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
              <span aria-hidden="true">+</span>
              <span>JeevanSetu</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/upload" className="text-gray-600 hover:text-primary transition-colors font-medium">
                Upload
              </Link>
              <Link href="/dashboard" className="text-gray-600 hover:text-primary transition-colors font-medium">
                Profiles
              </Link>
            </div>
          </div>
        </nav>
        <main className="flex-1">{children}</main>
        <footer className="bg-white border-t border-gray-200 py-6 text-center text-sm text-gray-500">
          <p>JeevanSetu — Bridging medical records to save lives</p>
          <p className="mt-1">Powered by Google Gemini AI</p>
        </footer>
      </body>
    </html>
  );
}
