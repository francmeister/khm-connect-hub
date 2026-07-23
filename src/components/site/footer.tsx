import { Link } from "@tanstack/react-router";
import { Container } from "./container";
import { KhmLogo } from "./logo";
import { Eyebrow } from "./eyebrow";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { KHM_CONTACT_EMAIL_FALLBACK } from "@/lib/khm";

async function loadContactEmail(): Promise<string> {
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "contact_email")
    .maybeSingle();
  const val = data?.value;
  if (typeof val === "string") return val;
  return KHM_CONTACT_EMAIL_FALLBACK;
}

export function SiteFooter() {
  const { data: email = KHM_CONTACT_EMAIL_FALLBACK } = useQuery({
    queryKey: ["contact_email"],
    queryFn: loadContactEmail,
    staleTime: 5 * 60_000,
  });
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-[var(--border)] bg-surface pt-16 pb-10">
      <Container size="wide">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <KhmLogo height={38} />
            <p className="mt-8 max-w-md text-2xl font-light leading-snug text-headline md:text-3xl">
              Stay connected to what's happening across KHM.
            </p>
          </div>
          <div>
            <Eyebrow>Explore</Eyebrow>
            <ul className="mt-4 space-y-3 text-sm text-foreground/85">
              <li><Link to="/" className="hover:text-[var(--brand)]">Home</Link></li>
              <li><Link to="/newsletters" className="hover:text-[var(--brand)]">Newsletters</Link></li>
              <li><Link to="/about" className="hover:text-[var(--brand)]">About</Link></li>
            </ul>
          </div>
          <div>
            <Eyebrow>Contact</Eyebrow>
            <ul className="mt-4 space-y-3 text-sm text-foreground/85">
              <li>
                <a href={`mailto:${email}`} className="hover:text-[var(--brand)]">{email}</a>
              </li>
              <li><Link to="/auth" className="text-muted-foreground hover:text-[var(--brand)]">Admin Login</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-[var(--border)] pt-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div>© {year} KHM Technology. All rights reserved.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Cookies</a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
