import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPublishedNewsletters } from "@/lib/newsletters";
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

export const Route = createFileRoute("/newsletters/")({
  head: () => ({
    meta: [
      { title: "Newsletter Archive — KHM Info Hub" },
      {
        name: "description",
        content:
          "Search and browse every KHM Info Hub newsletter edition. Filter by year, month, category or keyword.",
      },
      { property: "og:title", content: "Newsletter Archive — KHM Info Hub" },
      {
        property: "og:description",
        content: "Every edition. One connected story.",
      },
    ],
  }),
  component: ArchivePage,
});

function ArchivePage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["published-newsletters"],
    queryFn: fetchPublishedNewsletters,
  });

  const [q, setQ] = useState("");
  const [year, setYear] = useState<string>("all");
  const [month, setMonth] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<"newest" | "oldest" | "edition">("newest");
  const [limit, setLimit] = useState(9);

  const years = useMemo(
    () =>
      Array.from(new Set(data.map((n) => n.publication_year).filter(Boolean))).sort(
        (a, b) => (b ?? 0) - (a ?? 0),
      ),
    [data],
  );
  const categories = useMemo(
    () => Array.from(new Set(data.flatMap((n) => n.categories ?? []))).sort(),
    [data],
  );

  const filtered = useMemo(() => {
    let arr = data.slice();
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      arr = arr.filter(
        (n) =>
          n.title.toLowerCase().includes(needle) ||
          n.description.toLowerCase().includes(needle) ||
          n.edition_number.toLowerCase().includes(needle) ||
          (n.keywords ?? []).some((k) => k.toLowerCase().includes(needle)),
      );
    }
    if (year !== "all") arr = arr.filter((n) => String(n.publication_year) === year);
    if (month !== "all") arr = arr.filter((n) => String(n.publication_month) === month);
    if (category !== "all")
      arr = arr.filter((n) => (n.categories ?? []).includes(category));

    arr.sort((a, b) => {
      if (sort === "edition") return b.edition_number.localeCompare(a.edition_number);
      const cmp = new Date(a.publication_date).getTime() - new Date(b.publication_date).getTime();
      return sort === "newest" ? -cmp : cmp;
    });
    return arr;
  }, [data, q, year, month, category, sort]);

  const shown = filtered.slice(0, limit);

  return (
    <SiteLayout>
      <section className="border-b border-[var(--border)]">
        <Container size="wide" className="py-20">
          <Eyebrow>NEWSLETTER ARCHIVE</Eyebrow>
          <h1 className="mt-4 text-4xl font-light text-headline md:text-6xl">
            Every edition. One connected story.
          </h1>
          <p className="mt-5 max-w-2xl text-muted-foreground">
            Search the complete Info Hub archive. Filter by year, month or category to find the
            edition you need.
          </p>
        </Container>
      </section>

      <Container size="wide" className="py-12">
        <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
          <Input
            type="search"
            placeholder="Search titles, descriptions, keywords"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-11 border-[var(--border)] bg-surface"
            aria-label="Search newsletters"
          />
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="h-11 border-[var(--border)] bg-surface">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All years</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="h-11 border-[var(--border)] bg-surface">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All months</SelectItem>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <SelectItem key={m} value={String(m)}>
                  {monthName(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-11 border-[var(--border)] bg-surface">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
            <SelectTrigger className="h-11 border-[var(--border)] bg-surface">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Sort: Newest</SelectItem>
              <SelectItem value="oldest">Sort: Oldest</SelectItem>
              <SelectItem value="edition">Sort: Edition #</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-6 flex items-center justify-between text-xs font-mono uppercase tracking-widest text-muted-foreground">
          <span>
            {isLoading ? "Loading…" : `${filtered.length} edition${filtered.length === 1 ? "" : "s"}`}
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
