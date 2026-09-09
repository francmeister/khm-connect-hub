# KHM Info Hub

# Lovable Prompt — KHM Branded Newsletter Portal

Before using this prompt, attach `KHM Brand Assets/khm-logo.svg` to the Lovable project so it can be used as the official logo.

---

Build a production-ready, full-stack internal newsletter publishing application called **KHM Info Hub**. It must look and feel like a natural extension of the existing KHM Technology website at `https://khmtechnology.com/`, while being optimised for browsing and reading company newsletters.

## Reference and brand fidelity

Use the attached `khm-logo.svg` as the official brand asset. Do not redraw, reinterpret, recolour, crop, stretch, trace, or replace it with generated text. Preserve its aspect ratio and clear space. Because the supplied logo has a black field, display it naturally in the dark header without adding a white card behind it.

Use `https://khmtechnology.com/` as the primary visual reference. Reproduce the design language, not the public website's exact page content. The portal should clearly belong to the same brand family.

The established KHM visual language includes:

- Predominantly black and near-black backgrounds.
- Very subtle, diffuse dark-red ambient glows rather than decorative gradients.
- Large, lightweight, light-grey editorial headings.
- Bright coral-red primary actions and active navigation states.
- Thin dark-grey or light-grey borders.
- Generous horizontal margins and open negative space.
- Minimal navigation with no heavy shadows or excessive card decoration.
- Small uppercase mono labels with generous letter spacing.
- Clean, direct layouts with an understated technology-company feel.

Use these design tokens:

- Primary background: `#050505` or `#0A0A0A`.
- Elevated dark surface: `#121212`.
- Secondary surface: `#1A1A1A`.
- Primary brand red: `#F24545`.
- Darker red state: `#D63636`.
- Primary text: `#F2F2F2`.
- Large headline text: `#E1E1E1`.
- Secondary text: `#989696`.
- Border: `rgba(255,255,255,0.18)`.
- Subtle dark-red glow: low-opacity `#F24545`, blurred heavily and used sparingly.
- Success: accessible green used only for status feedback.
- Warning: accessible amber used only for status feedback.

Typography:

- Load **Archivo** from Google Fonts for navigation, headings, body copy, forms, buttons and interface elements.
- Load **Fira Mono** for eyebrow labels, edition labels, dates, compact metadata and small uppercase section markers.
- Use Inter only as a fallback if necessary.
- Hero and feature headings should use Archivo at a light or regular weight, with large fluid sizing and tight but readable line height.
- Body copy should remain readable and should not be rendered in mono.

Do not introduce blue as a primary brand colour. Do not use generic purple/blue SaaS gradients, glassmorphism, cartoon illustrations, excessive pills, exaggerated rounded cards or oversized dashboard metrics.

## Product objective

Create a secure application where:

1. Employees and other readers can browse published newsletters without logging in.
2. Readers can open and read a newsletter PDF in the browser or download it.
3. An administrator can securely log in.
4. An administrator can upload a PDF newsletter and its metadata.
5. A successful upload can automatically publish the newsletter to the site.
6. Administrators can optionally save an upload as a draft instead.
7. Administrators can edit, replace, publish, unpublish, archive or delete newsletters.
8. Previous editions remain available in a searchable archive.

Use **Lovable Cloud** for authentication, database storage, PDF/image storage and secure server-side functions. Build the real backend and permissions. Do not create a frontend-only mock-up.

## Routes

Public routes:

- `/`
- `/newsletters`
- `/newsletters/:slug`
- `/about`
- `/login`

Protected routes:

- `/admin`
- `/admin/newsletters`
- `/admin/newsletters/new`
- `/admin/newsletters/:id/edit`
- `/admin/settings`

All `/admin` routes must require a verified administrator session and server-enforced administrator role.

## Public header and navigation

Build a slim, near-black header inspired by the main KHM website:

