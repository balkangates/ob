import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://orbicity-batumi.vercel.app";
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily",   priority: 1 },
    { url: `${base}/search`,  changeFrequency: "daily",   priority: 0.9 },
    { url: `${base}/login`,   changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/register`, changeFrequency: "monthly", priority: 0.3 },
  ];

  try {
    const { data: apts } = await supabase
      .from("apartments").select("id").eq("status", "active");
    const aptRoutes: MetadataRoute.Sitemap = (apts ?? []).map((a) => ({
      url: `${base}/apartment/${a.id}`,
      changeFrequency: "weekly",
      priority: 0.8,
    }));
    return [...staticRoutes, ...aptRoutes];
  } catch {
    return staticRoutes;
  }
}
