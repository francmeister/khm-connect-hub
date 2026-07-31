import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="font-mono-eyebrow text-brand">Error 404</div>
        <h1 className="mt-4 text-5xl font-normal text-headline">Page not found.</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          The page you're looking for isn't part of the Info Hub.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-[var(--brand-strong)]"
          >
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="font-mono-eyebrow text-brand">Something went wrong</div>
        <h1 className="mt-4 text-3xl font-normal text-headline">This page didn't load.</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Try again or head back to the newsletter archive.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-[var(--brand-strong)]"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-md border border-[var(--border)] px-5 text-sm font-medium text-foreground hover:bg-secondary"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#050505" },
      { title: "KHM Info Hub — News, ideas and progress from across KHM" },
      {
        name: "description",
        content:
          "Latest newsletters, updates and announcements from KHM Technology. People. Progress. Innovation. One connected vision.",
      },
      { property: "og:site_name", content: "KHM Info Hub" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "KHM Info Hub — News, ideas and progress from across KHM" },
      {
        property: "og:description",
        content: "Latest newsletters, updates and announcements from KHM Technology. People. Progress. Innovation. One connected vision.",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "KHM Info Hub — News, ideas and progress from across KHM" },
      { name: "twitter:description", content: "Latest newsletters, updates and announcements from KHM Technology. People. Progress. Innovation. One connected vision." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/bff16fe6-df37-43bd-83f7-c2a696262cbf/id-preview-3ea6b705--b317aaa3-1e86-4d4a-98e4-ea0d7102aa27.lovable.app-1784803496963.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/bff16fe6-df37-43bd-83f7-c2a696262cbf/id-preview-3ea6b705--b317aaa3-1e86-4d4a-98e4-ea0d7102aa27.lovable.app-1784803496963.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Archivo:wght@300;400;500;600;700&family=Fira+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        router.invalidate();
        if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
      }
    });
    return () => data.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster theme="dark" position="top-right" />
    </QueryClientProvider>
  );
}
