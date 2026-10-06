import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Marcaí",
  description: "Gerencie seus agendamentos com facilidade",
  // Verificação de domínio da Meta. Via metadata para sair no HTML renderizado
  // no servidor — o robô da Meta não executa JavaScript.
  other: {
    "facebook-domain-verification": "d9fi5q6feg32is7lx77etzso3wgwfd",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={poppins.variable}>
      <body className="antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
