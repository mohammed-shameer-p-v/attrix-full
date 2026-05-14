import { Link } from "react-router-dom";
import { ArrowRight, Brain, FileSpreadsheet, Sparkles, Users2 } from "lucide-react";
import { StatNumber } from "@/components/StatNumber";

const HERO = "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1920&q=80";
const TEAM = "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80";
const PERSON_LAPTOP = "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=900&q=80";
const TEAM_MEETING = "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=900&q=80";
const DASHBOARD_PHOTO = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80";

export default function Home() {
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO} alt="Modern office workspace" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/85 to-background" />
        </div>
        <div className="relative container py-24 md:py-36 lg:py-44 text-center">
          <div className="inline-flex animate-fade-up"><span className="pill-tag">HR Analytics Platform</span></div>
          <h1 className="hero-title mt-6 text-hero animate-fade-up" style={{ animationDelay: "0.1s" }}>Attrix</h1>
          <p className="hero-tagline mt-3 text-tagline animate-fade-up" style={{ animationDelay: "0.2s" }}>
            Predict. Retain. Grow.
          </p>
          <p className="hero-sub mt-6 text-base md:text-lg max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: "0.3s" }}>
            Identify employees at risk of leaving before it is too late. Analyze individuals or your entire workforce instantly.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-up" style={{ animationDelay: "0.4s" }}>
            <Link to="/predict" className="group inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 font-semibold text-sm transition-all duration-200 hover:scale-[1.03]">
              Analyze Employee <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link to="/workforce" className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 backdrop-blur px-6 py-3 font-semibold text-sm text-foreground transition-all duration-200 hover:scale-[1.03] hover:border-foreground/30">
              Workforce Analysis
            </Link>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="container -mt-10 md:-mt-12 relative z-10">
        <div className="glass-card rounded-2xl px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 stagger">
          <Stat label="Records" value={1470} />
          <Stat label="Accuracy" value={68} suffix="%" />
          <Stat label="Response" value={1} prefix="<" suffix="s" />
          <Stat label="Features" value={9} />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="container py-20 md:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">How It Works</h2>
            <p className="mt-3 text-muted-foreground max-w-md">From raw HR data to actionable insight in under two seconds.</p>
            <div className="mt-10 space-y-6 stagger">
              {[
                { n: "01", t: "Enter Data", d: "Fill employee details or upload your staff CSV.", icon: FileSpreadsheet },
                { n: "02", t: "Analyze", d: "System analyzes 9 key HR factors instantly.", icon: Brain },
                { n: "03", t: "Get Results", d: "See who is at risk and exactly why.", icon: Sparkles },
              ].map(s => (
                <div key={s.n} className="flex gap-5 items-start">
                  <div className="shrink-0 h-12 w-12 rounded-xl border border-border bg-card grid place-items-center">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground tracking-widest">STEP {s.n}</div>
                    <div className="font-semibold text-lg mt-0.5">{s.t}</div>
                    <p className="text-muted-foreground text-sm mt-1 max-w-sm">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative rounded-2xl overflow-hidden border border-border aspect-[4/5] lg:aspect-square">
            <img src={TEAM} alt="HR team meeting" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-tr from-background/60 via-transparent to-transparent" />
          </div>
        </div>
      </section>

      {/* FEATURE CARDS */}
      <section className="container pb-24 md:pb-32">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Built for modern HR teams</h2>
        <div className="mt-10 grid md:grid-cols-3 gap-6 stagger">
          <FeatureCard
            img={PERSON_LAPTOP}
            icon={Users2}
            title="Individual Analysis"
            desc="Analyze one employee at a time with full risk breakdown and AI-powered explanation."
          />
          <FeatureCard
            img={TEAM_MEETING}
            icon={Users2}
            title="Workforce Analysis"
            desc="Upload full staff list and identify everyone at risk at once with detailed insights."
          />
          <FeatureCard
            img={DASHBOARD_PHOTO}
            icon={Sparkles}
            title="Actionable Insights"
            desc="Understand exactly why each employee is at risk and get AI-recommended actions."
          />
        </div>
      </section>
    </div>
  );
}

const Stat = ({ label, value, suffix, prefix }: { label: string; value: number; suffix?: string; prefix?: string }) => (
  <div className="text-center md:text-left">
    <div className="text-4xl md:text-5xl font-bold tracking-tight">
      <StatNumber value={value} suffix={suffix} prefix={prefix} />
    </div>
    <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
  </div>
);

const FeatureCard = ({ img, icon: Icon, title, desc }: any) => (
  <article className="hover-lift glass-card rounded-2xl overflow-hidden flex flex-col">
    <div className="aspect-[16/10] overflow-hidden">
      <img src={img} alt={title} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
    </div>
    <div className="p-6">
      <div className="h-9 w-9 rounded-lg border border-border bg-secondary grid place-items-center mb-4">
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{desc}</p>
    </div>
  </article>
);