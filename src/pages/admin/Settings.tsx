import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Bell, Eye, EyeOff, Key, Lock, Palette, User, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function Settings() {
  const { user, role } = useAuth();
  const { theme, toggle } = useTheme();

  const Section = ({ icon: Icon, title, children }: any) => (
    <section className="glass-card p-6 animate-fade-up">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-9 w-9 rounded-xl bg-foreground/10 grid place-items-center">
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="font-display font-semibold text-lg">{title}</h2>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );

  const Row = ({ label, value, action }: any) => (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <div>
        <div className="text-sm font-medium">{label}</div>
        {value && <div className="text-xs text-muted-foreground mt-0.5">{value}</div>}
      </div>
      {action}
    </div>
  );

  const [groqKey, setGroqKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [backendUrl, setBackendUrl] = useState("");
  const [showGroq, setShowGroq] = useState(false);
  const [showGemini, setShowGemini] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadKeys = async () => {
      try {
        const { data } = await supabase.from("app_settings").select("key, value");
        if (data) {
          data.forEach((row: any) => {
            if (row.key === "groq_api_key") setGroqKey(row.value);
            if (row.key === "gemini_api_key") setGeminiKey(row.value);
            if (row.key === "backend_url") setBackendUrl(row.value);
          });
        }
      } catch {
        setGroqKey(localStorage.getItem("attrix_groq_key") ?? "");
        setGeminiKey(localStorage.getItem("attrix_gemini_key") ?? "");
        setBackendUrl(localStorage.getItem("attrix_backend_url") ?? "http://localhost:8000");
      }
    };
    loadKeys();
  }, []);

  const saveKey = async (dbKey: string, localKey: string, value: string, label: string) => {
    setSaving(true);
    try {
      await supabase.from("app_settings").upsert({ key: dbKey, value }, { onConflict: "key" });
      localStorage.setItem(localKey, value);
      toast.success(`${label} saved!`);
    } catch {
      localStorage.setItem(localKey, value);
      toast.success(`${label} saved locally!`);
    } finally {
      setSaving(false);
    }
  };

  const SecretRow = ({ label, value, setValue, show, setShow, dbKey, localKey }: any) => (
    <div className="py-2 border-b border-border last:border-0">
      <div className="text-sm font-medium mb-2">{label}</div>
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center px-3 rounded-xl border border-border bg-card">
          <input
            type={show ? "text" : "password"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={`Enter ${label}`}
            className="flex-1 bg-transparent outline-none py-2.5 text-sm"
          />
          <button type="button" onClick={() => setShow(!show)} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-foreground/10 text-muted-foreground">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <button type="button" disabled={saving} onClick={() => saveKey(dbKey, localKey, value, label)}
          className="px-4 py-2 rounded-full bg-foreground text-background text-sm font-medium hover:scale-[1.02] transition-transform disabled:opacity-50">
          Save
        </button>
      </div>
    </div>
  );

  const team = [
    { name: "Muhammed Shibin Sha P", role: "Project Lead", color: "bg-rose-500" },
    { name: "Muhammed Nihal T", role: "Frontend Developer", color: "bg-sky-500" },
    { name: "Mohammed Shameer PV", role: "Backend Developer", color: "bg-emerald-500" },
    { name: "Mohammed Nafil Ashraf", role: "ML Engineer", color: "bg-violet-500" },
    { name: "Pranav KV", role: "DevOps & Docker", color: "bg-amber-500" },
    { name: "Muhammed Shanib C", role: "UI/UX Designer", color: "bg-fuchsia-500" },
  ];

  const initials = (n: string) => n.split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]).join("").toUpperCase();

  return (
    <div className="container py-10 md:py-14 max-w-3xl space-y-6">
      <header className="space-y-2 animate-fade-up">
        <span className="pill-tag">Admin</span>
        <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and platform preferences.</p>
      </header>

      <Section icon={User} title="Account">
        <Row label="Email" value={user?.email} />
        <Row label="Role" value={role ?? "—"} action={<span className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded-full bg-foreground/10">{role}</span>} />
        <Row label="User ID" value={user?.id} />
      </Section>

      <Section icon={Palette} title="Appearance">
        <Row label="Theme" value={`Currently ${theme}`} action={
          <button onClick={toggle} className="px-4 py-2 rounded-full bg-foreground/10 hover:bg-foreground/15 text-sm font-medium transition-colors">
            Switch to {theme === "dark" ? "light" : "dark"}
          </button>
        } />
      </Section>

      <Section icon={Key} title="API Keys">
        <SecretRow label="Groq API Key" value={groqKey} setValue={setGroqKey} show={showGroq} setShow={setShowGroq} dbKey="groq_api_key" localKey="attrix_groq_key" />
        <SecretRow label="Gemini API Key" value={geminiKey} setValue={setGeminiKey} show={showGemini} setShow={setShowGemini} dbKey="gemini_api_key" localKey="attrix_gemini_key" />
        <div className="py-2">
          <div className="text-sm font-medium mb-2">Backend API URL</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 rounded-xl border border-border bg-card">
              <input type="text" value={backendUrl} onChange={(e) => setBackendUrl(e.target.value)} placeholder="http://localhost:8000" className="w-full bg-transparent outline-none py-2.5 text-sm" />
            </div>
            <button type="button" disabled={saving} onClick={() => saveKey("backend_url", "attrix_backend_url", backendUrl, "Backend URL")}
              className="px-4 py-2 rounded-full bg-foreground text-background text-sm font-medium hover:scale-[1.02] transition-transform disabled:opacity-50">
              Save
            </button>
          </div>
        </div>
      </Section>

      <Section icon={Users} title="Our Team">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {team.map((m, idx) => (
            <div key={m.name} className="glass-card p-4 flex items-center gap-3 animate-fade-up" style={{ animationDelay: `${idx * 60}ms` }}>
              <div className={`h-11 w-11 rounded-full grid place-items-center text-white font-semibold ${m.color}`}>{initials(m.name)}</div>
              <div className="min-w-0">
                <div className="font-semibold text-sm truncate">{m.name}</div>
                <div className="text-xs text-muted-foreground truncate">{m.role}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section icon={Bell} title="Notifications">
        <Row label="High-risk alerts" value="Email when employees flagged high risk" action={<span className="text-xs px-2 py-1 rounded-full bg-success/15 text-success font-semibold">On</span>} />
        <Row label="Weekly digest" value="Summary every Monday" action={<span className="text-xs px-2 py-1 rounded-full bg-success/15 text-success font-semibold">On</span>} />
      </Section>

      <Section icon={Lock} title="Security">
        <Row label="Two-factor authentication" value="Add an extra layer of security" action={<span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground font-semibold">Coming soon</span>} />
        <Row label="Session" value="Active across all devices" />
      </Section>
    </div>
  );
}