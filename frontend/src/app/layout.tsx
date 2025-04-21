import type { Metadata } from "next";
import "./globals.css";
import { Poppins } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import { Navbar } from "@/components/navbar";
import { Providers } from "@/components/providers";
import { AnchorProvider } from "@/lib/anchor-provider";
import "@solana/wallet-adapter-react-ui/styles.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Coinpetitive",
  description: "Challenge platform on Solana blockchain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <Providers>
          <AuthProvider>
            <AnchorProvider>
              <Navbar />
              {children}
            </AnchorProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
