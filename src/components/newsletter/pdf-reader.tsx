import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import type { PDFDocumentProxy } from "pdfjs-dist";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

type PageEl = HTMLDivElement | null;

export function PdfReader({ url, title }: { url: string; title: string }) {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [current, setCurrent] = useState(1);
  const [progress, setProgress] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [showThumbs, setShowThumbs] = useState(true);
  const [wide, setWide] = useState(false);
  const [error, setError] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<PageEl[]>([]);
  const rendered = useRef<Set<number>>(new Set());

  // Load document
  useEffect(() => {
    let cancelled = false;
    const task = pdfjs.getDocument({ url });
    task.promise
      .then((d) => {
        if (cancelled) {
          d.destroy();
          return;
        }
        setDoc(d);
        setNumPages(d.numPages);
      })
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
      task.destroy();
    };
  }, [url]);

  const renderPage = useCallback(
    async (pageNumber: number, container: HTMLDivElement) => {
      if (!doc || rendered.current.has(pageNumber)) return;
      rendered.current.add(pageNumber);
      try {
        const page = await doc.getPage(pageNumber);
        const base = page.getViewport({ scale: 1 });
        const width = container.clientWidth || 800;
        const scale = (width / base.width) * (window.devicePixelRatio || 1);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = "100%";
        canvas.style.height = "auto";
        canvas.style.display = "block";
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        await page.render({ canvas, canvasContext: ctx, viewport }).promise;
        container.replaceChildren(canvas);
      } catch {
        rendered.current.delete(pageNumber);
      }
    },
    [doc],
  );

  // Reset rendered pages when zoom changes (re-render at new width)
  useEffect(() => {
    rendered.current.clear();
    pageRefs.current.forEach((el, i) => {
      if (el && el.isConnected) {
        el.replaceChildren();
        const rect = el.getBoundingClientRect();
        const parent = scrollRef.current?.getBoundingClientRect();
        if (parent && rect.bottom > parent.top - 400 && rect.top < parent.bottom + 800) {
          renderPage(i + 1, el);
        }
      }
    });
  }, [zoom, renderPage]);

  // Lazy render on scroll + progress tracking
  useEffect(() => {
    const root = scrollRef.current;
    if (!root || !doc) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const idx = Number((entry.target as HTMLElement).dataset.page);
          if (entry.isIntersecting) {
            renderPage(idx, entry.target as HTMLDivElement);
          }
        }
      },
      { root, rootMargin: "600px 0px" },
    );

    pageRefs.current.forEach((el) => el && observer.observe(el));

    const onScroll = () => {
      const max = root.scrollHeight - root.clientHeight;
      setProgress(max > 0 ? Math.min(100, Math.max(0, (root.scrollTop / max) * 100)) : 0);
      const mid = root.scrollTop + root.clientHeight * 0.35;
      let page = 1;
      pageRefs.current.forEach((el, i) => {
        if (el && el.offsetTop <= mid) page = i + 1;
      });
      setCurrent(page);
    };
    root.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      observer.disconnect();
      root.removeEventListener("scroll", onScroll);
    };
  }, [doc, numPages, renderPage]);

  const goToPage = useCallback((p: number) => {
    const el = pageRefs.current[p - 1];
    const root = scrollRef.current;
    if (el && root) root.scrollTo({ top: el.offsetTop - 12, behavior: "smooth" });
  }, []);

  if (error) {
    return (
      <div className="rounded-md border border-[var(--border)] bg-surface-2 p-8 text-center text-sm text-muted-foreground">
        The reader couldn't load this PDF. Use “Open PDF” or “Download PDF” above.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-[var(--border)] bg-surface">
      {/* Reading progress */}
      <div className="h-[3px] w-full bg-[var(--border)]">
        <div
          className="h-full bg-[var(--brand)] transition-[width] duration-150"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-label="Reading progress"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] bg-surface-2 px-3 py-2">
        <button
          type="button"
          onClick={() => setShowThumbs((v) => !v)}
          className="hidden h-8 items-center gap-2 rounded-md border border-[var(--border)] px-2 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground md:inline-flex"
          aria-label={showThumbs ? "Hide page thumbnails" : "Show page thumbnails"}
        >
          {showThumbs ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
          Pages
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => goToPage(Math.max(1, current - 1))}
            disabled={current <= 1}
            className="grid h-8 w-8 place-items-center rounded-md border border-[var(--border)] text-muted-foreground disabled:opacity-40 hover:bg-secondary hover:text-foreground"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            {numPages ? `${current} / ${numPages}` : "—"}
          </span>
          <button
            type="button"
            onClick={() => goToPage(Math.min(numPages, current + 1))}
            disabled={current >= numPages}
            className="grid h-8 w-8 place-items-center rounded-md border border-[var(--border)] text-muted-foreground disabled:opacity-40 hover:bg-secondary hover:text-foreground"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.6, Math.round((z - 0.2) * 10) / 10))}
            className="grid h-8 w-8 place-items-center rounded-md border border-[var(--border)] text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="w-12 text-center font-mono text-[11px] text-muted-foreground">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(2, Math.round((z + 0.2) * 10) / 10))}
            className="grid h-8 w-8 place-items-center rounded-md border border-[var(--border)] text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setWide((v) => !v)}
            className="grid h-8 w-8 place-items-center rounded-md border border-[var(--border)] text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label={wide ? "Exit tall view" : "Tall view"}
          >
            {wide ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex">
        {showThumbs && doc && (
          <aside
            className="hidden w-[168px] shrink-0 overflow-y-auto border-r border-[var(--border)] bg-surface-2 p-3 md:block"
            style={{ height: wide ? "88vh" : "72vh" }}
            aria-label="Page thumbnails"
          >
            <div className="space-y-3">
              {Array.from({ length: numPages }, (_, i) => (
                <Thumbnail
                  key={i}
                  doc={doc}
                  pageNumber={i + 1}
                  active={current === i + 1}
                  onSelect={goToPage}
                />
              ))}
            </div>
          </aside>
        )}

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto bg-neutral-900/60 p-3"
          style={{ height: wide ? "88vh" : "72vh" }}
          aria-label={`${title} reader`}
        >
          <div className="mx-auto space-y-4" style={{ maxWidth: `${900 * zoom}px` }}>
            {Array.from({ length: numPages || 1 }, (_, i) => (
              <div
                key={i}
                data-page={i + 1}
                ref={(el) => {
                  pageRefs.current[i] = el;
                }}
                className="grid min-h-[420px] w-full place-items-center overflow-hidden rounded-sm bg-neutral-100 shadow-lg"
              >
                <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Thumbnail({
  doc,
  pageNumber,
  active,
  onSelect,
}: {
  doc: PDFDocumentProxy;
  pageNumber: number;
  active: boolean;
  onSelect: (p: number) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const done = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      async (entries) => {
        if (!entries[0]?.isIntersecting || done.current) return;
        done.current = true;
        try {
          const page = await doc.getPage(pageNumber);
          const base = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: 260 / base.width });
          const canvas = document.createElement("canvas");
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.style.width = "100%";
          canvas.style.height = "auto";
          canvas.style.display = "block";
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          await page.render({ canvas, canvasContext: ctx, viewport }).promise;
          el.replaceChildren(canvas);
        } catch {
          done.current = false;
        }
      },
      { rootMargin: "300px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [doc, pageNumber]);

  return (
    <button
      type="button"
      onClick={() => onSelect(pageNumber)}
      className="block w-full text-left"
      aria-label={`Go to page ${pageNumber}`}
      aria-current={active ? "true" : undefined}
    >
      <div
        ref={ref}
        className={`grid min-h-[120px] w-full place-items-center overflow-hidden rounded-sm border bg-neutral-100 transition-colors ${
          active ? "border-[var(--brand)]" : "border-[var(--border)] hover:border-foreground/40"
        }`}
      />
      <div
        className={`mt-1 text-center font-mono text-[10px] tracking-widest ${
          active ? "text-[var(--brand)]" : "text-muted-foreground"
        }`}
      >
        {pageNumber}
      </div>
    </button>
  );
}
