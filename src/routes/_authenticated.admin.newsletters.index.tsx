import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAllNewslettersAdmin, logActivity } from "@/lib/newsletters";
import type { NewsletterRow, NewsletterStatus } from "@/lib/newsletters";
import { supabase } from "@/integrations/supabase/client";
import { Eyebrow } from "@/components/site/eyebrow";
import { formatEditionDate, PDF_BUCKET } from "@/lib/khm";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Pencil, ExternalLink, ArchiveRestore, Archive, Eye, EyeOff, Trash2 } from "lucide-react";
import { CoverThumb } from "@/components/newsletter/cover-thumb";

export const Route = createFileRoute("/_authenticated/admin/newsletters/")({
  head: () => ({
    meta: [
      { title: "Newsletters — Admin — KHM Info Hub" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ManagePage,
});

const STATUS_LABEL: Record<NewsletterStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

function ManagePage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin_newsletters"],
    queryFn: fetchAllNewslettersAdmin,
  });

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [year, setYear] = useState<string>("all");
  const [confirmDelete, setConfirmDelete] = useState<NewsletterRow | null>(null);

  const years = useMemo(
    () =>
      Array.from(new Set(data.map((n) => n.publication_year).filter(Boolean))).sort(
        (a, b) => (b ?? 0) - (a ?? 0),
      ),
    [data],
  );

  const filtered = useMemo(() => {
    let arr = data;
    if (q.trim()) {
      const n = q.trim().toLowerCase();
      arr = arr.filter(
        (r) =>
          r.title.toLowerCase().includes(n) ||
          r.edition_number.toLowerCase().includes(n) ||
          r.slug.toLowerCase().includes(n),
      );
    }
    if (status !== "all") arr = arr.filter((n) => n.status === status);
    if (year !== "all") arr = arr.filter((n) => String(n.publication_year) === year);
    return arr;
  }, [data, q, status, year]);

  async function setStatusFor(n: NewsletterRow, newStatus: NewsletterStatus) {
    const patch: {
      status: NewsletterStatus;
      published_at?: string | null;
    } = { status: newStatus };
    if (newStatus === "published" && !n.published_at) patch.published_at = new Date().toISOString();
    const { error } = await supabase.from("newsletters").update(patch).eq("id", n.id);
    if (error) return toast.error(error.message);
    await logActivity(`status_${newStatus}`, n.id, { title: n.title });
    toast.success(`Marked as ${STATUS_LABEL[newStatus]}`);
    qc.invalidateQueries({ queryKey: ["admin_newsletters"] });
    qc.invalidateQueries({ queryKey: ["published-newsletters"] });
    qc.invalidateQueries({ queryKey: ["home"] });
  }

  async function del(n: NewsletterRow) {
    // Best-effort: remove PDF then row. Only actually removes if the same file isn't shared.
    // For safety, only delete if the path was uniquely used by this record.
    const { data: sharedList } = await supabase
      .from("newsletters")
      .select("id")
      .eq("pdf_path", n.pdf_path)
      .neq("id", n.id)
      .limit(1);
    if (!sharedList || sharedList.length === 0) {
      await supabase.storage.from(PDF_BUCKET).remove([n.pdf_path]);
    }
    if (n.cover_image_path) {
      await supabase.storage.from("newsletter-covers").remove([n.cover_image_path]);
    }
    const { error } = await supabase.from("newsletters").delete().eq("id", n.id);
    if (error) return toast.error(error.message);
    await logActivity("delete", null, { title: n.title, edition: n.edition_number });
    toast.success("Newsletter deleted");
    qc.invalidateQueries({ queryKey: ["admin_newsletters"] });
    qc.invalidateQueries({ queryKey: ["published-newsletters"] });
    qc.invalidateQueries({ queryKey: ["home"] });
    setConfirmDelete(null);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>NEWSLETTERS</Eyebrow>
          <h1 className="mt-2 text-4xl font-light text-headline">Manage editions.</h1>
        </div>
        <Link
          to="/admin/newsletters/new"
          className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-[var(--brand-strong)]"
        >
          Upload Newsletter
        </Link>
      </div>

      <div className="mt-8 grid gap-3 md:grid-cols-[2fr_1fr_1fr]">
        <Input
          type="search"
          placeholder="Search title, edition or slug"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-11 border-[var(--border)] bg-surface"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-11 border-[var(--border)] bg-surface">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
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
      </div>

      <div className="mt-8 border border-[var(--border)] bg-surface">
        {isLoading ? (
          <div className="p-10 text-center text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            No newsletters match those filters.
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {filtered.map((n) => (
              <li key={n.id} className="grid grid-cols-1 gap-4 p-4 md:grid-cols-[64px_1fr_auto] md:items-center">
                <div className="w-16">
                  <CoverThumb newsletter={n} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-widest">
                    <span className="text-[var(--brand)]">{n.edition_number}</span>
                    <span className="text-muted-foreground">
                      {formatEditionDate(n.publication_date)}
                    </span>
                    <StatusBadge status={n.status} />
                    {n.is_featured && (
                      <span className="border border-[var(--border)] px-2 py-0.5 text-muted-foreground">
                        FEATURED
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-base text-headline">{n.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Updated {new Date(n.updated_at).toLocaleString()}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  <Link
                    to="/admin/newsletters/$id/edit"
                    params={{ id: n.id }}
                    className="inline-flex h-8 items-center gap-1 rounded-md border border-[var(--border)] px-3 text-xs hover:bg-secondary"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Link>
                  {n.status === "published" && (
                    <Link
                      to="/newsletters/$slug"
                      params={{ slug: n.slug }}
                      className="inline-flex h-8 items-center gap-1 rounded-md border border-[var(--border)] px-3 text-xs hover:bg-secondary"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> View
                    </Link>
                  )}
                  {n.status !== "published" ? (
                    <button
                      onClick={() => setStatusFor(n, "published")}
                      className="inline-flex h-8 items-center gap-1 rounded-md bg-primary px-3 text-xs text-primary-foreground hover:bg-[var(--brand-strong)]"
                    >
                      <Eye className="h-3.5 w-3.5" /> Publish
                    </button>
                  ) : (
                    <button
                      onClick={() => setStatusFor(n, "draft")}
                      className="inline-flex h-8 items-center gap-1 rounded-md border border-[var(--border)] px-3 text-xs hover:bg-secondary"
                    >
                      <EyeOff className="h-3.5 w-3.5" /> Unpublish
                    </button>
                  )}
                  {n.status !== "archived" ? (
                    <button
                      onClick={() => setStatusFor(n, "archived")}
                      className="inline-flex h-8 items-center gap-1 rounded-md border border-[var(--border)] px-3 text-xs hover:bg-secondary"
                    >
                      <Archive className="h-3.5 w-3.5" /> Archive
                    </button>
                  ) : (
                    <button
                      onClick={() => setStatusFor(n, "draft")}
                      className="inline-flex h-8 items-center gap-1 rounded-md border border-[var(--border)] px-3 text-xs hover:bg-secondary"
                    >
                      <ArchiveRestore className="h-3.5 w-3.5" /> Restore
                    </button>
                  )}
                  <button
                    onClick={() => setConfirmDelete(n)}
                    className="inline-flex h-8 items-center gap-1 rounded-md border border-[var(--border)] px-3 text-xs text-destructive hover:bg-secondary"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this newsletter?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the record and its PDF file. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete && del(confirmDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-[var(--brand-strong)]"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatusBadge({ status }: { status: NewsletterStatus }) {
  const color =
    status === "published"
      ? "text-[var(--brand)]"
      : status === "draft"
        ? "text-amber-400"
        : "text-muted-foreground";
  return (
    <span className={`border border-[var(--border)] px-2 py-0.5 ${color}`}>
      {STATUS_LABEL[status].toUpperCase()}
    </span>
  );
}
