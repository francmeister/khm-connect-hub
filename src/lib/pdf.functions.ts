import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Returns a short-lived signed URL for a published newsletter's PDF.
 * Public callers may only reach files whose corresponding newsletter row has
 * status = 'published'. Everything else 404s.
 */
export const getPublishedPdfUrl = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => z.object({ slug: z.string().min(1) }).parse(raw))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("newsletters")
      .select("pdf_path, pdf_filename, status")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error || !row || row.status !== "published") {
      return { url: null as string | null, filename: null as string | null };
    }
    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from("newsletter-pdfs")
      .createSignedUrl(row.pdf_path, 60 * 60);
    if (signErr) return { url: null, filename: null };
    return { url: signed.signedUrl, filename: row.pdf_filename ?? "newsletter.pdf" };
  });
