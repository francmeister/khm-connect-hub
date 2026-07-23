import type { NewsletterRow } from "@/lib/newsletters";
import { coverUrl } from "@/lib/newsletters";
import { cn } from "@/lib/utils";

interface Props {
  newsletter: Pick<NewsletterRow, "title" | "edition_number" | "cover_image_path">;
  className?: string;
}

export function CoverThumb({ newsletter, className }: Props) {
  const src = coverUrl(newsletter.cover_image_path);

  return (
    <div
      className={cn(
        "relative overflow-hidden border border-[var(--border)] bg-surface-2",
        "aspect-[3/4]",
        className,
      )}
    >
      {src ? (
        <img
          src={src}
          alt={`${newsletter.title} cover`}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full flex-col justify-between p-5">
          <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--brand)]">
            {newsletter.edition_number}
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              KHM Info Hub
            </div>
            <div className="mt-2 text-lg font-light leading-tight text-headline">
              {newsletter.title}
            </div>
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -bottom-16 h-56 w-56 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(242,69,69,0.20), transparent 70%)",
              filter: "blur(30px)",
            }}
          />
        </div>
      )}
    </div>
  );
}