- Place the official KHM logo at the left.
- Place navigation on the right: `Home`, `Newsletters`, `About`.
- Add a restrained search icon or search control.
- Add a discreet `Admin Login` link rather than making login the main public action.
- Render the active navigation link in `#F24545`.
- Use white or light-grey inactive links.
- Use a thin bottom border.
- Make the header sticky only if it remains unobtrusive.
- Use an accessible hamburger menu on mobile.

## Homepage

### Hero

Use a full-width dark hero inspired by the KHM homepage. Include extremely subtle red ambient glows that do not reduce text contrast.

Eyebrow in Fira Mono uppercase:

`KHM PEOPLE. PROGRESS. INNOVATION. ONE CONNECTED VISION.`

Main heading in large light-grey Archivo:

`News, ideas and progress from across KHM.`

Supporting text:

`Stay informed about our people, technology, achievements and important company updates.`

Actions:

- Primary coral-red button: `Read Latest Edition`.
- Secondary transparent outlined button: `Browse All Editions`.

Use the same square-to-subtly-rounded button character as the KHM site. Avoid fully pill-shaped buttons.

Add a latest-edition visual on the right or below the copy. It may appear as a refined PDF cover preview with an edition label and date. Keep the composition editorial and spacious, not like a generic app dashboard.

The latest edition must be selected dynamically from published database records.

### Latest edition

Create a strong split layout on a dark surface:

- PDF cover thumbnail.
- `LATEST EDITION` mono label in red.
- Newsletter title.
- Edition number.
- Publication date.
- Short description.
- Category metadata.
- `Read Newsletter` red button.
- `Download PDF` outlined button.

### Previous editions

Show the six newest previous editions in a three-column desktop grid, two columns on tablet and one on mobile.

Cards should use:

- Near-black surfaces.
- Thin subtle borders.
- Minimal or no shadow.
- Small red edition/date accent.
- Cover thumbnail.
- Title and short description.
- Text-style `Read edition →` link with red hover treatment.

Avoid making every element a rounded floating card. Use rules, alignment and spacing to establish structure.

Include `View all newsletters` as an outlined action.

### Technology spotlight

Create an optional `WHAT'S NEW FROM TECH` section styled like a KHM product feature.

It should include:

- Technology/tool name.
- Short explanation.
- Optional image or icon.
- Link to the relevant newsletter.

Only render this section when an administrator supplies technology spotlight content.

### Footer

Create a dark KHM-style footer with:

- Official logo.
- A large but restrained line such as `Stay connected to what's happening across KHM.`
- Quick links.
- `info@khmtechnology.com` as the contact address unless changed in settings.
- Privacy, terms and cookie links.
- Dynamically generated copyright year.
- Discreet admin login link.

Keep the footer composition spacious and use thin dividers.

## Newsletter archive

The `/newsletters` page should feel like an editorial archive within the same dark KHM system.

Include:

- Mono eyebrow: `NEWSLETTER ARCHIVE`.
- Large heading: `Every edition. One connected story.`
- Introductory copy.
- Full-text search by title, description, edition and keywords.
- Year filter.
- Month filter.
- Category filter.
- Sort by newest, oldest or edition number.
- Responsive result grid.
- Result count.
- `Load more` or accessible pagination.
- Query-string persistence for filters where practical.
- Helpful empty and no-results states.

Only published newsletters may be returned to public visitors.

Style filter fields as black or dark-grey controls with fine borders, light text, clear focus rings and red active states.

## Newsletter detail page

At `/newsletters/:slug`, include:

- Breadcrumbs.
- Mono edition/date label.
- Large newsletter title.
- Description and category tags.
- Optional technology spotlight.
- Embedded responsive PDF reader.
- `Open Full Screen` or `Open PDF` action.
- `Download PDF` action.
- Copy-link/share control.
- Previous and next edition navigation.
- Related editions.

Use a dark page frame, but place the PDF canvas inside a neutral, high-contrast reading surface. Do not apply dark filters to the PDF. The reading experience is more important than forcing every element to be black.

If the browser cannot embed the PDF, show a clear fallback with open and download options.

## Administrator authentication

Create a secure `/login` page that visually belongs to KHM:

