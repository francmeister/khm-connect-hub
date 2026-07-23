import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlowBackdrop } from "@/components/site/glow";
import { KhmLogo } from "@/components/site/logo";
import { Eyebrow } from "@/components/site/eyebrow";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — KHM Info Hub" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated");
      navigate({ to: "/admin", replace: true });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen">
      <GlowBackdrop intensity={0.6} />
      <div className="relative flex min-h-screen flex-col">
        <header className="border-b border-[var(--border)]">
          <div className="mx-auto h-16 w-full max-w-7xl px-6 md:px-10">
            <div className="flex h-full items-center">
              <KhmLogo height={30} />
            </div>
          </div>
        </header>
        <main className="flex flex-1 items-center justify-center px-6 py-16">
          <div className="w-full max-w-md border border-[var(--border)] bg-surface p-8">
            <Eyebrow tone="brand">RESET PASSWORD</Eyebrow>
            <h1 className="mt-4 text-3xl font-light text-headline">Choose a new password.</h1>
            <form onSubmit={onSubmit} className="mt-6 space-y-5">
              <div>
                <Label htmlFor="pw" className="text-xs uppercase tracking-widest">
                  New password
                </Label>
                <Input
                  id="pw"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2 h-11 border-[var(--border)] bg-background"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-[var(--brand-strong)]"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Update password
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
