import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:5226";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Atelier — Ropa contemporánea",
  description:
    "Prendas atemporales, materiales nobles y diseño responsable. Mujer, hombre, accesorios y calzado.",
  openGraph: {
    type: "website",
    siteName: "Atelier",
    locale: "es_PE",
    title: "Atelier — Ropa contemporánea",
    description: "Prendas atemporales, materiales nobles y diseño responsable.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
