import type { Metadata } from "next";
import "./globals.css";
import LenisProvider from "@/components/providers/LenisProvider";

export const metadata: Metadata = {
  title: "Omar Gamal - Full Stack Engineer",
  description: "Portfolio of Omar Gamal, crafting digital experiences through elegant code and architecture.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <LenisProvider>
          {children}
        </LenisProvider>
      </body>
    </html>
  );
}
