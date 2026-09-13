import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "US Equity OS",
    short_name: "Equity OS",
    description: "Système personnel d'analyse des actions américaines",
    start_url: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#14181f",
    theme_color: "#14181f",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
