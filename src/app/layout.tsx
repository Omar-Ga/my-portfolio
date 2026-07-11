import type { Metadata } from "next";
import "./globals.css";

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
        {children}
      {/* impeccable-live-start */}
<script src="http://localhost:8400/live.js"></script>
{/* impeccable-live-end */}
</body>
    </html>
  );
}
