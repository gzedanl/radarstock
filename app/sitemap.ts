import type { MetadataRoute } from "next";

const SITE_URL = "https://www.radarstock.cl";

// Solo la landing es contenido público indexable — /dashboard y
// /billing están detrás de auth (ver robots.ts), y /login /signup son
// formularios sin contenido propio que valga la pena posicionar.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
