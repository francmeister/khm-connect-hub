import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlowBackdrop } from "@/components/site/glow";
import { KhmLogo } from "@/components/site/logo";
import { Eyebrow } from "@/components/site/eyebrow";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Admin Sign In — KHM Info Hub" },
      { name: "robots", content: "noindex,nofollow" },
      {
        name: "description",
        content: "Administrator sign-in for the KHM Info Hub newsletter portal.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin", replace: true });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in");
        navigate({ to: "/admin", replace: true });
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) throw error;
        toast.success("Account created. Check your email if confirmation is required.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Password reset email sent");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen">
      <GlowBackdrop intensity={0.7} />
      <div className="relative flex min-h-screen flex-col">
        <header className="border-b border-[var(--border)]">
          <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6 md:px-10">
            <KhmLogo height={30} />
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
              Return to site
            </Link>
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center px-6 py-16">
          <div className="w-full max-w-md border border-[var(--border)] bg-surface p-8 md:p-10">
            <Eyebrow tone="brand">ADMIN PORTAL</Eyebrow>
            <h1 className="mt-4 text-3xl font-light text-headline">
              {mode === "signin" && "Sign in to manage newsletters."}
              {mode === "signup" && "Create the first admin account."}
              {mode === "reset" && "Reset your password."}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === "signup"
                ? "The first account created becomes the administrator."
                : "Access is restricted to authorised administrators."}
            </p>

            <form onSubmit={onSubmit} className="mt-8 space-y-5">
              <div>
                <Label htmlFor="email" className="text-xs uppercase tracking-widest">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 h-11 border-[var(--border)] bg-background"
                />
              </div>

              {mode !== "reset" && (
                <div>
                  <Label htmlFor="password" className="text-xs uppercase tracking-widest">
                    Password
                  </Label>
                  <div className="relative mt-2">
                    <Input
                      id="password"
                      type={showPw ? "text" : "password"}
                      autoComplete={mode === "signin" ? "current-password" : "new-password"}
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 border-[var(--border)] bg-background pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      aria-label={showPw ? "Hide password" : "Show password"}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-[var(--brand-strong)] disabled:opacity-60"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === "signin" && "Sign In"}
                {mode === "signup" && "Create Admin Account"}
                {mode === "reset" && "Send Reset Email"}
              </button>
            </form>

            <div className="mt-6 flex flex-col gap-2 text-xs text-muted-foreground">
              {mode === "signin" && (
                <>
                  <button
                    onClick={() => setMode("reset")}
                    className="text-left hover:text-foreground"
                  >
                    Forgot password?
                  </button>
                  <button
                    onClick={() => setMode("signup")}
                    className="text-left hover:text-foreground"
                  >
                    First-time setup — create administrator account
                  </button>
                </>
              )}
              {mode !== "signin" && (
                <button
                  onClick={() => setMode("signin")}
                  className="text-left hover:text-foreground"
                >
                  ← Back to sign in
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
