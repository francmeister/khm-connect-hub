import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchPublishedNewsletters, type NewsletterRow } from "@/lib/newsletters";
import { formatEditionDate, HERO_EYEBROW } from "@/lib/khm";
import { SiteLayout } from "@/components/site/site-layout";
import { Container } from "@/components/site/container";
import { GlowBackdrop } from "@/components/site/glow";
import { Eyebrow } from "@/components/site/eyebrow";
import { CoverThumb } from "@/components/newsletter/cover-thumb";
import { NewsletterCard } from "@/components/newsletter/newsletter-card";
import { ArrowRight, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KHM Info Hub — News, ideas and progress from across KHM" },
      {
        name: "description",
        content:
          "Latest newsletters, updates and announcements from KHM Technology. People. Progress. Innovation. One connected vision.",
      },
      { property: "og:title", content: "KHM Info Hub" },
      {
        property: "og:description",
        content: "News, ideas and progress from across KHM.",
      },
    ],
  }),
  component: HomePage,
});

async function loadHomeData() {
  const [newsletters, spotlight] = await Promise.all([
    fetchPublishedNewsletters(),
    supabase.from("app_settings").select("value").eq("key", "homepage_spotlight").maybeSingle(),
  ]);
  return {
    newsletters,
    spotlight: (spotlight.data?.value ?? { enabled: false }) as {
      enabled?: boolean;
      title?: string;
      description?: string;
      link?: string;
    },
  };
}

function HomePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["home"],
    queryFn: loadHomeData,
  });

  const newsletters = data?.newsletters ?? [];
  const latest = newsletters[0];
  const previous = newsletters.slice(1, 7);

  return (
    <SiteLayout>
      <Hero latest={latest} loading={isLoading} />
      {latest && <LatestBlock latest={latest} />}
      <PreviousBlock items={previous} loading={isLoading} />
      {data?.spotlight?.enabled && data.spotlight.title && (
        <TechSpotlight
          title={data.spotlight.title}
          description={data.spotlight.description ?? ""}
          link={data.spotlight.link}
        />
      )}
    </SiteLayout>
  );
}

function Hero({ latest, loading }: { latest?: NewsletterRow; loading: boolean }) {
  return (
    <section className="relative overflow-hidden">
      <GlowBackdrop />
      <Container size="wide" className="relative py-24 md:py-32">
        <div className="grid gap-16 md:grid-cols-[1.3fr_1fr] md:items-center">
          <div>
            <Eyebrow>{HERO_EYEBROW}</Eyebrow>
            <h1 className="mt-6 text-4xl font-light leading-[1.05] tracking-tight text-headline md:text-6xl lg:text-[68px]">
              News, ideas and progress
              <br />
              from across KHM.
            </h1>
            <p className="mt-6 max-w-xl text-base text-muted-foreground md:text-lg">
              Stay informed about our people, technology, achievements and important company
              updates.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              {latest ? (
                <Link
                  to="/newsletters/$slug"
                  params={{ slug: latest.slug }}
                  className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-[var(--brand-strong)]"
                >
                  Read Latest Edition <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <span className="inline-flex h-11 items-center rounded-md border border-[var(--border)] px-6 text-sm text-muted-foreground">
                  {loading ? "Loading latest edition…" : "No editions published yet"}
                </span>
              )}
              <Link
                to="/newsletters"
                className="inline-flex h-11 items-center rounded-md border border-[var(--border)] bg-transparent px-6 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                Browse All Editions
              </Link>
            </div>
          </div>

          {latest && (
            <div className="relative">
              <div
                aria-hidden
                className="absolute -inset-8"
                style={{
                  background:
                    "radial-gradient(circle at 50% 40%, rgba(242,69,69,0.18), transparent 70%)",
                  filter: "blur(50px)",
                }}
              />
              <div className="relative mx-auto max-w-sm">
                <CoverThumb newsletter={latest} />
                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="font-mono uppercase tracking-widest text-[var(--brand)]">
                    {latest.edition_number}
                  </span>
                  <span className="text-muted-foreground">
                    {formatEditionDate(latest.publication_date)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}

function LatestBlock({ latest }: { latest: NewsletterRow }) {
  return (
    <section className="border-t border-[var(--border)] bg-surface">
      <Container size="wide" className="py-20">
        <div className="grid gap-12 md:grid-cols-[1fr_1.4fr] md:items-center">
          <div className="max-w-sm">
            <CoverThumb newsletter={latest} />
          </div>
          <div>
            <Eyebrow tone="brand">LATEST EDITION</Eyebrow>
            <h2 className="mt-4 text-3xl font-light text-headline md:text-4xl">{latest.title}</h2>
            <div className="mt-3 flex flex-wrap gap-4 text-xs font-mono uppercase tracking-widest text-muted-foreground">
              <span>{latest.edition_number}</span>
              <span>{formatEditionDate(latest.publication_date)}</span>
              {(latest.categories ?? []).slice(0, 2).map((c) => (
                <span key={c}>{c}</span>
              ))}
            </div>
            <p className="mt-6 max-w-xl text-base text-foreground/85">{latest.description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/newsletters/$slug"
                params={{ slug: latest.slug }}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-[var(--brand-strong)]"
              >
                Read Newsletter <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/newsletters/$slug"
                params={{ slug: latest.slug }}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--border)] px-5 text-sm text-foreground hover:bg-secondary"
              >
                <Download className="h-4 w-4" /> Download PDF
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function PreviousBlock({ items, loading }: { items: NewsletterRow[]; loading: boolean }) {
  return (
    <section className="border-t border-[var(--border)]">
      <Container size="wide" className="py-20">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>PREVIOUS EDITIONS</Eyebrow>
            <h2 className="mt-3 text-3xl font-light text-headline md:text-4xl">
              Recent from the Info Hub.
            </h2>
          </div>
          <Link
            to="/newsletters"
            className="inline-flex h-10 items-center rounded-md border border-[var(--border)] px-5 text-sm text-foreground hover:bg-secondary"
          >
            View all newsletters
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-96 animate-pulse border border-[var(--border)] bg-surface" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-md border border-[var(--border)] p-10 text-center text-muted-foreground">
            No previous editions yet. Check back soon.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((n) => (
              <NewsletterCard key={n.id} n={n} />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}

function TechSpotlight({
  title,
  description,
  link,
}: {
  title: string;
  description: string;
  link?: string;
}) {
  return (
    <section className="border-t border-[var(--border)] bg-surface">
      <Container size="wide" className="py-20">
        <Eyebrow tone="brand">WHAT'S NEW FROM TECH</Eyebrow>
        <div className="mt-6 grid gap-10 md:grid-cols-[1.4fr_1fr] md:items-center">
          <div>
            <h2 className="text-3xl font-light text-headline md:text-4xl">{title}</h2>
            <p className="mt-4 max-w-2xl text-foreground/85">{description}</p>
            {link && (
              <a
                href={link}
                className="mt-6 inline-flex items-center gap-2 text-sm text-[var(--brand)] hover:underline"
              >
                Read more <ArrowRight className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
