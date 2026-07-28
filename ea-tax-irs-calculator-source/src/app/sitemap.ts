import type { MetadataRoute } from "next";

const BASE_URL = "https://calculator.eataxresolutions.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["/", "/methodology", "/privacy", "/terms"];
  return routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date("2026-07-21"),
    changeFrequency: route === "/" ? "weekly" : "yearly",
    priority: route === "/" ? 1 : 0.5,
  }));
}