- Black background with subtle red ambient glow.
- Official logo.
- Compact dark form panel with a thin border.
- `ADMIN PORTAL` mono label.
- Heading: `Sign in to manage newsletters.`
- Email and password fields.
- Show/hide password control.
- Forgot-password flow.
- Loading, success and error states.
- Redirect successful login to `/admin`.

Do not provide public registration. Accounts and roles must be provisioned manually. Never allow users to promote themselves through client-side data. Never store plaintext passwords or secrets in frontend code.

## Administrator dashboard

The protected dashboard should use the same KHM design system, with denser information but no generic colourful SaaS styling.

Include:

- Sidebar or compact top navigation.
- Dashboard.
- Newsletters.
- Upload Newsletter.
- Settings.
- View Public Site.
- Log Out.

Dashboard content:

- Total published newsletters.
- Draft/unpublished count.
- Latest published edition.
- Count by year.
- Recent administrator activity.
- Prominent red `Upload Newsletter` action.
- Outlined `Manage Newsletters` action.

Use red selectively for actions and emphasis, not for every statistic.

## Upload and automatic publication

Build a working form at `/admin/newsletters/new`.

Required fields:

- Newsletter title.
- Edition number.
- Publication date.
- Publication month.
- Publication year.
- Short description.
- PDF file.

Optional fields:

- Cover image.
- Categories.
- Keywords/tags.
- Featured toggle.
- Technology spotlight title.
- Technology spotlight description.
- Technology spotlight image.
- Custom slug.

Requirements:

- Accept PDFs only.
- Validate extension and MIME type server-side.
- Enforce a 50 MB maximum unless configuration changes it.
- Show filename and size.
- Show accessible upload progress.
- Prevent duplicate submission.
- Generate a URL-safe slug unless supplied.
- Prevent duplicate slug and edition number.
- Upload the PDF to cloud storage.
- Save metadata to the database.
- The primary `Upload & Publish` action must publish automatically after both upload and save succeed.
- Set `status = published` and `published_at` automatically.
- Make the new edition immediately visible on the homepage and archive.
- Provide a secondary `Save as Draft` action.
- A draft must not be publicly readable or downloadable.
- On success, show `View Newsletter`, `Upload Another` and `Return to Dashboard`.

Use a secure server-side or transactional workflow:

- Do not create a published record if file upload fails.
- Avoid orphaned files if database creation fails.
- When replacing a PDF, upload the new file first, update the record second and remove the old file last.
- Show actionable failure and retry states.

## Newsletter management

At `/admin/newsletters`, show all records with:

- Thumbnail.
- Title.
- Edition.
- Publication date.
- Status.
- Featured state.
- Last updated timestamp.
- Edit, preview, publish, unpublish, archive, replace PDF and delete actions.
- Search, status filter, year filter and sort.

Use an accessible confirmation dialog for destructive actions. Deleting a newsletter must remove only that newsletter's record and associated files.

## Data model

Create a `newsletters` table containing at least:

- `id` UUID primary key.
- `title` required text.
- `slug` required unique text.
- `edition_number` required unique text.
- `description` required text.
- `publication_date` required date.
- `publication_month` integer.
- `publication_year` integer.
- `pdf_path` required text.
- `pdf_filename` text.
- `pdf_size` bigint.
- `cover_image_path` nullable text.
- `status` constrained to `draft`, `published`, or `archived`.
- `is_featured` boolean default false.
- `categories` text array or relational categories.
- `keywords` text array.
- `tech_spotlight_title` nullable text.
- `tech_spotlight_description` nullable text.
- `tech_spotlight_image_path` nullable text.
- `published_at` nullable timestamp.
- `created_at` timestamp.
- `updated_at` timestamp.
- `created_by` authenticated user UUID.
- `updated_by` authenticated user UUID.

Create a secure roles/profiles table with `user_id`, `display_name`, `role` and `created_at`. Roles may include `admin` and `editor`, although the initial administrator may have full access.

Create an `admin_activity` audit table recording newsletter creation, upload, edit, publish, unpublish, archive, PDF replacement and deletion. Store user ID, action, newsletter ID, timestamp and minimal relevant details. Never expose this table publicly.

