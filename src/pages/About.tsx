import { Activity, Award, Briefcase, Clock, DollarSign, Heart, Smile, Users, UserSquare2 } from "lucide-react";

export default function About() {
  const features = [
    { icon: UserSquare2, name: "Age", desc: "Career stage influences mobility and ambition." },
    { icon: Users, name: "Gender", desc: "Tracked for fairness audits and parity insights." },
    { icon: Briefcase, name: "Department", desc: "Different teams face different attrition pressures." },
    { icon: DollarSign, name: "Monthly Income", desc: "Compensation gaps are a leading attrition driver." },
    { icon: Award, name: "Job Role", desc: "Role complexity correlates with growth expectations." },
    { icon: Clock, name: "Years at Company", desc: "Early-tenure employees churn most." },
    { icon: Heart, name: "Work Life Balance", desc: "Burnout precedes resignation by months." },
    { icon: Smile, name: "Job Satisfaction", desc: "Lowest single-most predictive factor." },
    { icon: Activity, name: "Overtime", desc: "Frequent overtime sharply raises risk." },
  ];
  const risks = [
    { tone: "high", label: "HIGH RISK", what: "Likely to leave within 6 months.", action: "Schedule a retention conversation this week." },
    { tone: "medium", label: "MEDIUM RISK", what: "Showing early warning signs.", action: "Monitor closely and address top concern." },
    { tone: "low", label: "LOW RISK", what: "Engaged and stable.", action: "Recognize contribution; keep practices steady." },
  ];

  return (
    <div className="container py-12 md:py-16 max-w-5xl">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight animate-fade-up">Documentation</h1>
      <p className="mt-2 text-muted-foreground animate-fade-up" style={{ animationDelay: "0.05s" }}>How Attrix works.</p>

      <p className="mt-8 max-w-2xl text-muted-foreground leading-relaxed animate-fade-up" style={{ animationDelay: "0.1s" }}>
        Attrix evaluates each employee across nine HR factors to estimate the probability they'll leave in the near term.
        The model surfaces which factors contribute most and pairs the verdict with an AI-written recommendation.
      </p>

      <h2 className="mt-12 text-xl font-bold tracking-tight">The 9 factors</h2>
      <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
        {features.map(f => (
          <div key={f.name} className="glass-card rounded-2xl p-5 hover-lift">
            <div className="h-9 w-9 rounded-lg border border-border bg-secondary grid place-items-center"><f.icon className="h-4 w-4" /></div>
            <div className="mt-3 font-semibold">{f.name}</div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-12 text-xl font-bold tracking-tight">Risk levels</h2>
      <div className="mt-4 grid md:grid-cols-3 gap-4 stagger">
        {risks.map(r => {
          const cls = r.tone === "high" ? "border-destructive/40" : r.tone === "medium" ? "border-warning/40" : "border-success/40";
          const txt = r.tone === "high" ? "text-destructive" : r.tone === "medium" ? "text-warning" : "text-success";
          return (
            <div key={r.label} className={`glass-card rounded-2xl p-6 ${cls}`}>
              <div className={`text-sm font-bold tracking-widest ${txt}`}>{r.label}</div>
              <p className="mt-2 text-sm">{r.what}</p>
              <p className="mt-2 text-xs text-muted-foreground">HR action: {r.action}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
