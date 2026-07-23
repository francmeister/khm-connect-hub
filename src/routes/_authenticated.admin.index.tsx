import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllNewslettersAdmin } from "@/lib/newsletters";
import { Eyebrow } from "@/components/site/eyebrow";
import { formatEditionDate } from "@/lib/khm";
import { Upload, Newspaper } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Dashboard — Admin — KHM Info Hub" }, { name: "robots", content: "noindex" }] }),
  component: DashboardPage,
});

async function loadDashboard() {
  const [newsletters, activity] = await Promise.all([
    fetchAllNewslettersAdmin(),
    supabase
      .from("admin_activity")
      .select("id, action, created_at, newsletter_id, details")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);
  return { newsletters, activity: activity.data ?? [] };
}

function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["admin_dashboard"], queryFn: loadDashboard });
  const newsletters = data?.newsletters ?? [];
  const published = newsletters.filter((n) => n.status === "published");
  const drafts = newsletters.filter((n) => n.status === "draft");
  const archived = newsletters.filter((n) => n.status === "archived");
  const latest = published[0];

  const byYear = new Map<number, number>();
  for (const n of published) {
    const y = n.publication_year ?? new Date(n.publication_date).getFullYear();
    byYear.set(y, (byYear.get(y) ?? 0) + 1);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>DASHBOARD</Eyebrow>
          <h1 className="mt-2 text-4xl font-light text-headline">
            The Info Hub, at a glance.
          </h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/admin/newsletters/new"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-[var(--brand-strong)]"
          >
            <Upload className="h-4 w-4" /> Upload Newsletter
          </Link>
          <Link
            to="/admin/newsletters"
            className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--border)] px-5 text-sm text-foreground hover:bg-secondary"
          >
            <Newspaper className="h-4 w-4" /> Manage Newsletters
          </Link>
        </div>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-4">
        <Stat label="Published" value={published.length} loading={isLoading} />
        <Stat label="Drafts" value={drafts.length} loading={isLoading} />
        <Stat label="Archived" value={archived.length} loading={isLoading} />
        <Stat label="Total" value={newsletters.length} loading={isLoading} />
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <section className="border border-[var(--border)] bg-surface p-6">
          <Eyebrow>LATEST PUBLISHED</Eyebrow>
          {latest ? (
            <div className="mt-3">
              <div className="font-mono text-[11px] uppercase tracking-widest text-[var(--brand)]">
                {latest.edition_number} · {formatEditionDate(latest.publication_date)}
              </div>
              <div className="mt-2 text-xl text-headline">{latest.title}</div>
              <Link
                to="/admin/newsletters/$id/edit"
                params={{ id: latest.id }}
                className="mt-4 inline-flex text-sm text-[var(--brand)] hover:underline"
              >
                Edit edition →
              </Link>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              No published editions yet.
            </p>
          )}
        </section>

        <section className="border border-[var(--border)] bg-surface p-6">
          <Eyebrow>PUBLISHED BY YEAR</Eyebrow>
          <div className="mt-4 space-y-2">
            {[...byYear.entries()]
              .sort((a, b) => b[0] - a[0])
              .map(([year, count]) => (
                <div key={year} className="flex items-center justify-between text-sm">
                  <span className="font-mono text-foreground">{year}</span>
                  <span className="text-muted-foreground">
                    {count} edition{count === 1 ? "" : "s"}
                  </span>
                </div>
              ))}
            {byYear.size === 0 && (
              <p className="text-sm text-muted-foreground">No published editions.</p>
            )}
          </div>
        </section>
      </div>

      <section className="mt-10 border border-[var(--border)] bg-surface p-6">
        <Eyebrow>RECENT ACTIVITY</Eyebrow>
        <div className="mt-4 divide-y divide-[var(--border)]">
          {(data?.activity ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">No admin activity yet.</p>
          )}
          {(data?.activity ?? []).map((a) => (
            <div key={a.id} className="flex justify-between py-3 text-sm">
              <span className="text-foreground">{a.action}</span>
              <span className="text-muted-foreground">
                {new Date(a.created_at).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, loading }: { label: string; value: number; loading: boolean }) {
  return (
    <div className="border border-[var(--border)] bg-surface p-5">
      <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="mt-3 text-4xl font-light text-headline">
        {loading ? "—" : value}
      </div>
    </div>
  );
}
