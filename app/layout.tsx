import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Phronesis",
  description: "Evidence-driven decision intelligence for collectible markets.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Phronesis",
  },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#09090b",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-zinc-950 antialiased">
      <body className="flex min-h-full min-w-0 flex-col overflow-x-hidden bg-zinc-950">{children}</body>
    </html>
  );
}
