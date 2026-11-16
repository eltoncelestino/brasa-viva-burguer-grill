import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brasa Viva Burger & Grill | Cardápio Digital & Pedidos",
  description:
    "Hambúrgueres artesanais na brasa e cortes nobres em Fortaleza - CE. Peça para entrega, retirada ou direto da sua mesa.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen antialiased selection:bg-orange-200 selection:text-orange-950">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
