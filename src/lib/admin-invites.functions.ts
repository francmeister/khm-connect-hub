import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const emailSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(255),
  redirectTo: z.string().url().optional(),
});

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden: admin access required");
}

export interface AdminInviteRow {
  id: string;
  email: string;
  status: string;
  created_at: string;
  accepted_at: string | null;
}

export interface AdminMemberRow {
  user_id: string;
  email: string | null;
  display_name: string | null;
}

export const listAdminTeam = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as any);
    const { supabase } = context;

    const [{ data: roles }, { data: invites }] = await Promise.all([
      supabase.from("user_roles").select("user_id").eq("role", "admin"),
      supabase
        .from("admin_invites")
        .select("id, email, status, created_at, accepted_at")
        .order("created_at", { ascending: false }),
    ]);

    const ids = (roles ?? []).map((r: { user_id: string }) => r.user_id);
    let members: AdminMemberRow[] = [];
    if (ids.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email, display_name")
        .in("user_id", ids);
      members = (profiles ?? []) as AdminMemberRow[];
    }

    return {
      members,
      invites: (invites ?? []) as AdminInviteRow[],
    };
  });

export const inviteAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => emailSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const { supabase, userId } = context;

    const { data: existing } = await supabase
      .from("admin_invites")
      .select("id")
      .eq("status", "pending")
      .ilike("email", data.email)
      .maybeSingle();

    if (existing) throw new Error("There is already a pending invite for that email.");

    const { error: insertError } = await supabase
      .from("admin_invites")
      .insert({ email: data.email, invited_by: userId });
    if (insertError) throw new Error(insertError.message);

    // Send the invitation email (privileged). Recording the invite is the
    // source of truth — email delivery is best-effort.
    let emailSent = true;
    let emailError: string | null = null;
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, {
        redirectTo: data.redirectTo,
      });
      if (error) {
        emailSent = false;
        emailError = error.message;
      }
    } catch (err) {
      emailSent = false;
      emailError = err instanceof Error ? err.message : "Unknown error";
    }

    return { ok: true, emailSent, emailError };
  });

export const revokeAdminInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const { error } = await context.supabase
      .from("admin_invites")
      .update({ status: "revoked" })
      .eq("id", data.id)
      .eq("status", "pending");
    if (error) throw new Error(error.message);
    return { ok: true };
  });
