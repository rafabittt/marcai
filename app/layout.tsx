import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Marcaí",
  description: "Gerencie seus agendamentos com facilidade",
  // Verificação de domínio da Meta. Via metadata para sair no HTML renderizado
  // no servidor — o robô da Meta não executa JavaScript.
  other: {
    "facebook-domain-verification": "d9fi5q6feg32is7lx77etzso3wgwfd",
  },
};

// Cor da barra do navegador no celular: o fundo do Grafite, claro e escuro.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F0F0F3" },
    { media: "(prefers-color-scheme: dark)", color: "#141416" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
