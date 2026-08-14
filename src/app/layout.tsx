import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gestão do Terreiro",
  description: "Mensalidades, doações e prestação de contas",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900 antialiased">
        {children}
      </body>
    </html>
  );
}
