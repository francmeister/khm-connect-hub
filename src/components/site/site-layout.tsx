import type { ReactNode } from "react";
import { SiteHeader } from "./header";
import { SiteFooter } from "./footer";

export function SiteLayout({
  children,
  headerLogoHeight,
}: {
  children: ReactNode;
  headerLogoHeight?: number;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader logoHeight={headerLogoHeight} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