## Security

Apply row-level security or equivalent server-side rules.

Anonymous users may:

- Read only published newsletter metadata.
- View/download only files belonging to published newsletters.

Anonymous users may not:

- Read drafts or administrator data.
- Upload or modify files.
- Create, update, publish, archive or delete records.

Verified administrators may manage newsletters and associated files.

Do not rely on hidden buttons or client-side route guards. Enforce authorisation at the database, storage and server-function layers. Avoid guessable access to draft file URLs. Run Lovable's security review and resolve critical findings before publishing.

## Accessibility and responsive behaviour

Target WCAG 2.1 AA:

- Semantic HTML.
- Keyboard-accessible navigation and controls.
- Visible red/white focus treatment with sufficient contrast.
- Proper form labels and error associations.
- Accessible dialogs.
- Screen-reader upload announcements.
- Alternative text for meaningful imagery.
- Reduced-motion support.
- Do not place grey text on black if it fails contrast.

Support mobile, tablet, laptop and large desktop sizes. On mobile, use a compact menu, stack newsletter layouts, make filters usable, fit the PDF viewer to the viewport and convert admin tables to cards or accessible horizontal scrolling.

## Performance and SEO

- Lazy-load cover images.
- Do not load PDFs on archive cards.
- Load the PDF viewer only on the detail page.
- Paginate the archive.
- Prevent layout shifts.
- Add loading skeletons and retry states.
- Use unique page titles and descriptions for published editions.
- Add canonical URLs and Open Graph metadata.
- Add published newsletters to the sitemap.
- Exclude login, admin and draft routes from indexing.
- Prepare the application for a custom subdomain such as `infohub.khmtechnology.com`, but keep the domain configurable.

## Seed content

Create six clearly identified sample editions from February through July 2026, with realistic KHM-oriented descriptions concerning company updates, employee achievements, African markets, connected services, technology, training and organisational news. Sample content must be easy to remove later.

Use `YourPass` as a sample July technology spotlight, but flag the name in seed data as requiring brand/spelling confirmation.

## Required states

Design proper states for:

- No published newsletters.
- No search results.
- Newsletter not found.
- PDF unavailable.
- Loading archive/latest edition.
- Upload progress.
- Failed upload or database save.
- Successful publication.
- Offline/network failure.
- Expired session.
- Unauthorised admin access.

## Acceptance criteria

The build is complete only when:

1. The design visibly matches the KHM website's dark, red-accented, typography-led identity.
2. The official attached logo is used correctly.
3. Public visitors can browse, filter, read and download published newsletters without logging in.
4. Drafts are not publicly discoverable or downloadable.
5. Unauthorised users cannot access admin pages or perform database/storage writes.
6. A verified administrator can log in.
7. An administrator can upload a valid PDF and metadata.
8. `Upload & Publish` stores the file and record and makes the edition immediately public.
9. `Save as Draft` keeps the edition private.
10. Administrators can edit, replace, publish, unpublish, archive and delete newsletters.
11. Security is enforced server-side and at the database/storage layers.
12. The interface works on mobile and desktop.
13. Loading, empty, validation, error and success states work.
14. Accessibility requirements are met.
15. Lovable's security review has no unresolved critical issue.

## Implementation sequence

1. Establish the exact KHM-derived design tokens, typography, header, footer and responsive shell.
2. Build public homepage, archive and detail page with seed data.
3. Enable Lovable Cloud and create the schema, storage and access policies.
4. Implement administrator authentication and server-enforced roles.
5. Implement upload, automatic publishing, draft and management workflows.
6. Add audit logging, responsive refinements, accessibility and failure states.
7. Test as an anonymous visitor, unauthorised authenticated user and administrator.
8. Run the security review and resolve critical findings.

If anything is ambiguous, prioritise brand fidelity, secure defaults, simple administration, responsive accessibility and a frictionless newsletter reading experience.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://khm-connect-hub.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b317aaa3-1e86-4d4a-98e4-ea0d7102aa27).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
