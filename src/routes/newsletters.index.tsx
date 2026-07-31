import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { searchPublishedNewsletters } from "@/lib/newsletters";
import { SiteLayout } from "@/components/site/site-layout";
import { Container } from "@/components/site/container";
import { Eyebrow } from "@/components/site/eyebrow";
import { NewsletterCard } from "@/components/newsletter/newsletter-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { monthName } from "@/lib/khm";
import { Search, X } from "lucide-react";

const ALL = "all";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  year: fallback(z.string(), ALL).default(ALL),
  month: fallback(z.string(), ALL).default(ALL),
  category: fallback(z.string(), ALL).default(ALL),
  keyword: fallback(z.string(), ALL).default(ALL),
  edition: fallback(z.string(), "").default(""),
  from: fallback(z.string(), "").default(""),
  to: fallback(z.string(), "").default(""),
  sort: fallback(z.string(), "newest").default("newest"),
});

export const Route = createFileRoute("/newsletters/")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Newsletter Archive — KHM Info Hub" },
      {
        name: "description",
        content:
          "Search and browse every KHM Info Hub newsletter edition. Filter by edition, date, category or keyword.",
      },
      { property: "og:title", content: "Newsletter Archive — KHM Info Hub" },
      { property: "og:description", content: "Every edition. One connected story." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ArchivePage,
});

