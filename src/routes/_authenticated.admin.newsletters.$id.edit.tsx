import { createFileRoute, notFound } from "@tanstack/react-router";
import { fetchAdminNewsletter } from "@/lib/newsletters";
import { NewsletterForm } from "@/components/admin/newsletter-form";
import { Eyebrow } from "@/components/site/eyebrow";

export const Route = createFileRoute("/_authenticated/admin/newsletters/$id/edit")({
  loader: async ({ params }) => {
    const n = await fetchAdminNewsletter(params.id);
    if (!n) throw notFound();
    return { newsletter: n };
  },
  head: () => ({
    meta: [
      { title: "Edit newsletter — Admin — KHM Info Hub" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EditPage,
});

function EditPage() {
  const { newsletter } = Route.useLoaderData();
  return (
    <div>
      <Eyebrow>EDIT</Eyebrow>
      <h1 className="mt-2 text-4xl font-light text-headline">{newsletter.title}</h1>
      <p className="mt-3 text-muted-foreground">
        {newsletter.edition_number} · Status:{" "}
        <span className="text-foreground">{newsletter.status}</span>
      </p>
      <div className="mt-10">
        <NewsletterForm existing={newsletter} />
      </div>
    </div>
  );
}
