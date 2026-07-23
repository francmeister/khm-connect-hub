import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Eyebrow } from "@/components/site/eyebrow";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { KHM_CONTACT_EMAIL_FALLBACK } from "@/lib/khm";
import { Loader2, Save } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Admin — KHM Info Hub" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [email, setEmail] = useState(KHM_CONTACT_EMAIL_FALLBACK);
  const [spotEnabled, setSpotEnabled] = useState(false);
  const [spotTitle, setSpotTitle] = useState("");
  const [spotDesc, setSpotDesc] = useState("");
  const [spotLink, setSpotLink] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("app_settings").select("*");
      for (const row of data ?? []) {
        if (row.key === "contact_email" && typeof row.value === "string") setEmail(row.value);
        if (row.key === "homepage_spotlight" && row.value && typeof row.value === "object") {
          const v = row.value as Record<string, unknown>;
          setSpotEnabled(!!v.enabled);
          setSpotTitle(typeof v.title === "string" ? v.title : "");
          setSpotDesc(typeof v.description === "string" ? v.description : "");
          setSpotLink(typeof v.link === "string" ? v.link : "");
        }
      }
    })();
  }, []);

  async function save() {
    setBusy(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      const rows = [
        { key: "contact_email", value: email, updated_by: uid },
        {
          key: "homepage_spotlight",
          value: {
            enabled: spotEnabled,
            title: spotTitle || null,
            description: spotDesc || null,
            link: spotLink || null,
          },
          updated_by: uid,
        },
      ];
      const { error } = await supabase
        .from("app_settings")
        // deno-lint: ok
        .upsert(rows as never, { onConflict: "key" });
      if (error) throw error;
      toast.success("Settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <Eyebrow>SETTINGS</Eyebrow>
      <h1 className="mt-2 text-4xl font-light text-headline">Site configuration.</h1>

      <section className="mt-10 border border-[var(--border)] bg-surface p-6">
        <Eyebrow tone="brand">CONTACT</Eyebrow>
        <div className="mt-4">
          <Label className="text-xs uppercase tracking-widest">Footer contact email</Label>
          <Input
            className="mt-2 bg-background border-[var(--border)]"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </section>

      <section className="mt-6 border border-[var(--border)] bg-surface p-6">
        <div className="flex items-center justify-between">
          <div>
            <Eyebrow tone="brand">HOMEPAGE TECH SPOTLIGHT</Eyebrow>
            <p className="mt-2 text-sm text-muted-foreground">
              When enabled, the homepage renders a “What's new from tech” section using the copy
              below.
            </p>
          </div>
          <Switch checked={spotEnabled} onCheckedChange={setSpotEnabled} />
        </div>
        <div className="mt-6 space-y-4">
          <div>
            <Label className="text-xs uppercase tracking-widest">Title</Label>
            <Input className="mt-2 bg-background border-[var(--border)]" value={spotTitle} onChange={(e) => setSpotTitle(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-widest">Description</Label>
            <Textarea rows={3} className="mt-2 bg-background border-[var(--border)]" value={spotDesc} onChange={(e) => setSpotDesc(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-widest">Link (optional)</Label>
            <Input className="mt-2 bg-background border-[var(--border)]" value={spotLink} onChange={(e) => setSpotLink(e.target.value)} placeholder="/newsletters/…" />
          </div>
        </div>
      </section>

      <div className="mt-8">
        <button
          onClick={save}
          disabled={busy}
          className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-[var(--brand-strong)] disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save settings
        </button>
      </div>
    </div>
  );
}
