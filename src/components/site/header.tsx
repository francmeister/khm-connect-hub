import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { KhmLogo } from "./logo";
import { Container } from "./container";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

const NAV = [
  { label: "Home", to: "/" },
  { label: "Newsletters", to: "/newsletters" },
  { label: "About", to: "/about" },
];

export function SiteHeader({ logoHeight = 34 }: { logoHeight?: number }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const { isAdmin, session } = useAuth();

  const isActive = (to: string) =>
    to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(to + "/");

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--background)_92%,transparent)] backdrop-blur">
      <Container size="wide">
        <div className="flex h-16 items-center justify-between">
          <KhmLogo height={logoHeight} />

          <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "text-sm transition-colors",
                  isActive(item.to)
                    ? "text-[var(--brand)]"
                    : "text-foreground/85 hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              to="/newsletters"
              aria-label="Search newsletters"
              className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <Search className="h-4 w-4" />
            </Link>
            {session ? (
              <Link
                to={isAdmin ? "/admin" : "/"}
                className="text-xs tracking-wide text-muted-foreground hover:text-foreground"
              >
                {isAdmin ? "Admin dashboard" : "Signed in"}
              </Link>
            ) : (
              <Link
                to="/auth"
                className="text-xs tracking-wide text-muted-foreground hover:text-foreground"
              >
                Admin Login
              </Link>
            )}
          </div>

          <button
            aria-label={open ? "Close menu" : "Open menu"}
            className="md:hidden grid h-10 w-10 place-items-center rounded-md text-foreground hover:bg-secondary"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </Container>

      {open && (
        <div className="border-t border-[var(--border)] md:hidden">
          <Container>
            <nav className="flex flex-col gap-1 py-4" aria-label="Mobile">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm",
                    isActive(item.to)
                      ? "text-[var(--brand)]"
                      : "text-foreground/85 hover:bg-secondary",
                  )}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                to={session ? (isAdmin ? "/admin" : "/") : "/auth"}
                onClick={() => setOpen(false)}
                className="mt-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary"
              >
                {session ? (isAdmin ? "Admin dashboard" : "Signed in") : "Admin Login"}
              </Link>
            </nav>
          </Container>
        </div>
      )}
    </header>
  );
}
