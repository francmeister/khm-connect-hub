import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchNewsletterBySlug, fetchPublishedNewsletters } from "@/lib/newsletters";
import { SiteLayout } from "@/components/site/site-layout";
import { Container } from "@/components/site/container";
import { Eyebrow } from "@/components/site/eyebrow";
import { PdfViewer } from "@/components/newsletter/pdf-viewer";
import { NewsletterCard } from "@/components/newsletter/newsletter-card";
import { ArrowLeft, ArrowRight, Link2 } from "lucide-react";
import { formatEditionDate } from "@/lib/khm";
import { toast } from "sonner";

export const Route = createFileRoute("/newsletters/$slug")({
  loader: async ({ params }) => {
    const n = await fetchNewsletterBySlug(params.slug);
    if (!n) throw notFound();
    return { newsletter: n };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Not found — KHM Info Hub" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const n = loaderData.newsletter;
    return {
      meta: [
        { title: `${n.title} — KHM Info Hub` },
        { name: "description", content: n.description },
        { property: "og:title", content: n.title },
        { property: "og:description", content: n.description },
        { property: "og:type", content: "article" },
      ],
    };
  },
  notFoundComponent: () => (
    <SiteLayout>
      <Container className="py-24 text-center">
        <Eyebrow tone="brand">NEWSLETTER NOT FOUND</Eyebrow>
        <h1 className="mt-4 text-4xl text-headline">We couldn't find that edition.</h1>
        <p className="mt-3 text-muted-foreground">
          It may have been unpublished or the link may be incorrect.
        </p>
        <Link
          to="/newsletters"
          className="mt-8 inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm text-primary-foreground hover:bg-[var(--brand-strong)]"
        >
          Browse all newsletters
        </Link>
      </Container>
    </SiteLayout>
  ),
  component: NewsletterDetail,
});

function NewsletterDetail() {
  const { newsletter } = Route.useLoaderData();
  const { data: all = [] } = useQuery({
    queryKey: ["published-newsletters"],
    queryFn: fetchPublishedNewsletters,
  });

  const sorted = [...all].sort(
    (a, b) => new Date(b.publication_date).getTime() - new Date(a.publication_date).getTime(),
  );
  const idx = sorted.findIndex((n) => n.id === newsletter.id);
  const next = idx > 0 ? sorted[idx - 1] : null;
  const prev = idx < sorted.length - 1 ? sorted[idx + 1] : null;
  const related = sorted.filter((n) => n.id !== newsletter.id).slice(0, 3);

  function copyLink() {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard");
  }

  return (
    <SiteLayout>
      <Container size="wide" className="pt-10">
        <nav className="text-xs text-muted-foreground" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/newsletters" className="hover:text-foreground">Newsletters</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{newsletter.edition_number}</span>
        </nav>
      </Container>

      <Container size="wide" className="pt-8 pb-14">
        <div className="flex flex-wrap gap-4 font-mono text-[11px] uppercase tracking-[0.16em]">
          <span className="text-[var(--brand)]">{newsletter.edition_number}</span>
          <span className="text-muted-foreground">
            {formatEditionDate(newsletter.publication_date)}
          </span>
        </div>
        <h1 className="mt-5 text-4xl font-light leading-tight text-headline md:text-5xl">
          {newsletter.title}
        </h1>
        <p className="mt-5 max-w-3xl text-lg text-foreground/85">{newsletter.description}</p>

        {(newsletter.categories ?? []).length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {newsletter.categories.map((c: string) => (
              <span
                key={c}
                className="border border-[var(--border)] px-3 py-1 text-[11px] uppercase tracking-widest text-muted-foreground"
              >
                {c}
              </span>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={copyLink}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-[var(--border)] px-4 text-sm text-foreground hover:bg-secondary"
          >
            <Link2 className="h-4 w-4" /> Copy link
          </button>
        </div>
      </Container>

      {newsletter.tech_spotlight_title && (
        <section className="border-y border-[var(--border)] bg-surface">
          <Container size="wide" className="py-12">
            <Eyebrow tone="brand">TECHNOLOGY SPOTLIGHT</Eyebrow>
            <h2 className="mt-3 text-2xl font-light text-headline">
              {newsletter.tech_spotlight_title}
            </h2>
            {newsletter.tech_spotlight_description && (
              <p className="mt-3 max-w-3xl text-foreground/85">
                {newsletter.tech_spotlight_description}
              </p>
            )}
          </Container>
        </section>
      )}

      <Container size="wide" className="py-10">
        <PdfViewer slug={newsletter.slug} title={newsletter.title} />
      </Container>

      <Container size="wide" className="pb-16">
        <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-6 md:flex-row md:justify-between">
          {prev ? (
            <Link
              to="/newsletters/$slug"
              params={{ slug: prev.slug }}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> {prev.edition_number} — {prev.title}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              to="/newsletters/$slug"
              params={{ slug: next.slug }}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              {next.edition_number} — {next.title} <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <span />
          )}
        </div>
      </Container>

      {related.length > 0 && (
        <section className="border-t border-[var(--border)] bg-surface">
          <Container size="wide" className="py-16">
            <Eyebrow>RELATED EDITIONS</Eyebrow>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {related.map((n) => (
                <NewsletterCard key={n.id} n={n} />
              ))}
            </div>
          </Container>
        </section>
      )}
    </SiteLayout>
  );
}
