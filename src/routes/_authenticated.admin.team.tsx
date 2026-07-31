import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Eyebrow } from "@/components/site/eyebrow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  inviteAdmin,
  listAdminTeam,
  revokeAdminInvite,
} from "@/lib/admin-invites.functions";
import { Mail, ShieldCheck, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/team")({
  component: TeamPage,
  head: () => ({
    meta: [
      { title: "Admin Team — KHM Info Hub" },
      { name: "description", content: "Manage KHM Info Hub administrators and invitations." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function TeamPage() {
  const qc = useQueryClient();
  const fetchTeam = useServerFn(listAdminTeam);
  const sendInvite = useServerFn(inviteAdmin);
  const revoke = useServerFn(revokeAdminInvite);
  const [email, setEmail] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-team"],
    queryFn: () => fetchTeam(),
  });

  const inviteMutation = useMutation({
    mutationFn: (value: string) =>
      sendInvite({
        data: {
          email: value,
          redirectTo:
            typeof window !== "undefined" ? `${window.location.origin}/auth` : undefined,
        },
      }),
    onSuccess: (res) => {
      setEmail("");
      qc.invalidateQueries({ queryKey: ["admin-team"] });
      toast.success(
        res.emailSent
          ? "Invitation sent. They become an admin as soon as they sign up."
          : "Invite recorded. Email delivery failed — share the sign-up link manually.",
      );
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => revoke({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-team"] });
      toast.success("Invite revoked.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const pending = (data?.invites ?? []).filter((i) => i.status === "pending");
  const history = (data?.invites ?? []).filter((i) => i.status !== "pending");

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <header>
        <Eyebrow tone="brand">ADMIN TEAM</Eyebrow>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Administrators & invites</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Any admin can invite another person. Invited people become admins automatically the
          first time they sign up with that email address.
        </p>
      </header>

      <section className="rounded-lg border border-[var(--border)] bg-surface p-5">
        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            if (!email.trim()) return;
            inviteMutation.mutate(email.trim());
          }}
        >
          <div className="flex-1">
            <Label htmlFor="invite-email">Invite an admin by email</Label>
            <Input
              id="invite-email"
              type="email"
              required
              maxLength={255}
              placeholder="name@khmtechnology.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2"
            />
          </div>
          <Button type="submit" disabled={inviteMutation.isPending}>
            <Mail className="mr-2 h-4 w-4" />
            {inviteMutation.isPending ? "Sending…" : "Send invite"}
          </Button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground">
          Current admins
        </h2>
        <div className="divide-y divide-[var(--border)] rounded-lg border border-[var(--border)] bg-surface">
          {isLoading && <p className="p-4 text-sm text-muted-foreground">Loading…</p>}
          {(data?.members ?? []).map((m) => (
            <div key={m.user_id} className="flex items-center gap-3 p-4 text-sm">
              <ShieldCheck className="h-4 w-4 text-[var(--brand)]" />
              <span className="truncate">{m.email ?? m.display_name ?? m.user_id}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground">
          Pending invites
        </h2>
        <div className="divide-y divide-[var(--border)] rounded-lg border border-[var(--border)] bg-surface">
          {pending.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">No pending invites.</p>
          )}
          {pending.map((invite) => (
            <div key={invite.id} className="flex items-center justify-between gap-3 p-4 text-sm">
              <span className="truncate">{invite.email}</span>
              <button
                type="button"
                onClick={() => revokeMutation.mutate(invite.id)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" /> Revoke
              </button>
            </div>
          ))}
        </div>
      </section>

      {history.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm uppercase tracking-widest text-muted-foreground">History</h2>
          <div className="divide-y divide-[var(--border)] rounded-lg border border-[var(--border)] bg-surface">
            {history.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between p-4 text-sm">
                <span className="truncate">{invite.email}</span>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  {invite.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
