import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://legalconnect.ng";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/dashboard/",
          "/client-dashboard/",
          "/settings/",
          "/messages/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