function ArchivePage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/newsletters" });

  type ArchiveSearch = z.infer<typeof searchSchema>;
  const setParam = (patch: Partial<ArchiveSearch>) =>
    navigate({ search: (prev: ArchiveSearch) => ({ ...prev, ...patch }), replace: true });

  // Debounced text inputs (URL stays clean while typing)
  const [qInput, setQInput] = useState(search.q);
  const [editionInput, setEditionInput] = useState(search.edition);
  useEffect(() => setQInput(search.q), [search.q]);
  useEffect(() => setEditionInput(search.edition), [search.edition]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (qInput !== search.q) setParam({ q: qInput });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qInput]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (editionInput !== search.edition) setParam({ edition: editionInput });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editionInput]);

  const { data = [], isLoading } = useQuery({
    queryKey: ["newsletter-search", search.q],
    queryFn: () => searchPublishedNewsletters(search.q),
    placeholderData: (prev) => prev,
  });

  // Facets come from the unfiltered published set so options never disappear mid-search
  const { data: allEditions = [] } = useQuery({
    queryKey: ["newsletter-search", ""],
    queryFn: () => searchPublishedNewsletters(""),
  });

  const years = useMemo(
    () =>
      Array.from(
        new Set(allEditions.map((n) => n.publication_year).filter(Boolean) as number[]),
      ).sort((a, b) => b - a),
    [allEditions],
  );
  const categories = useMemo(
    () => Array.from(new Set(allEditions.flatMap((n) => n.categories ?? []))).sort(),
    [allEditions],
  );
  const keywords = useMemo(
    () => Array.from(new Set(allEditions.flatMap((n) => n.keywords ?? []))).sort(),
    [allEditions],
  );

  const filtered = useMemo(() => {
    let arr = data.slice();
    if (search.year !== ALL) arr = arr.filter((n) => String(n.publication_year) === search.year);
    if (search.month !== ALL) arr = arr.filter((n) => String(n.publication_month) === search.month);
    if (search.category !== ALL)
      arr = arr.filter((n) => (n.categories ?? []).includes(search.category));
    if (search.keyword !== ALL)
      arr = arr.filter((n) => (n.keywords ?? []).includes(search.keyword));
    if (search.edition.trim()) {
      const needle = search.edition.trim().toLowerCase();
      arr = arr.filter((n) => n.edition_number.toLowerCase().includes(needle));
    }
    if (search.from) arr = arr.filter((n) => n.publication_date >= search.from);
    if (search.to) arr = arr.filter((n) => n.publication_date <= search.to);

    if (search.sort !== "relevance" || !search.q) {
      arr.sort((a, b) => {
        if (search.sort === "edition")
          return b.edition_number.localeCompare(a.edition_number, undefined, { numeric: true });
        const cmp =
          new Date(a.publication_date).getTime() - new Date(b.publication_date).getTime();
        return search.sort === "oldest" ? cmp : -cmp;
      });
    }
    return arr;
  }, [data, search]);

  const [limit, setLimit] = useState(9);
  useEffect(() => setLimit(9), [search]);
  const shown = filtered.slice(0, limit);

  const activeChips: { label: string; clear: Partial<ArchiveSearch> }[] = [
    ...(search.q ? [{ label: `“${search.q}”`, clear: { q: "" } }] : []),
    ...(search.edition ? [{ label: `Edition ${search.edition}`, clear: { edition: "" } }] : []),
    ...(search.year !== ALL ? [{ label: search.year, clear: { year: ALL } }] : []),
    ...(search.month !== ALL
      ? [{ label: monthName(Number(search.month)), clear: { month: ALL } }]
      : []),
    ...(search.category !== ALL ? [{ label: search.category, clear: { category: ALL } }] : []),
    ...(search.keyword !== ALL ? [{ label: `#${search.keyword}`, clear: { keyword: ALL } }] : []),
    ...(search.from ? [{ label: `From ${search.from}`, clear: { from: "" } }] : []),
    ...(search.to ? [{ label: `To ${search.to}`, clear: { to: "" } }] : []),
  ];

  function clearAll() {
    navigate({
      search: {
        q: "",
        year: ALL,
        month: ALL,
        category: ALL,
        keyword: ALL,
        edition: "",
        from: "",
        to: "",
        sort: "newest",
      },
      replace: true,
    });
  }

  return (
    <SiteLayout>
      <section className="border-b border-[var(--border)]">
        <Container size="wide" className="py-20">
          <Eyebrow>NEWSLETTER ARCHIVE</Eyebrow>
          <h1 className="mt-4 text-4xl font-light text-headline md:text-6xl">
            Every edition. One connected story.
          </h1>
          <p className="mt-5 max-w-2xl text-muted-foreground">
            Full-text search across every edition — titles, summaries, categories, keywords and
            Technology Spotlight — then narrow by edition, date, category or keyword.
          </p>
        </Container>
      </section>

      <Container size="wide" className="py-12">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search everything — e.g. “agentic AI”, innovation challenge, Q3 strategy"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            className="h-12 border-[var(--border)] bg-surface pl-10"
            aria-label="Search newsletters"
          />
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          <Input
            placeholder="Edition #"
            value={editionInput}
            onChange={(e) => setEditionInput(e.target.value)}
            className="h-11 border-[var(--border)] bg-surface"
            aria-label="Filter by edition number"
          />
          <Select value={search.year} onValueChange={(v) => setParam({ year: v })}>
            <SelectTrigger className="h-11 border-[var(--border)] bg-surface" aria-label="Year">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All years</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={search.month} onValueChange={(v) => setParam({ month: v })}>
            <SelectTrigger className="h-11 border-[var(--border)] bg-surface" aria-label="Month">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All months</SelectItem>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <SelectItem key={m} value={String(m)}>
                  {monthName(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={search.category} onValueChange={(v) => setParam({ category: v })}>
            <SelectTrigger className="h-11 border-[var(--border)] bg-surface" aria-label="Category">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={search.keyword} onValueChange={(v) => setParam({ keyword: v })}>
            <SelectTrigger className="h-11 border-[var(--border)] bg-surface" aria-label="Keyword">
              <SelectValue placeholder="Keyword" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All keywords</SelectItem>
              {keywords.map((k) => (
                <SelectItem key={k} value={k}>
                  {k}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={search.sort} onValueChange={(v) => setParam({ sort: v })}>
            <SelectTrigger className="h-11 border-[var(--border)] bg-surface" aria-label="Sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Sort: Newest</SelectItem>
              <SelectItem value="oldest">Sort: Oldest</SelectItem>
              <SelectItem value="edition">Sort: Edition #</SelectItem>
              <SelectItem value="relevance">Sort: Best match</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2 lg:w-1/2">
          <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
            From
            <Input
              type="date"
              value={search.from}
              onChange={(e) => setParam({ from: e.target.value })}
              className="h-11 border-[var(--border)] bg-surface"
            />
          </label>
          <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
            To
            <Input
              type="date"
              value={search.to}
              onChange={(e) => setParam({ to: e.target.value })}
              className="h-11 border-[var(--border)] bg-surface"
            />
          </label>
        </div>

        {activeChips.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {activeChips.map((chip) => (
              <button
                key={chip.label}
                onClick={() => setParam(chip.clear)}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1 text-xs text-foreground hover:border-[var(--brand)] hover:text-[var(--brand)]"
              >
                {chip.label}
                <X className="h-3 w-3" />
              </button>
            ))}
            <button
              onClick={clearAll}
              className="text-xs font-mono uppercase tracking-widest text-[var(--brand)] hover:underline"
            >
              Clear all
            </button>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between font-mono text-xs uppercase tracking-widest text-muted-foreground">
          <span>
            {isLoading
              ? "Searching…"
              : `${filtered.length} edition${filtered.length === 1 ? "" : "s"}${
                  search.q ? " matching" : ""
                }`}
          </span>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading &&
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-96 animate-pulse border border-[var(--border)] bg-surface" />
            ))}
          {!isLoading && shown.map((n) => <NewsletterCard key={n.id} n={n} />)}
        </div>

        {!isLoading && filtered.length === 0 && (
          <div className="mt-12 rounded-md border border-[var(--border)] p-16 text-center">
            <Eyebrow tone="brand">NO MATCHES</Eyebrow>
            <h3 className="mt-3 text-2xl text-headline">No editions match those filters.</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Try clearing a filter or broadening your search.
            </p>
            <button
              onClick={clearAll}
              className="mt-6 inline-flex h-10 items-center rounded-md border border-[var(--border)] px-5 text-sm text-foreground hover:bg-secondary"
            >
              Clear all filters
            </button>
          </div>
        )}

        {shown.length < filtered.length && (
          <div className="mt-12 text-center">
            <button
              onClick={() => setLimit((n) => n + 9)}
              className="inline-flex h-10 items-center rounded-md border border-[var(--border)] px-6 text-sm text-foreground hover:bg-secondary"
            >
              Load more
            </button>
          </div>
        )}
      </Container>
    </SiteLayout>
  );
}
