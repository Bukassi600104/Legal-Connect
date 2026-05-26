import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LegalConnect NG",
    short_name: "LegalConnect",
    description:
      "Connect with verified legal professionals across Nigeria",
    start_url: "/feed",
    display: "standalone",
    background_color: "#F7F5F2",
    theme_color: "#1B2A4A",
    icons: [
      {
        src: "/brand/legalconnect-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/brand/legalconnect-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
