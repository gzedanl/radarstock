import type { MetadataRoute } from "next";

const SITE_URL = "https://www.radarstock.cl";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Páginas detrás de auth y endpoints internos — sin valor de
        // indexar, y /api/* nunca debería aparecer en resultados de
        // búsqueda.
        disallow: ["/dashboard", "/billing", "/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
