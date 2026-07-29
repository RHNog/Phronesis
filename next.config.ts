import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Runtime evidence can overlap with normal development or build activity.
  // Isolate its generated manifests from the shared default directory.
  distDir: process.env.JARVIS_RUNTIME_EVIDENCE === "1" ? ".next-evidence" : ".next",
  // The serialized Worker must capture the product surface without Next.js
  // development chrome obscuring narrow-layout controls or result details.
  devIndicators: process.env.JARVIS_RUNTIME_EVIDENCE === "1" ? false : undefined,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cards.scryfall.io", pathname: "/**" },
      { protocol: "https", hostname: "cards.lorcast.io", pathname: "/**" },
    ],
  },
};

export default nextConfig;
