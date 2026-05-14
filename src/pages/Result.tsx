import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Download, RotateCcw, Sparkles } from "lucide-react";
import { PredictionInput, PredictionResult, riskCopy } from "@/lib/predict";
import { useCountUp } from "@/hooks/useCountUp";
import { supabase } from "@/integrations/supabase/client";

interface Stored { input: PredictionInput; result: PredictionResult; }

export default function Result() {
  const nav = useNavigate();
  const [data, setData] = useState<Stored | null>(null);
  const [explanation, setExplanation] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);

  // ---- AI Explanation (Gemini, via key in localStorage) ----
  const [aiExplanation, setAiExplanation] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string>("");

  useEffect(() => {
    const raw = sessionStorage.getItem("attrix:lastPrediction");
    if (!raw) { nav("/predict"); return; }
    setData(JSON.parse(raw));
  }, [nav]);

  useEffect(() => {
    if (!data) return;
    setLoadingAi(true);
    supabase.functions.invoke("ai-explain", {
      body: { kind: "individual", input: data.input, result: data.result },
    }).then(({ data: res, error }) => {
      if (error || !res?.text) {
        setExplanation(defaultExplanation(data.input, data.result));
      } else {
        setExplanation(res.text);
      }
    }).catch(() => setExplanation(defaultExplanation(data.input, data.result)))
      .finally(() => setLoadingAi(false));
  }, [data]);

  // Fetch AI explanation directly from Gemini using the key from Settings.
  useEffect(() => {
    if (!data) return;
    const apiKey = localStorage.getItem("attrix_gemini_key");
    if (!apiKey) {
      setAiError("Admin has not configured the Gemini API key yet.");
      setAiExplanation("");
      return;
    }

    const { input, result } = data;
    const prompt =
      `You are an expert HR analyst. An employee was assessed as ${result.riskLevel.toUpperCase()} attrition risk ` +
      `with ${result.confidence}% confidence. Top factors: ` +
      `${result.factors.slice(0, 3).map(f => `${f.label} ${f.impact}%`).join(", ")}. ` +
      `Profile: ${JSON.stringify(input)}. ` +
      `In 3-4 short sentences, explain in plain professional English why this person is at this risk level, ` +
      `what the main concerns are, and give one concrete HR recommendation. Avoid markdown headers.`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    setAiLoading(true);
    setAiError("");
    setAiExplanation("");

    fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 400 },
        }),
        signal: controller.signal,
      },
    )
      .then(async (r) => {
        if (!r.ok) throw new Error(`Gemini error ${r.status}`);
        return r.json();
      })
      .then((json) => {
        const text =
          json?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).filter(Boolean).join("\n").trim() || "";
        if (!text) {
          setAiError("AI did not return an explanation. Please try again.");
        } else {
          setAiExplanation(text);
        }
      })
      .catch((e) => {
        if ((e as any)?.name === "AbortError") {
          setAiError("AI request timed out. Please try again.");
        } else {
          setAiError("Could not reach the AI service. Check the Gemini API key in Settings.");
        }
      })
      .finally(() => {
        clearTimeout(timeout);
        setAiLoading(false);
      });

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [data]);

  const conf = useCountUp(data?.result.confidence ?? 0, 1000, !!data);

  if (!data) return null;
  const { input, result } = data;
  const tone = riskCopy[result.riskLevel];

  const toneClasses = {
    high:   "border-destructive/40 bg-destructive/[0.08] text-destructive",
    medium: "border-warning/40 bg-warning/[0.08] text-warning",
    low:    "border-success/40 bg-success/[0.08] text-success",
  }[result.riskLevel];

  return (
    <div className="container py-12 md:py-16 max-w-5xl space-y-8">
      <div className={`animate-spring-in rounded-3xl border p-10 md:p-14 text-center ${toneClasses}`}>
        <div className="text-xs tracking-[0.3em] font-semibold opacity-70">RISK ASSESSMENT</div>
        <div className="mt-2 text-4xl md:text-6xl font-bold tracking-tight">{tone.label}</div>
        <p className="mt-3 text-base md:text-lg opacity-80">{tone.desc}</p>
        <div className="mt-8 inline-flex flex-col items-center">
          <div className="text-7xl md:text-8xl font-bold tabular-nums tracking-tight text-foreground">
            {Math.round(conf)}<span className="text-3xl md:text-4xl">%</span>
          </div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Prediction Confidence</div>
        </div>
      </div>

      <section className="glass-card rounded-2xl p-6 md:p-8 animate-fade-up">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight">Why This Prediction?</h2>
        <p className="text-sm text-muted-foreground mt-1">Top factors influencing the model</p>
        <div className="mt-6 space-y-3">
          {result.factors.map((f, i) => (
            <div key={f.label}>
              <div className="flex justify-between text-sm">
                <span>{f.label}</span>
                <span className="font-semibold tabular-nums">{f.impact}%</span>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full bg-foreground rounded-full transition-all duration-700 ease-smooth"
                  style={{ width: `${f.impact * 2}%`, transitionDelay: `${i * 100}ms` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 md:p-8 animate-fade-up">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">What This Means</h2>
        </div>
        <p className="mt-4 text-muted-foreground leading-relaxed min-h-[60px]">
          {loadingAi ? "Generating insight…" : explanation}
        </p>
      </section>

      {/* AI Explanation card — powered directly by Gemini using the key from Settings */}
      <section
        className="rounded-2xl p-6 md:p-8 animate-fade-up border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card shadow-sm"
        aria-live="polite"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary grid place-items-center">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">AI Explanation</h2>
            <p className="text-xs text-muted-foreground">Powered by Gemini</p>
          </div>
        </div>

        <div className="mt-5 min-h-[80px]">
          {aiLoading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "120ms" }} />
                <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "240ms" }} />
                <span className="ml-1">Generating AI explanation…</span>
              </div>
              <div className="h-3 w-11/12 rounded bg-foreground/10 animate-pulse" />
              <div className="h-3 w-9/12 rounded bg-foreground/10 animate-pulse" />
              <div className="h-3 w-10/12 rounded bg-foreground/10 animate-pulse" />
            </div>
          )}

          {!aiLoading && aiError && (
            <p className="text-sm text-muted-foreground italic">{aiError}</p>
          )}

          {!aiLoading && !aiError && aiExplanation && (
            <p className="text-foreground/90 leading-relaxed whitespace-pre-line">{aiExplanation}</p>
          )}
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 md:p-8 animate-fade-up">
        <h2 className="text-lg font-bold mb-4">Input Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          {[
            ["Name", input.name || "—"],
            ["Age", input.age],
            ["Gender", input.gender],
            ["Department", input.department],
            ["Job Role", input.jobRole],
            ["Monthly Income", `$${input.monthlyIncome.toLocaleString()}`],
            ["Years at Company", input.yearsAtCompany],
            ["Work Life Balance", input.workLifeBalance + "/4"],
            ["Job Satisfaction", input.jobSatisfaction + "/4"],
            ["Overtime", input.overTime],
          ].map(([k, v]) => (
            <div key={k as string}>
              <div className="text-xs text-muted-foreground tracking-wide uppercase">{k}</div>
              <div className="font-medium mt-1">{v as any}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link to="/predict" className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-3 font-semibold text-sm hover:scale-[1.02] transition-all">
          <RotateCcw className="h-4 w-4" /> Analyze Another
        </Link>
        <button
          onClick={() => downloadReport(input, result, explanation)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-3 font-semibold text-sm hover:scale-[1.02] transition-all"
        >
          <Download className="h-4 w-4" /> Download Report
        </button>
      </div>
    </div>
  );
}

function defaultExplanation(i: PredictionInput, r: PredictionResult) {
  if (r.riskLevel === "high")
    return `This profile shows elevated attrition risk driven primarily by ${r.factors[0].label.toLowerCase()} and ${r.factors[1].label.toLowerCase()}. Consider a one-on-one conversation, workload review, and a tailored retention plan.`;
  if (r.riskLevel === "medium")
    return `Moderate risk detected. Watch ${r.factors[0].label.toLowerCase()} closely and check in regularly. Small interventions now can prevent escalation.`;
  return `Profile looks stable. Continue current engagement practices and recognize this employee's contribution to maintain low churn risk.`;
}

function downloadReport(i: PredictionInput, r: PredictionResult, explanation: string) {
  const lines = [
    "ATTRIX — Attrition Risk Report",
    `Employee: ${i.name || "—"}`,
    `Risk Level: ${r.riskLevel.toUpperCase()}`,
    `Confidence: ${r.confidence}%`,
    `Department: ${i.department}`,
    `Job Role: ${i.jobRole}`,
    `Monthly Income: $${i.monthlyIncome}`,
    `Years at Company: ${i.yearsAtCompany}`,
    `Overtime: ${i.overTime}`,
    `Work Life Balance: ${i.workLifeBalance}/4`,
    `Job Satisfaction: ${i.jobSatisfaction}/4`,
    "",
    "Top Factors:",
    ...r.factors.map(f => `  - ${f.label}: ${f.impact}%`),
    "",
    "Insight:",
    explanation,
  ].join("\n");
  const blob = new Blob([lines], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `attrix-report-${(i.name || "employee").replace(/\s+/g, "-")}.txt`;
  a.click();
}
