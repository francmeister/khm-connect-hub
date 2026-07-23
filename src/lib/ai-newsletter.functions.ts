import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const AnalysisSchema = z.object({
  title: z.string(),
  edition_number: z.string(),
  publication_date: z.string(),
  description: z.string(),
  categories: z.array(z.string()),
  keywords: z.array(z.string()),
  tech_spotlight_title: z.string().nullable().optional(),
  tech_spotlight_description: z.string().nullable().optional(),
  cover_prompt: z.string(),
});

async function assertAdmin(
  supabase: { rpc: (fn: "has_role", args: { _user_id: string; _role: "admin" }) => Promise<{ data: boolean | null }> },
  userId: string,
) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

export const analyzeNewsletterPdf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        pdfBase64: z.string().min(1),
        filename: z.string().min(1),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const system = `You are an editorial assistant for KHM Info Hub, an internal company newsletter. Given a newsletter PDF, extract structured metadata. Respond ONLY with JSON matching this shape:
{
  "title": string,               // Punchy headline for this edition (max 70 chars)
  "edition_number": string,      // e.g. "Edition 16 / 2026" — infer from PDF if present, else best guess
  "publication_date": string,    // ISO date YYYY-MM-DD — infer from PDF, else use best guess for current year
  "description": string,         // 2–3 sentence teaser summarising the edition (max 280 chars)
  "categories": string[],        // 2–4 broad themes (e.g. ["People", "Innovation"])
  "keywords": string[],          // 4–8 specific tags
  "tech_spotlight_title": string | null,
  "tech_spotlight_description": string | null,
  "cover_prompt": string         // A concise visual prompt for an abstract editorial cover: dark background, subtle crimson (#F24545) glow, minimalist geometric composition, no text, evocative of the edition's theme
}
No prose, no code fences.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract the metadata for this newsletter." },
              {
                type: "file",
                file: {
                  filename: data.filename,
                  file_data: `data:application/pdf;base64,${data.pdfBase64}`,
                },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`AI analysis failed (${res.status}): ${t.slice(0, 300)}`);
    }
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content ?? "";
    const cleaned = content.replace(/^```json\s*|\s*```$/g, "").trim();
    const parsed = AnalysisSchema.parse(JSON.parse(cleaned));
    return parsed;
  });

export const generateNewsletterCover = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ prompt: z.string().min(1) }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const fullPrompt = `${data.prompt}. Style: dark near-black background, subtle crimson (#F24545) radial glow bottom-right, minimalist abstract editorial composition, geometric shapes and light, no text, no logos, cinematic, 3:4 portrait aspect.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image",
        messages: [{ role: "user", content: fullPrompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`Cover generation failed (${res.status}): ${t.slice(0, 300)}`);
    }
    const json = (await res.json()) as { data?: { b64_json?: string }[] };
    const b64 = json.data?.[0]?.b64_json;
    if (!b64) throw new Error("No image returned");

    // Upload to newsletter-covers bucket
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const year = new Date().getFullYear();
    const path = `${year}/${crypto.randomUUID()}.png`;
    const { error: upErr } = await supabaseAdmin.storage
      .from("newsletter-covers")
      .upload(path, bytes, { contentType: "image/png", upsert: false });
    if (upErr) throw new Error(`Upload failed: ${upErr.message}`);

    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from("newsletter-covers")
      .createSignedUrl(path, 3600);
    if (signErr) throw new Error(`Sign failed: ${signErr.message}`);

    return { path, signedUrl: signed.signedUrl };
  });
