import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Plus, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

interface Company {
  id: string;
  name: string;
  email: string;
  status: string;
  registered_at: string;
}

export default function Companies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("companies").select("*").order("registered_at", { ascending: false });
    if (error) toast.error(error.message);
    setCompanies(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("companies").insert({ name: form.name, email: form.email });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Company created");
    setOpen(false);
    setForm({ name: "", email: "" });
    load();
  };

  const toggleStatus = async (c: Company) => {
    const next = c.status === "active" ? "inactive" : "active";
    const { error } = await supabase.from("companies").update({ status: next }).eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success(`Marked ${next}`);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this company?")) return;
    const { error } = await supabase.from("companies").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Company deleted");
    load();
  };

  const filtered = companies.filter(c =>
    !query || c.name.toLowerCase().includes(query.toLowerCase()) || c.email.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="container py-10 md:py-14 space-y-8">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 animate-fade-up">
        <div>
          <span className="pill-tag">Admin</span>
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight mt-2">Companies</h1>
          <p className="text-muted-foreground mt-1">Manage organizations using Attrix.</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 font-semibold text-sm transition-all hover:scale-[1.03]"
        >
          <Plus className="h-4 w-4" /> Add Company
        </button>
      </header>

      <div className="glass-card p-2 flex items-center gap-2">
        <Search className="h-4 w-4 ml-3 text-muted-foreground" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search companies…"
          className="flex-1 bg-transparent border-0 outline-none px-2 py-2 text-sm"
        />
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-muted-foreground text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="h-10 w-10 mx-auto text-muted-foreground/60" />
            <p className="mt-3 text-muted-foreground text-sm">No companies yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3 hidden md:table-cell">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 hidden md:table-cell">Registered</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{c.email}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleStatus(c)}
                      className={`text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded-full transition-colors ${
                        c.status === "active"
                          ? "bg-success/15 text-success hover:bg-success/25"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {c.status}
                    </button>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                    {new Date(c.registered_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => remove(c.id)}
                      className="inline-flex items-center gap-1 text-destructive hover:bg-destructive/10 px-2 py-1 rounded-full text-xs"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur animate-fade-in" onClick={() => setOpen(false)}>
          <form
            onSubmit={create}
            onClick={e => e.stopPropagation()}
            className="glass-card p-6 w-[92vw] max-w-md space-y-4 animate-spring-scale"
          >
            <h3 className="font-display font-semibold text-xl">New Company</h3>
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Name</label>
              <input
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground transition-colors"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Email</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground transition-colors"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-full text-sm font-medium hover:bg-muted">Cancel</button>
              <button disabled={saving} className="px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60">
                {saving ? "Saving…" : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
