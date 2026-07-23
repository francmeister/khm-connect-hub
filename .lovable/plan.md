
# KHM Info Hub — Build Plan

A full-stack, KHM-branded internal newsletter portal. Public reading + authenticated admin publishing on Lovable Cloud (Postgres + Storage + Auth + server functions).

## Design system (foundation)

- Tokens in `src/styles.css`: near-black backgrounds (#050505, #0A0A0A, #121212, #1A1A1A), brand red `#F24545` / `#D63636`, text ramp (#F2F2F2, #E1E1E1, #989696), border `rgba(255,255,255,0.18)`, subtle diffuse red glow.
- Fonts via `<link>` in `__root.tsx` head: Archivo (UI/headings/body) + Fira Mono (eyebrow labels, edition/date metadata).
- Reusable primitives: mono `Eyebrow`, `SectionShell`, red/outline `Button` variants (square-ish, not pills), thin-border `Card`, dark form inputs with red focus ring, `GlowBackdrop` for hero.
- Uploaded `khm-logo.svg` served through Lovable Assets and used as-is on dark surfaces.

## Routes (TanStack file-based)

Public:
- `/` — hero + latest edition split + 6 recent editions grid + optional tech spotlight + footer.
- `/newsletters` — searchable/filterable archive.
- `/newsletters/$slug` — detail with embedded PDF viewer + prev/next + related.
- `/about` — brand-aligned marketing copy.
- `/auth` — admin login (no public signup).

Protected (under `_authenticated/`, integration-managed gate):
- `/admin` — dashboard + counts.
- `/admin/newsletters` — management table.
- `/admin/newsletters/new` — upload form.
- `/admin/newsletters/$id/edit` — edit / replace PDF / publish state.
- `/admin/settings` — footer contact + spotlight defaults.

Server routes:
- `/api/sitemap.xml` (only published), `robots.txt` disallowing `/admin` + `/auth`.

## Backend (Lovable Cloud)

Enums: `app_role` (`admin`, `editor`), `newsletter_status` (`draft`, `published`, `archived`).

Tables (all with GRANTs + RLS):
- `profiles` (user_id PK, display_name, created_at).
- `user_roles` (user_id, role, unique) with `has_role(uuid, app_role)` security-definer.
- `newsletters` — full schema per spec (title, slug unique, edition_number unique, description, publication_date/month/year, pdf_path, pdf_filename, pdf_size, cover_image_path, status, is_featured, categories text[], keywords text[], tech_spotlight_* fields, published_at, timestamps, created_by, updated_by).
- `admin_activity` — audit log (user_id, action, newsletter_id, details jsonb, created_at).
- `app_settings` — key/value for footer contact override + optional homepage spotlight.

RLS:
- `newsletters`: `anon`/`authenticated` SELECT only where `status='published'`; full CRUD for admins via `has_role(auth.uid(),'admin')`.
- `user_roles`, `admin_activity`: admin-only.
- `profiles`: user reads self; admins read all.

Storage buckets:
- `newsletter-pdfs` (private) — only admins can write; server function issues signed URL for published editions only.
- `newsletter-covers` (public) — read for anyone.

Server functions (`createServerFn` + `requireSupabaseAuth`):
- `createNewsletter`, `updateNewsletter`, `replacePdf`, `setStatus`, `deleteNewsletter` — all verify `has_role('admin')` before writes; log to `admin_activity`.
- `getSignedPdfUrl(slug)` — returns signed URL only if newsletter is `published`; safe for anon.
- Public reads (list/detail) go through the browser Supabase client scoped by RLS — no server fn needed.

## Public UX details

- Hero: uppercase Fira Mono eyebrow, large light-grey Archivo H1, coral red primary + outlined secondary CTA, latest-edition PDF cover preview with subtle red glow.
- Latest edition split panel with metadata + Read/Download.
- Grid of 6 previous editions (thin borders, no heavy shadow).
- Optional tech spotlight — only rendered when `app_settings.spotlight_enabled=true`.
- Footer: logo, connection line, quick links, `info@khmtechnology.com`, discreet admin link, dynamic year.
- Detail page: dark chrome, PDF rendered in light neutral surface via `<iframe src="signed_url#toolbar=1">` with fallback open/download.

## Admin UX details

- Sidebar layout with red-accent active state.
- Dashboard cards: published count, drafts, latest edition, count by year, recent activity.
- Upload form with drag-drop, client + server-side MIME/extension/size validation (50MB), slug auto-gen + collision check, `Upload & Publish` vs `Save as Draft` — atomic (storage upload first, DB insert second, cleanup on failure).
- Management table: filter by status/year, actions row.

## Seed content

Migration inserts 6 sample editions (Feb–Jul 2026) with realistic KHM copy, `pdf_path` pointing to a generated placeholder PDF in storage (uploaded once via `storage_upload`), and a July spotlight titled "YourPass" flagged in description as needing brand confirmation. Bootstrap admin account created via initial signup on `/auth` — the first user is auto-granted `admin` (guarded so subsequent signups don't escalate).

## Accessibility, SEO, performance

- Semantic landmarks, focus rings, aria labels, reduced-motion respect.
- Per-route `head()` with unique titles/descriptions/OG. Archive + slug pages contribute to sitemap; login/admin/drafts `noindex`.
- Lazy-load cover images. PDF viewer loaded only on detail route. Loading skeletons + empty/error states throughout.

## Build order (single delivery)

1. Design tokens, fonts, logo asset, layout primitives.
2. Public routes with mocked data → swap to Supabase reads.
3. Migration (schema + RLS + grants + seed) + storage buckets.
4. Auth page + protected layout + admin dashboard.
5. Upload/edit/manage flows with server functions.
6. Sitemap/robots + head metadata sweep.
7. Manual verification of anon vs admin flows + security scan.

Ready to build — I'll ship the whole thing in one pass unless you want to phase it.
