import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  MAX_PDF_BYTES,
  PDF_BUCKET,
  COVER_BUCKET,
  slugify,
  formatBytes,
} from "@/lib/khm";
import { logActivity } from "@/lib/newsletters";
import type { NewsletterRow } from "@/lib/newsletters";
import { analyzeNewsletterPdf, generateNewsletterCover } from "@/lib/ai-newsletter.functions";
import { Eyebrow } from "@/components/site/eyebrow";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Loader2, Save, Sparkles, Upload, Wand2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  existing?: NewsletterRow;
}

interface AiProposal {
  title: string;
  edition_number: string;
  publication_date: string;
  description: string;
  categories: string[];
  keywords: string[];
  tech_spotlight_title?: string | null;
  tech_spotlight_description?: string | null;
  cover_prompt: string;
  coverPath: string | null;
  coverUrl: string | null;
}


export function NewsletterForm({ existing }: Props) {
  const navigate = useNavigate();
  const [title, setTitle] = useState(existing?.title ?? "");
  const [edition, setEdition] = useState(existing?.edition_number ?? "");
  const [pubDate, setPubDate] = useState(existing?.publication_date ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [slug, setSlug] = useState(existing?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!existing);
  const [categories, setCategories] = useState((existing?.categories ?? []).join(", "));
  const [keywords, setKeywords] = useState((existing?.keywords ?? []).join(", "));
  const [featured, setFeatured] = useState(existing?.is_featured ?? false);
  const [spotTitle, setSpotTitle] = useState(existing?.tech_spotlight_title ?? "");
  const [spotDesc, setSpotDesc] = useState(existing?.tech_spotlight_description ?? "");

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [aiCoverPath, setAiCoverPath] = useState<string | null>(null);
  const [aiCoverPreview, setAiCoverPreview] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState<null | "analyze" | "cover">(null);
  const [proposal, setProposal] = useState<AiProposal | null>(null);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState<null | "publish" | "draft">(null);

  const analyzeFn = useServerFn(analyzeNewsletterPdf);
  const coverFn = useServerFn(generateNewsletterCover);


  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  const pdfError = useMemo(() => {
    if (!pdfFile) return null;
    if (pdfFile.type !== "application/pdf" && !pdfFile.name.toLowerCase().endsWith(".pdf")) {
      return "PDF files only.";
    }
    if (pdfFile.size > MAX_PDF_BYTES) return `File must be ≤ ${formatBytes(MAX_PDF_BYTES)}.`;
    return null;
  }, [pdfFile]);

  async function fileToBase64(file: File): Promise<string> {
    const buf = await file.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(buf);
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(
        null,
        Array.from(bytes.subarray(i, i + chunk)),
      );
    }
    return btoa(binary);
  }

  async function autoFillFromPdf() {
    if (!pdfFile) {
      toast.error("Attach a PDF first.");
      return;
    }
    if (pdfError) {
      toast.error(pdfError);
      return;
    }
    setAiBusy("analyze");
    setProposal(null);
    try {
      toast.info("Reading PDF with AI…");
      const b64 = await fileToBase64(pdfFile);
      const meta = await analyzeFn({
        data: { pdfBase64: b64, filename: pdfFile.name },
      });
      toast.success("Metadata extracted. Generating cover…");
      setAiBusy("cover");
      let coverPath: string | null = null;
      let coverUrl: string | null = null;
      try {
        const cover = await coverFn({ data: { prompt: meta.cover_prompt } });
        coverPath = cover.path;
        coverUrl = cover.signedUrl;
      } catch {
        toast.error("Cover generation failed — you can retry it in the preview.");
      }
      setProposal({ ...meta, coverPath, coverUrl });
      toast.success("Preview ready — review before applying.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "AI auto-fill failed");
    } finally {
      setAiBusy(null);
    }
  }

  function applyProposal() {
    if (!proposal) return;
    setTitle(proposal.title);
    setSlug(slugify(proposal.title));
    setSlugTouched(true);
    setEdition(proposal.edition_number);
    setPubDate(proposal.publication_date);
    setDescription(proposal.description);
    setCategories(proposal.categories.join(", "));
    setKeywords(proposal.keywords.join(", "));
    if (proposal.tech_spotlight_title) setSpotTitle(proposal.tech_spotlight_title);
    if (proposal.tech_spotlight_description) setSpotDesc(proposal.tech_spotlight_description);
    if (proposal.coverPath) {
      setAiCoverPath(proposal.coverPath);
      setAiCoverPreview(proposal.coverUrl);
      setCoverFile(null);
    }
    setProposal(null);
    toast.success("Applied to the form. Review and save when ready.");
  }

  async function regenerateProposalCover() {
    if (!proposal) return;
    setAiBusy("cover");
    try {
      const cover = await coverFn({ data: { prompt: proposal.cover_prompt } });
      setProposal({ ...proposal, coverPath: cover.path, coverUrl: cover.signedUrl });
      toast.success("New cover generated.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Cover generation failed");
    } finally {
      setAiBusy(null);
    }
  }


  async function regenerateCover() {
    const prompt = [title, description, categories].filter(Boolean).join(". ");
    if (!prompt) {
      toast.error("Fill in title/description first.");
      return;
    }
    setAiBusy("cover");
    try {
      const cover = await coverFn({ data: { prompt } });
      setAiCoverPath(cover.path);
      setAiCoverPreview(cover.signedUrl);
      toast.success("New cover generated.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Cover generation failed");
    } finally {
      setAiBusy(null);
    }
  }

  async function save(target: "publish" | "draft") {
    if (busy) return;
    if (!title || !edition || !pubDate || !description || !slug) {
      toast.error("Fill in all required fields.");
      return;
    }
    if (!existing && !pdfFile) {
      toast.error("Attach a PDF file.");
      return;
    }
    if (pdfError) {
      toast.error(pdfError);
      return;
    }

    setBusy(target);
    setProgress(5);
    let uploadedPdfPath: string | null = null;
    let uploadedCoverPath: string | null = null;

    try {
      // Slug/edition uniqueness pre-check (RLS also enforces)
      const { data: existingSlug } = await supabase
        .from("newsletters")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (existingSlug && existingSlug.id !== existing?.id) {
        throw new Error("A newsletter with that slug already exists.");
      }

      // Upload PDF (if new)
      let pdfPath = existing?.pdf_path ?? "";
      let pdfFilename = existing?.pdf_filename ?? null;
      let pdfSize = existing?.pdf_size ?? null;
      if (pdfFile) {
        const path = `${new Date().getFullYear()}/${crypto.randomUUID()}-${pdfFile.name}`;
        setProgress(20);
        const { error } = await supabase.storage.from(PDF_BUCKET).upload(path, pdfFile, {
          upsert: false,
          contentType: "application/pdf",
        });
        if (error) throw new Error("PDF upload failed: " + error.message);
        uploadedPdfPath = path;
        pdfPath = path;
        pdfFilename = pdfFile.name;
        pdfSize = pdfFile.size;
        setProgress(60);
      }

      // Cover: manual upload wins; else AI-generated (already uploaded); else keep existing
      let coverPath = existing?.cover_image_path ?? null;
      if (coverFile) {
        const cpath = `${new Date().getFullYear()}/${crypto.randomUUID()}-${coverFile.name}`;
        const { error } = await supabase.storage
          .from(COVER_BUCKET)
          .upload(cpath, coverFile, { upsert: false, contentType: coverFile.type });
        if (error) throw new Error("Cover upload failed: " + error.message);
        uploadedCoverPath = cpath;
        coverPath = cpath;
      } else if (aiCoverPath) {
        coverPath = aiCoverPath;
      }

      setProgress(80);
      const pubD = new Date(pubDate);
      const payload = {
        title,
        slug,
        edition_number: edition,
        description,
        publication_date: pubDate,
        publication_month: pubD.getMonth() + 1,
        publication_year: pubD.getFullYear(),
        pdf_path: pdfPath,
        pdf_filename: pdfFilename,
        pdf_size: pdfSize,
        cover_image_path: coverPath,
        categories: categories
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        keywords: keywords
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        is_featured: featured,
        tech_spotlight_title: spotTitle || null,
        tech_spotlight_description: spotDesc || null,
        status: target === "publish" ? ("published" as const) : ("draft" as const),
        published_at:
          target === "publish"
            ? existing?.published_at ?? new Date().toISOString()
            : existing?.published_at ?? null,
      };

      let rowId = existing?.id;
      const oldPdfPath = existing?.pdf_path;
      if (existing) {
        const { error } = await supabase.from("newsletters").update(payload).eq("id", existing.id);
        if (error) throw error;
        // Remove old PDF only after successful update
        if (uploadedPdfPath && oldPdfPath && oldPdfPath !== uploadedPdfPath) {
          await supabase.storage.from(PDF_BUCKET).remove([oldPdfPath]);
        }
      } else {
        const { data: userData } = await supabase.auth.getUser();
        const uid = userData.user?.id;
        const { data, error } = await supabase
          .from("newsletters")
          .insert({ ...payload, created_by: uid, updated_by: uid })
          .select("id")
          .single();
        if (error) throw error;
        rowId = data.id;
      }

      setProgress(100);
      await logActivity(existing ? `edit_${payload.status}` : `create_${payload.status}`, rowId ?? null, {
        title,
        edition,
      });
      toast.success(target === "publish" ? "Published" : "Saved as draft");
      navigate({ to: "/admin/newsletters" });
    } catch (err: unknown) {
      // Rollback any freshly-uploaded storage
      if (uploadedPdfPath) await supabase.storage.from(PDF_BUCKET).remove([uploadedPdfPath]);
      if (uploadedCoverPath)
        await supabase.storage.from(COVER_BUCKET).remove([uploadedCoverPath]);
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(null);
      setTimeout(() => setProgress(0), 800);
    }
  }

  return (
    <div className="space-y-8">
      <div className="border border-[var(--brand)]/40 bg-surface p-6">
        <Eyebrow tone="brand">STEP 1 — PDF &amp; AI AUTO-FILL</Eyebrow>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Attach the edition PDF first, then let AI draft the title, short description,
          categories, keywords, spotlight and a matching cover. You review everything before it
          is applied.
        </p>

        <Label className="mt-5 block text-xs uppercase tracking-widest">
          PDF file {existing ? "(replace)" : "*"}
        </Label>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
          className="mt-2 block w-full text-sm text-muted-foreground file:mr-4 file:cursor-pointer file:rounded-md file:border file:border-[var(--border)] file:bg-secondary file:px-4 file:py-2 file:text-sm file:text-foreground hover:file:bg-[color-mix(in_oklab,var(--secondary)_80%,var(--brand))]"
        />
        {pdfFile && (
          <p className="mt-2 text-xs text-muted-foreground">
            {pdfFile.name} — {formatBytes(pdfFile.size)}
          </p>
        )}
        {pdfError && <p className="mt-2 text-xs text-destructive">{pdfError}</p>}
        {existing && !pdfFile && (
          <p className="mt-2 text-xs text-muted-foreground">
            Current: {existing.pdf_filename ?? existing.pdf_path}
          </p>
        )}

        <button
          type="button"
          onClick={autoFillFromPdf}
          disabled={!pdfFile || !!pdfError || !!aiBusy || !!busy}
          className="mt-4 inline-flex h-10 items-center gap-2 rounded-md border border-[var(--brand)]/50 bg-[color-mix(in_oklab,var(--brand)_14%,transparent)] px-4 text-sm font-medium text-[var(--brand)] hover:bg-[color-mix(in_oklab,var(--brand)_22%,transparent)] disabled:opacity-50"
        >
          {aiBusy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {aiBusy === "analyze"
            ? "Reading PDF…"
            : aiBusy === "cover"
              ? "Generating cover…"
              : "Auto-fill with AI"}
        </button>
        {!pdfFile && (
          <p className="mt-2 text-xs text-muted-foreground">
            Upload the PDF above to enable AI auto-fill.
          </p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">

        <Field label="Newsletter title" required>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-background border-[var(--border)]" />
        </Field>
        <Field label="Edition number" required>
          <Input value={edition} onChange={(e) => setEdition(e.target.value)} className="bg-background border-[var(--border)]" placeholder="e.g. Edition 07 / 2026" />
        </Field>
        <Field label="Publication date" required>
          <Input type="date" value={pubDate} onChange={(e) => setPubDate(e.target.value)} className="bg-background border-[var(--border)]" />
        </Field>
        <Field label="Slug" hint="URL identifier — auto-generated from title">
          <Input
            value={slug}
            onChange={(e) => {
              setSlug(slugify(e.target.value));
              setSlugTouched(true);
            }}
            className="bg-background border-[var(--border)] font-mono"
          />
        </Field>
      </div>

      <Field label="Short description" required>
        <Textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="bg-background border-[var(--border)]"
        />
      </Field>

      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Categories" hint="Comma-separated">
          <Input value={categories} onChange={(e) => setCategories(e.target.value)} className="bg-background border-[var(--border)]" />
        </Field>
        <Field label="Keywords / tags" hint="Comma-separated">
          <Input value={keywords} onChange={(e) => setKeywords(e.target.value)} className="bg-background border-[var(--border)]" />
        </Field>
      </div>

      <div className="border border-[var(--border)] bg-surface p-6">
        <Eyebrow tone="brand">COVER</Eyebrow>
        <div className="mt-4 grid gap-6">

          <div>
            <Label className="text-xs uppercase tracking-widest">Cover image (optional)</Label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                setCoverFile(e.target.files?.[0] ?? null);
                if (e.target.files?.[0]) {
                  setAiCoverPath(null);
                  setAiCoverPreview(null);
                }
              }}
              className="mt-2 block w-full text-sm text-muted-foreground file:mr-4 file:cursor-pointer file:rounded-md file:border file:border-[var(--border)] file:bg-secondary file:px-4 file:py-2 file:text-sm file:text-foreground hover:file:bg-[color-mix(in_oklab,var(--secondary)_80%,var(--brand))]"
            />
            {coverFile && (
              <p className="mt-2 text-xs text-muted-foreground">{coverFile.name}</p>
            )}
            {aiCoverPreview && !coverFile && (
              <div className="mt-3">
                <img
                  src={aiCoverPreview}
                  alt="AI-generated cover preview"
                  className="aspect-[3/4] w-40 border border-[var(--border)] object-cover"
                />
                <p className="mt-1 text-xs text-muted-foreground">AI-generated cover</p>
              </div>
            )}
            <button
              type="button"
              onClick={regenerateCover}
              disabled={!!aiBusy || !!busy}
              className="mt-3 inline-flex h-9 items-center gap-2 rounded-md border border-[var(--border)] px-3 text-xs font-medium text-foreground hover:bg-secondary disabled:opacity-50"
            >
              {aiBusy === "cover" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Wand2 className="h-3.5 w-3.5" />
              )}
              {aiCoverPreview ? "Regenerate cover" : "Generate cover with AI"}
            </button>
          </div>
        </div>
      </div>

      {proposal && (
        <div className="border border-[var(--brand)]/40 bg-surface p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Eyebrow tone="brand">AI EXTRACTION PREVIEW</Eyebrow>
            <p className="text-xs text-muted-foreground">
              Nothing is saved yet — review, then apply to the form.
            </p>
          </div>

          <div className="mt-5 grid gap-6 md:grid-cols-[minmax(0,1fr)_10rem]">
            <dl className="space-y-4">
              <PreviewRow label="Title" value={proposal.title} />
              <PreviewRow label="Edition" value={proposal.edition_number} />
              <PreviewRow label="Publication date" value={proposal.publication_date} />
              <PreviewRow label="Slug" value={slugify(proposal.title)} mono />
              <PreviewRow label="Description" value={proposal.description} />
              <PreviewRow
                label="Categories"
                value={proposal.categories.join(", ") || "—"}
              />
              <PreviewRow label="Keywords" value={proposal.keywords.join(", ") || "—"} />
              <PreviewRow
                label="Spotlight title"
                value={proposal.tech_spotlight_title || "—"}
              />
              <PreviewRow
                label="Spotlight description"
                value={proposal.tech_spotlight_description || "—"}
              />
            </dl>

            <div>
              <Label className="text-xs uppercase tracking-widest">Cover</Label>
              <div className="mt-2">
                {proposal.coverUrl ? (
                  <img
                    src={proposal.coverUrl}
                    alt="Proposed AI-generated cover"
                    className="aspect-[3/4] w-40 border border-[var(--border)] object-cover"
                  />
                ) : (
                  <div className="flex aspect-[3/4] w-40 items-center justify-center border border-dashed border-[var(--border)] text-center text-xs text-muted-foreground">
                    No cover yet
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={regenerateProposalCover}
                disabled={!!aiBusy || !!busy}
                className="mt-3 inline-flex h-9 items-center gap-2 rounded-md border border-[var(--border)] px-3 text-xs font-medium text-foreground hover:bg-secondary disabled:opacity-50"
              >
                {aiBusy === "cover" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Wand2 className="h-3.5 w-3.5" />
                )}
                {proposal.coverUrl ? "Regenerate" : "Generate cover"}
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 border-t border-[var(--border)] pt-5">
            <button
              type="button"
              onClick={applyProposal}
              disabled={!!aiBusy || !!busy}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-[var(--brand-strong)] disabled:opacity-60"
            >
              <Sparkles className="h-4 w-4" />
              Apply to form
            </button>
            <button
              type="button"
              onClick={() => setProposal(null)}
              disabled={!!aiBusy}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--border)] px-5 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-60"
            >
              Discard
            </button>
          </div>
        </div>
      )}



      <div className="border border-[var(--border)] bg-surface p-6">
        <Eyebrow>TECHNOLOGY SPOTLIGHT (OPTIONAL)</Eyebrow>
        <div className="mt-4 space-y-4">
          <Field label="Spotlight title">
            <Input value={spotTitle} onChange={(e) => setSpotTitle(e.target.value)} className="bg-background border-[var(--border)]" />
          </Field>
          <Field label="Spotlight description">
            <Textarea
              rows={3}
              value={spotDesc}
              onChange={(e) => setSpotDesc(e.target.value)}
              className="bg-background border-[var(--border)]"
            />
          </Field>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Switch id="feat" checked={featured} onCheckedChange={setFeatured} />
        <Label htmlFor="feat" className="cursor-pointer">Featured edition</Label>
      </div>

      {progress > 0 && (
        <div role="status" aria-live="polite">
          <Progress value={progress} />
          <p className="mt-2 text-xs text-muted-foreground">Uploading… {progress}%</p>
        </div>
      )}

      <div className="flex flex-wrap gap-3 border-t border-[var(--border)] pt-6">
        <button
          onClick={() => save("publish")}
          disabled={!!busy}
          className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-[var(--brand-strong)] disabled:opacity-60"
        >
          {busy === "publish" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {existing ? "Save & Publish" : "Upload & Publish"}
        </button>
        <button
          onClick={() => save("draft")}
          disabled={!!busy}
          className="inline-flex h-11 items-center gap-2 rounded-md border border-[var(--border)] px-6 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-60"
        >
          {busy === "draft" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save as Draft
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-xs uppercase tracking-widest">
        {label}
        {required && <span className="ml-1 text-[var(--brand)]">*</span>}
      </Label>
      <div className="mt-2">{children}</div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function PreviewRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="grid gap-1 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
      <dt className="text-xs uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className={`text-sm text-foreground ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}
