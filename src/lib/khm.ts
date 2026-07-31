import khmLogoAsset from "@/assets/khm-logo.png.asset.json";

export const KHM_LOGO_URL = khmLogoAsset.url;
export const KHM_CONTACT_EMAIL_FALLBACK = "info@khmtechnology.com";
export const SITE_NAME = "KHM Info Hub";
export const HERO_EYEBROW = "KHM PEOPLE. PROGRESS. INNOVATION. ONE CONNECTED VISION.";

export const PDF_BUCKET = "newsletter-pdfs";
export const COVER_BUCKET = "newsletter-covers";
export const MAX_PDF_BYTES = 50 * 1024 * 1024; // 50 MB

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

export function formatEditionDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function monthName(m: number | null | undefined): string {
  if (!m) return "";
  const names = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return names[m - 1] ?? "";
}

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
