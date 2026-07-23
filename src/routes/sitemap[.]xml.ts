import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data } = await supabaseAdmin
          .from("newsletters")
          .select("slug, updated_at")
          .eq("status", "published");

        const staticEntries = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/newsletters", changefreq: "daily", priority: "0.9" },
          { path: "/about", changefreq: "monthly", priority: "0.5" },
        ];
        const dynamic = (data ?? []).map((n) => ({
          path: `/newsletters/${n.slug}`,
          lastmod: n.updated_at,
          changefreq: "weekly" as const,
          priority: "0.8",
        }));

        const all = [...staticEntries, ...dynamic];
        const urls = all.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            "lastmod" in e && e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            `    <changefreq>${e.changefreq}</changefreq>`,
            `    <priority>${e.priority}</priority>`,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );
        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=1800",
          },
        });
      },
    },
  },
});
