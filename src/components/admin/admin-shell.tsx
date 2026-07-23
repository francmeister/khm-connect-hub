import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { KhmLogo } from "@/components/site/logo";
import { Eyebrow } from "@/components/site/eyebrow";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Newspaper, Upload, Settings, ExternalLink, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/newsletters", label: "Newsletters", icon: Newspaper },
  { to: "/admin/newsletters/new", label: "Upload Newsletter", icon: Upload },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { email } = useAuth();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-[var(--border)] bg-surface md:flex md:flex-col">
        <div className="border-b border-[var(--border)] p-5">
          <KhmLogo height={28} />
          <div className="mt-3">
            <Eyebrow tone="brand">ADMIN CONSOLE</Eyebrow>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3" aria-label="Admin">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive(item.to, item.exact)
                  ? "bg-secondary text-[var(--brand)]"
                  : "text-foreground/85 hover:bg-secondary hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
          <div className="my-4 h-px bg-[var(--border)]" />
          <Link
            to="/"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <ExternalLink className="h-4 w-4" /> View Public Site
          </Link>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <LogOut className="h-4 w-4" /> Log Out
          </button>
        </nav>
        {email && (
          <div className="border-t border-[var(--border)] p-4 text-xs text-muted-foreground">
            Signed in as
            <div className="mt-1 truncate text-foreground">{email}</div>
          </div>
        )}
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="border-b border-[var(--border)] bg-surface md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <KhmLogo height={26} />
            <button
              onClick={signOut}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Log out
            </button>
          </div>
          <nav className="flex gap-1 overflow-x-auto border-t border-[var(--border)] px-2 py-2">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "whitespace-nowrap rounded-md px-3 py-1.5 text-xs",
                  isActive(item.to, item.exact)
                    ? "bg-secondary text-[var(--brand)]"
                    : "text-foreground/80",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <main className="flex-1 p-6 md:p-10">{children}</main>
      </div>
    </div>
  );
}
