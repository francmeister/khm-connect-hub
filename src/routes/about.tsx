import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/site-layout";
import { Container } from "@/components/site/container";
import { Eyebrow } from "@/components/site/eyebrow";
import { GlowBackdrop } from "@/components/site/glow";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About the Info Hub — KHM Info Hub" },
      {
        name: "description",
        content:
          "The KHM Info Hub is the internal newsletter portal that keeps everyone across KHM connected to our people, technology and progress.",
      },
      { property: "og:title", content: "About the KHM Info Hub" },
      {
        property: "og:description",
        content: "People. Progress. Innovation. One connected vision.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <SiteLayout>
      <section className="relative">
        <GlowBackdrop intensity={0.6} />
        <Container size="wide" className="relative py-24 md:py-32">
          <Eyebrow>ABOUT THE INFO HUB</Eyebrow>
          <h1 className="mt-6 max-w-4xl text-4xl font-light leading-[1.05] text-headline md:text-6xl">
            One place for everything happening across KHM.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            The KHM Info Hub is the internal newsletter portal for KHM Technology. It brings our
            people, technology, achievements and company updates together in one connected story —
            edition after edition.
          </p>
        </Container>
      </section>

      <section className="border-t border-[var(--border)] bg-surface">
        <Container size="wide" className="py-20">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <Eyebrow tone="brand">WHY IT EXISTS</Eyebrow>
              <h2 className="mt-3 text-3xl font-light text-headline">Keep everyone informed.</h2>
              <p className="mt-4 text-foreground/85">
                From new hires to platform releases, cross-market wins to training programmes, the
                Info Hub gives teams a single, well-crafted read to catch up on what matters — no
                inboxes to hunt through.
              </p>
            </div>
            <div>
              <Eyebrow tone="brand">HOW IT WORKS</Eyebrow>
              <h2 className="mt-3 text-3xl font-light text-headline">
                Published editions, always available.
              </h2>
              <p className="mt-4 text-foreground/85">
                The communications team publishes each edition as a PDF you can read in the
                browser or download. The archive stays searchable so you can revisit any past
                issue whenever you need to.
              </p>
            </div>
          </div>
        </Container>
      </section>
    </SiteLayout>
  );
}
