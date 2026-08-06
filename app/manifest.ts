import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Phronesis",
    short_name: "Phronesis",
    description:
      "Evidence-driven decision intelligence for collectible markets.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#09090b",
    icons: [
      {
        src: "/brand/phronesis-app-icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/brand/phronesis-app-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
