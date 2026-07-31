import { lazy, Suspense, useEffect, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { Download, ExternalLink, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { getPublishedPdfUrl } from "@/lib/pdf.functions";

const PdfReader = lazy(() => import("./pdf-reader").then((m) => ({ default: m.PdfReader })));

function ReaderFallback() {
  return (
    <div className="grid h-[72vh] place-items-center rounded-md border border-[var(--border)] bg-surface-2">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Preparing reader…
      </div>
    </div>
  );
}

export function PdfViewer({ slug, title }: { slug: string; title: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState<string>("newsletter.pdf");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const fetchUrl = useServerFn(getPublishedPdfUrl);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    fetchUrl({ data: { slug } })
      .then((res) => {
        if (cancelled) return;
        if (!res.url) {
          setStatus("error");
        } else {
          setUrl(res.url);
          setFilename(res.filename ?? "newsletter.pdf");
          setStatus("ready");
        }
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
  }, [slug, fetchUrl]);

  if (status === "loading") {
    return (
      <div className="grid h-[70vh] place-items-center rounded-md border border-[var(--border)] bg-surface-2">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading PDF…
        </div>
      </div>
    );
  }

  if (status === "error" || !url) {
    return (
      <div className="rounded-md border border-[var(--border)] bg-surface-2 p-10 text-center">
        <div className="font-mono text-[11px] uppercase tracking-widest text-[var(--brand)]">
          PDF unavailable
        </div>
        <h3 className="mt-3 text-xl text-headline">This edition can't be displayed right now.</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Please refresh, or try downloading the file directly.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap justify-end gap-2 pb-3">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center gap-2 rounded-md border border-[var(--border)] px-3 text-sm text-foreground hover:bg-secondary"
        >
          <ExternalLink className="h-4 w-4" /> Open PDF
        </a>
        <a
          href={url}
          download={filename}
          className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-[var(--brand-strong)]"
        >
          <Download className="h-4 w-4" /> Download PDF
        </a>
      </div>
      <ClientOnly fallback={<ReaderFallback />}>
        <Suspense fallback={<ReaderFallback />}>
          <PdfReader url={url} title={title} />
        </Suspense>
      </ClientOnly>
    </div>
  );
}
