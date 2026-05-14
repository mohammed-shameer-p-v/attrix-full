import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { departments, jobRoleGroups } from "@/data/jobRoles";
import { predictFromBackend, PredictionInput } from "@/lib/predict";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const wlbLabels = ["", "Poor", "Fair", "Good", "Excellent"];
const satLabels = ["", "Low", "Medium", "High", "Very High"];

export default function Predict() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [age, setAge] = useState(30);
  const [gender, setGender] = useState("Male");
  const [department, setDepartment] = useState(departments[0]);
  const [income, setIncome] = useState(6000);
  const [jobRole, setJobRole] = useState("Software Engineer");
  const [years, setYears] = useState(3);
  const [wlb, setWlb] = useState(3);
  const [sat, setSat] = useState(3);
  const [overTime, setOverTime] = useState<"Yes" | "No">("No");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const input: PredictionInput = {
      name, age: Number(age), gender, department,
      monthlyIncome: Number(income), jobRole,
      yearsAtCompany: Number(years),
      workLifeBalance: wlb, jobSatisfaction: sat, overTime,
    };
    const result = await predictFromBackend(input);

    if (user) {
      await supabase.from("predictions").insert({
        user_id: user.id,
        employee_name: name || null,
        department,
        job_role: jobRole,
        risk_level: result.riskLevel,
        confidence: result.confidence,
        inputs: input as any,
        factors: result.factors as any,
      });
    }

    sessionStorage.setItem("attrix:lastPrediction", JSON.stringify({ input, result }));
    setBusy(false);
    nav("/result");
  };

  return (
    <div className="container py-12 md:py-16 max-w-4xl">
      <div className="animate-fade-up">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Employee Analysis</h1>
        <p className="mt-2 text-muted-foreground">Enter details to get an instant attrition risk prediction.</p>
      </div>

      <form onSubmit={submit} className="mt-10 glass-card rounded-2xl p-6 md:p-8 space-y-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
        <div className="grid md:grid-cols-2 gap-5">
          <Field label="Employee Name (optional)">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe"
              className="w-full bg-transparent outline-none py-2.5 text-sm" />
          </Field>
          <Field label="Age">
            <input type="number" min={18} max={60} value={age} onChange={e => setAge(+e.target.value)}
              className="w-full bg-transparent outline-none py-2.5 text-sm" />
          </Field>
          <Field label="Gender">
            <select value={gender} onChange={e => setGender(e.target.value)} className="w-full bg-transparent outline-none py-2.5 text-sm">
              <option className="bg-card">Male</option><option className="bg-card">Female</option><option className="bg-card">Prefer not to say</option>
            </select>
          </Field>
          <Field label="Department">
            <select value={department} onChange={e => setDepartment(e.target.value)} className="w-full bg-transparent outline-none py-2.5 text-sm">
              {departments.map(d => <option key={d} className="bg-card">{d}</option>)}
            </select>
          </Field>
          <Field label="Monthly Income (USD)">
            <input type="number" min={1000} value={income} onChange={e => setIncome(+e.target.value)}
              className="w-full bg-transparent outline-none py-2.5 text-sm" />
          </Field>
          <Field label="Job Role">
            <select value={jobRole} onChange={e => setJobRole(e.target.value)} className="w-full bg-transparent outline-none py-2.5 text-sm">
              {Object.entries(jobRoleGroups).map(([group, roles]) => (
                <optgroup label={group} key={group} className="bg-card">
                  {roles.map(r => <option key={r} className="bg-card">{r}</option>)}
                </optgroup>
              ))}
            </select>
          </Field>
          <Field label="Years at Company">
            <input type="number" min={0} max={40} value={years} onChange={e => setYears(+e.target.value)}
              className="w-full bg-transparent outline-none py-2.5 text-sm" />
          </Field>
        </div>

        <div className="grid md:grid-cols-2 gap-6 pt-2">
          <SliderField label="Work Life Balance" value={wlb} setValue={setWlb} desc={wlbLabels[wlb]} />
          <SliderField label="Job Satisfaction" value={sat} setValue={setSat} desc={satLabels[sat]} />
        </div>

        <div>
          <div className="text-xs font-medium text-muted-foreground tracking-wide uppercase">Overtime</div>
          <div className="mt-2 inline-flex rounded-full border border-border bg-card p-1">
            {(["No", "Yes"] as const).map(opt => (
              <button key={opt} type="button" onClick={() => setOverTime(opt)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  overTime === opt ? "bg-foreground text-background shadow" : "text-muted-foreground hover:text-foreground"
                }`}>{opt}</button>
            ))}
          </div>
        </div>

        <button type="submit" disabled={busy}
          className="group w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-3.5 font-semibold transition-all duration-200 hover:scale-[1.02] disabled:opacity-60">
          {busy ? "Analyzing…" : "Analyze Now"}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </form>
    </div>
  );
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">{label}</span>
    <div className="mt-1.5 px-3 rounded-xl border border-border bg-card focus-ring">{children}</div>
  </label>
);

const SliderField = ({ label, value, setValue, desc }: { label: string; value: number; setValue: (n: number) => void; desc: string }) => (
  <div>
    <div className="flex items-baseline justify-between">
      <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">{label}</span>
      <span className="text-sm font-semibold">{desc}</span>
    </div>
    <input type="range" min={1} max={4} step={1} value={value} onChange={e => setValue(+e.target.value)}
      className="mt-3 w-full accent-foreground" />
    <div className="mt-1 flex justify-between text-[10px] text-muted-foreground tracking-widest">
      <span>1</span><span>2</span><span>3</span><span>4</span>
    </div>
  </div>
);
