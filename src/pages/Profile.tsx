import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export default function Profile() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [pwd, setPwd] = useState({ next: "", confirm: "" });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name").eq("id", user.id).single().then(({ data }) => {
      setName(data?.display_name ?? "");
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ display_name: name }).eq("id", user.id);
    setBusy(false);
    if (error) toast.error(error.message); else toast.success("Profile updated");
  };

  const changePassword = async () => {
    if (pwd.next.length < 6) { toast.error("Password too short"); return; }
    if (pwd.next !== pwd.confirm) { toast.error("Passwords don't match"); return; }
    const { error } = await supabase.auth.updateUser({ password: pwd.next });
    if (error) toast.error(error.message);
    else { toast.success("Password updated"); setPwd({ next: "", confirm: "" }); }
  };

  return (
    <div className="container py-12 md:py-16 max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Company Profile</h1>
        <p className="mt-2 text-muted-foreground">Manage your account.</p>
      </div>

      <section className="glass-card rounded-2xl p-6 space-y-4">
        <h2 className="font-bold">Account</h2>
        <Field label="Company Name">
          <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-transparent outline-none py-2.5 text-sm" />
        </Field>
        <Field label="Email">
          <input value={user?.email ?? ""} readOnly className="w-full bg-transparent outline-none py-2.5 text-sm text-muted-foreground" />
        </Field>
        <button onClick={save} disabled={busy} className="rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold hover:scale-[1.02] transition-all disabled:opacity-60">
          {busy ? "Saving…" : "Save Changes"}
        </button>
      </section>

      <section className="glass-card rounded-2xl p-6 space-y-4">
        <h2 className="font-bold">Change Password</h2>
        <Field label="New Password">
          <input type="password" value={pwd.next} onChange={e => setPwd({ ...pwd, next: e.target.value })} className="w-full bg-transparent outline-none py-2.5 text-sm" />
        </Field>
        <Field label="Confirm New Password">
          <input type="password" value={pwd.confirm} onChange={e => setPwd({ ...pwd, confirm: e.target.value })} className="w-full bg-transparent outline-none py-2.5 text-sm" />
        </Field>
        <button onClick={changePassword} className="rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold hover:scale-[1.02] transition-all">
          Update Password
        </button>
      </section>

      <section className="glass-card rounded-2xl p-6 flex items-center justify-between">
        <div>
          <h2 className="font-bold">Appearance</h2>
          <p className="text-xs text-muted-foreground mt-1">Toggle dark or light mode</p>
        </div>
        <ThemeToggle />
      </section>
    </div>
  );
}

const Field = ({ label, children }: any) => (
  <label className="block">
    <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">{label}</span>
    <div className="mt-1.5 px-3 rounded-xl border border-border bg-card focus-ring">{children}</div>
  </label>
);
