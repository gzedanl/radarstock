import type { MetadataRoute } from "next";

const SITE_URL = "https://www.radarstock.cl";

// /dashboard y /billing están detrás de auth (ver robots.ts), y
// /login /signup son formularios sin contenido propio que valga la pena
// posicionar. /privacidad y /terminos sí son contenido público legal.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/privacidad`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terminos`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
