import { useMemo, useRef, useState } from "react";
import { Download, FileSpreadsheet, Filter, Search, Sparkles, Upload, X } from "lucide-react";
import { parseCSV, SAMPLE_CSV } from "@/lib/csv";
import { scoreEmployee, riskCopy, PredictionResult, PredictionInput } from "@/lib/predict";
import { StatNumber } from "@/components/StatNumber";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Row { input: PredictionInput; result: PredictionResult }

export default function Workforce() {
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [drag, setDrag] = useState(false);
  const [drawer, setDrawer] = useState<Row | null>(null);
  const [report, setReport] = useState<string>("");
  const [reportLoading, setReportLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".csv")) { toast.error("CSV only"); return; }
    const text = await file.text();
    const records = parseCSV(text);
    if (!records.length) { toast.error("Empty CSV"); return; }
    const parsed: Row[] = records.map(r => {
      const input: PredictionInput = {
        name: r.Name || "",
        age: Number(r.Age) || 30,
        gender: r.Gender || "Male",
        department: r.Department || "Operations",
        monthlyIncome: Number(r.MonthlyIncome) || 5000,
        jobRole: r.JobRole || "Software Engineer",
        yearsAtCompany: Number(r.YearsAtCompany) || 2,
        workLifeBalance: Math.max(1, Math.min(4, Number(r.WorkLifeBalance) || 3)),
        jobSatisfaction: Math.max(1, Math.min(4, Number(r.JobSatisfaction) || 3)),
        overTime: (r.OverTime?.toLowerCase() === "yes" ? "Yes" : "No"),
      };
      return { input, result: scoreEmployee(input) };
    });
    setRows(parsed);
    setReport("");
    toast.success(`Analyzed ${parsed.length} employees`);
  };

  const counts = useMemo(() => ({
    total: rows.length,
    high: rows.filter(r => r.result.riskLevel === "high").length,
    medium: rows.filter(r => r.result.riskLevel === "medium").length,
    low: rows.filter(r => r.result.riskLevel === "low").length,
  }), [rows]);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (filter !== "all" && r.result.riskLevel !== filter) return false;
      if (search && !(r.input.name || "").toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }).sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.result.riskLevel] - order[b.result.riskLevel];
    });
  }, [rows, search, filter]);

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "attrix-sample.csv"; a.click();
  };

  const exportFull = () => {
    const headers = ["Name", "Department", "JobRole", "Risk", "Confidence", "MainConcern"];
    const lines = [headers.join(",")];
    rows.forEach(r => lines.push([
      r.input.name, r.input.department, r.input.jobRole,
      r.result.riskLevel.toUpperCase(), r.result.confidence + "%", `"${r.result.mainConcern}"`
    ].join(",")));
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "attrix-workforce-report.csv"; a.click();
  };

  const generateReport = async () => {
    if (!rows.length) return;
    setReportLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-explain", {
        body: { kind: "workforce", summary: counts, rows: rows.slice(0, 50).map(r => ({ ...r.input, risk: r.result.riskLevel, mainConcern: r.result.mainConcern })) }
      });
      if (error || !data?.text) {
        setReport(fallbackReport(counts, rows));
      } else setReport(data.text);
    } catch {
      setReport(fallbackReport(counts, rows));
    } finally { setReportLoading(false); }
  };

  return (
    <div className="container py-12 md:py-16 max-w-6xl space-y-8">
      <div className="animate-fade-up">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Workforce Analysis</h1>
        <p className="mt-2 text-muted-foreground">Upload your staff list for instant company-wide attrition risk analysis.</p>
      </div>

      {/* Upload */}
      <div
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => {
          e.preventDefault(); setDrag(false);
          const f = e.dataTransfer.files?.[0]; if (f) handleFile(f);
        }}
        className={`glass-card rounded-2xl p-10 text-center border-dashed border-2 transition-all duration-300 ${drag ? "border-foreground/60 bg-foreground/5" : "border-border"}`}
      >
        <div className="mx-auto h-14 w-14 rounded-2xl bg-secondary grid place-items-center mb-4">
          <Upload className="h-6 w-6" />
        </div>
        <p className="font-semibold">Drop CSV file here or <button onClick={() => fileRef.current?.click()} className="underline underline-offset-4">click to browse</button></p>
        <p className="text-xs text-muted-foreground mt-1">.csv only · Drag and drop supported</p>
        <input ref={fileRef} type="file" accept=".csv" hidden onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>

      {/* CSV format */}
      <details className="glass-card rounded-2xl p-6 group">
        <summary className="cursor-pointer flex items-center gap-2 font-semibold list-none">
          <FileSpreadsheet className="h-4 w-4" /> Required CSV Format
          <span className="ml-auto text-xs text-muted-foreground group-open:hidden">show</span>
          <span className="ml-auto text-xs text-muted-foreground hidden group-open:inline">hide</span>
        </summary>
        <div className="mt-4 overflow-x-auto">
          <table className="text-sm w-full">
            <tbody className="divide-y divide-border">
              {[
                ["Name", "Employee full name"],
                ["Age", "Between 18 and 60"],
                ["Gender", "Male / Female / Prefer not to say"],
                ["Department", "Any department"],
                ["MonthlyIncome", "Numbers only"],
                ["JobRole", "Any role from the role list"],
                ["YearsAtCompany", "Number"],
                ["WorkLifeBalance", "Rate 1 to 4"],
                ["JobSatisfaction", "Rate 1 to 4"],
                ["OverTime", "Yes or No"],
              ].map(([k, v]) => (
                <tr key={k}>
                  <td className="py-2 pr-4 font-medium">{k}</td>
                  <td className="py-2 text-muted-foreground">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={downloadSample} className="mt-4 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:scale-[1.03] transition-all">
            <Download className="h-3.5 w-3.5" /> Download Sample CSV
          </button>
        </div>
      </details>

      {/* Results */}
      {rows.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger">
            <SummaryCard label="Total Employees" value={counts.total} tone="default" />
            <SummaryCard label="High Risk" value={counts.high} tone="high" />
            <SummaryCard label="Medium Risk" value={counts.medium} tone="medium" />
            <SummaryCard label="Low Risk" value={counts.low} tone="low" />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 rounded-full border border-border bg-card focus-ring flex-1 min-w-[200px] max-w-sm">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name…" className="flex-1 bg-transparent outline-none py-2 text-sm" />
            </div>
            <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1">
              {(["all", "high", "medium", "low"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide transition-all ${filter === f ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>
                  {f}
                </button>
              ))}
            </div>
            <button onClick={exportFull} className="ml-auto inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:scale-[1.03] transition-all">
              <Download className="h-3.5 w-3.5" /> Export Full Report
            </button>
          </div>

          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-muted-foreground text-xs uppercase tracking-wider">
                  <tr>
                    <th className="text-left py-3 px-4">#</th>
                    <th className="text-left py-3 px-4">Name</th>
                    <th className="text-left py-3 px-4">Department</th>
                    <th className="text-left py-3 px-4">Risk</th>
                    <th className="text-left py-3 px-4">Confidence</th>
                    <th className="text-left py-3 px-4">Main Concern</th>
                    <th className="text-right py-3 px-4">Details</th>
                  </tr>
                </thead>
                <tbody className="stagger">
                  {filtered.map((r, i) => (
                    <tr key={i} className="border-t border-border hover:bg-secondary/30 transition-colors">
                      <td className="py-3 px-4 text-muted-foreground tabular-nums">{i + 1}</td>
                      <td className="py-3 px-4 font-medium">{r.input.name || "—"}</td>
                      <td className="py-3 px-4 text-muted-foreground">{r.input.department}</td>
                      <td className="py-3 px-4"><RiskBadge level={r.result.riskLevel} /></td>
                      <td className="py-3 px-4 tabular-nums">{r.result.confidence}%</td>
                      <td className="py-3 px-4 text-muted-foreground">{r.result.mainConcern}</td>
                      <td className="py-3 px-4 text-right">
                        <button onClick={() => setDrawer(r)} className="text-xs underline-offset-4 hover:underline">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 md:p-8">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <h2 className="text-lg md:text-xl font-bold tracking-tight">AI Workforce Report</h2>
              </div>
              <button onClick={generateReport} disabled={reportLoading}
                className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:scale-[1.03] transition-all disabled:opacity-60">
                {reportLoading ? "Analyzing…" : "Generate Workforce Report"}
              </button>
            </div>
            {report && <p className="mt-4 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{report}</p>}
          </div>
        </>
      )}

      {/* Drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm animate-fade-in" onClick={() => setDrawer(null)} />
          <aside className="ml-auto relative w-full max-w-md h-full bg-card border-l border-border p-6 overflow-y-auto" style={{ animation: "slide-up 0.4s var(--ease-smooth)" }}>
            <button onClick={() => setDrawer(null)} className="absolute top-4 right-4 h-8 w-8 grid place-items-center rounded-full hover:bg-secondary">
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-2xl font-bold tracking-tight">{drawer.input.name || "Employee"}</h3>
            <div className="mt-2"><RiskBadge level={drawer.result.riskLevel} /></div>
            <p className="text-sm text-muted-foreground mt-1">Confidence: <span className="font-semibold text-foreground">{drawer.result.confidence}%</span></p>

            <div className="mt-6">
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Risk factors</div>
              {drawer.result.factors.map(f => (
                <div key={f.label} className="mb-2">
                  <div className="flex justify-between text-xs">
                    <span>{f.label}</span><span className="tabular-nums">{f.impact}%</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-foreground" style={{ width: `${f.impact * 2}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Details</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Info k="Age" v={drawer.input.age} />
                <Info k="Gender" v={drawer.input.gender} />
                <Info k="Department" v={drawer.input.department} />
                <Info k="Job Role" v={drawer.input.jobRole} />
                <Info k="Income" v={`$${drawer.input.monthlyIncome.toLocaleString()}`} />
                <Info k="Tenure" v={`${drawer.input.yearsAtCompany}y`} />
                <Info k="WLB" v={`${drawer.input.workLifeBalance}/4`} />
                <Info k="Satisfaction" v={`${drawer.input.jobSatisfaction}/4`} />
                <Info k="Overtime" v={drawer.input.overTime} />
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

const Info = ({ k, v }: { k: string; v: any }) => (
  <div>
    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{k}</div>
    <div className="font-medium">{v}</div>
  </div>
);

const RiskBadge = ({ level }: { level: "high" | "medium" | "low" }) => {
  const cls = {
    high: "bg-destructive/15 text-destructive border-destructive/40 animate-pulse-danger",
    medium: "bg-warning/15 text-warning border-warning/40",
    low: "bg-success/15 text-success border-success/40",
  }[level];
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wider uppercase ${cls}`}>
    {level}
  </span>;
};

const SummaryCard = ({ label, value, tone }: { label: string; value: number; tone: "default" | "high" | "medium" | "low" }) => {
  const toneCls = {
    default: "border-border",
    high:    "border-destructive/30 [&_.num]:text-destructive",
    medium:  "border-warning/30 [&_.num]:text-warning",
    low:     "border-success/30 [&_.num]:text-success",
  }[tone];
  return (
    <div className={`glass-card rounded-2xl p-5 ${toneCls}`}>
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="num mt-1 text-4xl font-bold tabular-nums tracking-tight">
        <StatNumber value={value} />
      </div>
    </div>
  );
};

function fallbackReport(counts: { total: number; high: number; medium: number; low: number }, rows: Row[]) {
  const deptRisk: Record<string, number> = {};
  rows.forEach(r => {
    if (r.result.riskLevel !== "high") return;
    deptRisk[r.input.department] = (deptRisk[r.input.department] || 0) + 1;
  });
  const topDept = Object.entries(deptRisk).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
  const pctHigh = Math.round((counts.high / counts.total) * 100);
  return `Overall risk: ${pctHigh >= 30 ? "ELEVATED" : pctHigh >= 15 ? "MODERATE" : "LOW"} (${counts.high} high-risk of ${counts.total} employees).

Most at risk department: ${topDept}.

Top 3 risk factors across the workforce: Overtime, Job Satisfaction, Monthly Income.

Recommended actions: 1) Audit overtime policies in the most affected department, 2) Run a pulse satisfaction survey, 3) Schedule retention conversations for everyone flagged HIGH this week.`;
}
