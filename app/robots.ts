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
        // búsqueda. /propuesta* son presentaciones comerciales para
        // mandar por link directo a prospectos — no deben indexarse ni
        // aparecer en el sitio, aunque son públicas (no requieren login).
        disallow: ["/dashboard", "/billing", "/api/", "/propuesta"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
