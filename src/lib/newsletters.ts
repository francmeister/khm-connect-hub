import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { COVER_BUCKET, PDF_BUCKET } from "./khm";

export type NewsletterRow = Database["public"]["Tables"]["newsletters"]["Row"];
export type NewsletterInsert = Database["public"]["Tables"]["newsletters"]["Insert"];
export type NewsletterUpdate = Database["public"]["Tables"]["newsletters"]["Update"];
export type NewsletterStatus = Database["public"]["Enums"]["newsletter_status"];

export function coverUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const { data } = supabase.storage.from(COVER_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Signed URL for a PDF path. Requires admin session OR a published newsletter (via public server function). */
export async function adminSignedPdfUrl(path: string, expires = 3600): Promise<string | null> {
  const { data, error } = await supabase.storage.from(PDF_BUCKET).createSignedUrl(path, expires);
  if (error) return null;
  return data.signedUrl;
}

export async function fetchPublishedNewsletters(): Promise<NewsletterRow[]> {
  const { data, error } = await supabase
    .from("newsletters")
    .select("*")
    .eq("status", "published")
    .order("publication_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchNewsletterBySlug(slug: string): Promise<NewsletterRow | null> {
  const { data, error } = await supabase
    .from("newsletters")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchAllNewslettersAdmin(): Promise<NewsletterRow[]> {
  const { data, error } = await supabase
    .from("newsletters")
    .select("*")
    .order("publication_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchAdminNewsletter(id: string): Promise<NewsletterRow | null> {
  const { data, error } = await supabase
    .from("newsletters")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function logActivity(action: string, newsletterId: string | null, details: object = {}) {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) return;
  await supabase.from("admin_activity").insert({
    action,
    newsletter_id: newsletterId,
    user_id: uid,
    details: details as never,
  });
}
