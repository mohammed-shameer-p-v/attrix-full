import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users2, Building2, AlertTriangle, ShieldCheck } from "lucide-react";
import { StatNumber } from "@/components/StatNumber";

interface Stats {
  totalCompanies: number;
  totalPredictions: number;
  highRisk: number;
  lowRisk: number;
  recent: any[];
  byDept: Record<string, number>;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ count: companyCount }, { data: preds }] = await Promise.all([
        supabase.from("companies").select("*", { count: "exact", head: true }),
        supabase.from("predictions").select("*").order("created_at", { ascending: false }).limit(500),
      ]);
      const list = preds ?? [];
      const byDept: Record<string, number> = {};
      list.forEach(p => {
        const d = p.department || "Unknown";
        byDept[d] = (byDept[d] || 0) + 1;
      });
      setStats({
        totalCompanies: companyCount ?? 0,
        totalPredictions: list.length,
        highRisk: list.filter(p => p.risk_level === "high").length,
        lowRisk: list.filter(p => p.risk_level === "low").length,
        recent: list.slice(0, 8),
        byDept,
      });
      setLoading(false);
    })();
  }, []);

  if (loading || !stats) {
    return <div className="container py-16 text-muted-foreground">Loading dashboard…</div>;
  }

  const cards = [
    { label: "Companies", value: stats.totalCompanies, icon: Building2, tone: "text-foreground" },
    { label: "Predictions", value: stats.totalPredictions, icon: Users2, tone: "text-foreground" },
    { label: "High Risk", value: stats.highRisk, icon: AlertTriangle, tone: "text-destructive" },
    { label: "Low Risk", value: stats.lowRisk, icon: ShieldCheck, tone: "text-success" },
  ];

  const deptEntries = Object.entries(stats.byDept).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxDept = Math.max(1, ...deptEntries.map(([, v]) => v));

  return (
    <div className="container py-10 md:py-14 space-y-10">
      <header className="space-y-2 animate-fade-up">
        <span className="pill-tag">Admin Dashboard</span>
        <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground">Live metrics across all companies and predictions.</p>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <div key={c.label} className="glass-card p-5 animate-fade-up" style={{ animationDelay: `${i * 0.06}s` }}>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">{c.label}</span>
              <c.icon className={`h-4 w-4 ${c.tone}`} />
            </div>
            <div className="mt-3 text-3xl md:text-4xl font-display font-bold">
              <StatNumber value={c.value} />
            </div>
          </div>
        ))}
      </section>

      <section className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 animate-fade-up">
          <h2 className="font-display font-semibold text-lg mb-4">Predictions by department</h2>
          {deptEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <ul className="space-y-3">
              {deptEntries.map(([dept, n]) => (
                <li key={dept}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{dept}</span>
                    <span className="text-muted-foreground tabular-nums">{n}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-foreground transition-all duration-700"
                      style={{ width: `${(n / maxDept) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="glass-card p-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <h2 className="font-display font-semibold text-lg mb-4">Recent predictions</h2>
          {stats.recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No predictions yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {stats.recent.map(p => (
                <li key={p.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{p.employee_name || "Unnamed"}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {p.job_role || "—"} · {p.department || "—"}
                    </div>
                  </div>
                  <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded-full ${
                    p.risk_level === "high" ? "bg-destructive/15 text-destructive" :
                    p.risk_level === "medium" ? "bg-warning/20 text-warning-foreground" :
                    "bg-success/15 text-success"
                  }`}>{p.risk_level}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
