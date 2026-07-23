import { Link } from "@tanstack/react-router";
import type { NewsletterRow } from "@/lib/newsletters";
import { formatEditionDate } from "@/lib/khm";
import { CoverThumb } from "./cover-thumb";

export function NewsletterCard({ n }: { n: NewsletterRow }) {
  return (
    <Link
      to="/newsletters/$slug"
      params={{ slug: n.slug }}
      className="group flex flex-col border border-[var(--border)] bg-surface p-5 transition-colors hover:border-[var(--brand)]/50"
    >
      <CoverThumb newsletter={n} className="mb-5" />
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em]">
        <span className="text-[var(--brand)]">{n.edition_number}</span>
        <span className="text-muted-foreground">{formatEditionDate(n.publication_date)}</span>
      </div>
      <h3 className="mt-3 text-lg font-normal text-headline group-hover:text-foreground">
        {n.title}
      </h3>
      <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">{n.description}</p>
      <div className="mt-5 text-sm text-foreground group-hover:text-[var(--brand)]">
        Read edition →
      </div>
    </Link>
  );
}
