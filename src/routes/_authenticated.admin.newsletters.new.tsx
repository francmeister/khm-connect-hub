import { createFileRoute } from "@tanstack/react-router";
import { NewsletterForm } from "@/components/admin/newsletter-form";
import { Eyebrow } from "@/components/site/eyebrow";

export const Route = createFileRoute("/_authenticated/admin/newsletters/new")({
  head: () => ({
    meta: [
      { title: "Upload newsletter — Admin — KHM Info Hub" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NewPage,
});

function NewPage() {
  return (
    <div>
      <Eyebrow>UPLOAD</Eyebrow>
      <h1 className="mt-2 text-4xl font-light text-headline">New newsletter edition.</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Attach the edition's PDF, fill in the metadata, then publish immediately or save as a
        draft to publish later.
      </p>
      <div className="mt-10">
        <NewsletterForm />
      </div>
    </div>
  );
}
