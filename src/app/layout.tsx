import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gestão do Terreiro",
  description: "Mensalidades, doações e prestação de contas",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- App Router: fonts loaded once here apply to every route, not just a single page. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700&family=Instrument+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
