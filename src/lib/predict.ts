export interface PredictionInput {
  age: number;
  gender: string;
  department: string;
  monthlyIncome: number;
  jobRole: string;
  yearsAtCompany: number;
  workLifeBalance: number; // 1-4
  jobSatisfaction: number; // 1-4
  overTime: "Yes" | "No";
  name?: string;
}

export interface PredictionFactor {
  label: string;
  impact: number; // percent
}

export interface PredictionResult {
  riskLevel: "high" | "medium" | "low";
  confidence: number;
  factors: PredictionFactor[];
  mainConcern: string;
}

/**
 * Lightweight rule-based scoring used as a deterministic mock so the UI
 * always shows realistic, varied results without a backend ML model.
 */
export function scoreEmployee(i: PredictionInput): PredictionResult {
  let score = 0;
  const factors: PredictionFactor[] = [];

  const overtimeImpact = i.overTime === "Yes" ? 35 : 5;
  if (i.overTime === "Yes") score += 35;
  factors.push({ label: "Overtime", impact: overtimeImpact });

  const satImpact = i.jobSatisfaction <= 2 ? 25 : i.jobSatisfaction === 3 ? 12 : 5;
  if (i.jobSatisfaction <= 2) score += 25;
  factors.push({ label: "Job Satisfaction", impact: satImpact });

  const incomeImpact = i.monthlyIncome < 4000 ? 22 : i.monthlyIncome < 8000 ? 14 : 6;
  if (i.monthlyIncome < 4000) score += 20;
  factors.push({ label: "Monthly Income", impact: incomeImpact });

  const wlbImpact = i.workLifeBalance <= 2 ? 14 : 8;
  if (i.workLifeBalance <= 2) score += 12;
  factors.push({ label: "Work Life Balance", impact: wlbImpact });

  const tenureImpact = i.yearsAtCompany < 2 ? 12 : i.yearsAtCompany < 5 ? 8 : 4;
  if (i.yearsAtCompany < 2) score += 10;
  factors.push({ label: "Years at Company", impact: tenureImpact });

  // Age small effect
  if (i.age < 28) score += 6;

  let riskLevel: "high" | "medium" | "low";
  if (score >= 55) riskLevel = "high";
  else if (score >= 28) riskLevel = "medium";
  else riskLevel = "low";

  // Confidence: clamp 70-95
  const confidence = Math.min(95, Math.max(70, 70 + score * 0.4));

  // Sort factors descending for chart
  factors.sort((a, b) => b.impact - a.impact);

  let mainConcern = "Stable profile";
  if (i.overTime === "Yes" && i.jobSatisfaction <= 2) mainConcern = "Overtime + Low Satisfaction";
  else if (i.overTime === "Yes") mainConcern = "Frequent Overtime";
  else if (i.monthlyIncome < 4000) mainConcern = "Low Monthly Income";
  else if (i.workLifeBalance <= 2) mainConcern = "Poor Work Life Balance";
  else if (i.jobSatisfaction <= 2) mainConcern = "Low Job Satisfaction";
  else if (i.yearsAtCompany < 2) mainConcern = "Short Tenure";

  return { riskLevel, confidence: Math.round(confidence), factors, mainConcern };
}

export const riskCopy = {
  high: { label: "HIGH RISK", desc: "This employee is likely to leave", tone: "destructive" as const },
  medium: { label: "MEDIUM RISK", desc: "This employee needs monitoring", tone: "warning" as const },
  low: { label: "LOW RISK", desc: "This employee is likely to stay", tone: "success" as const },
};

/**
 * Calls a real backend prediction service if configured in
 * localStorage (`attrix_backend_url`). Falls back to the local
 * `scoreEmployee` mock silently on any failure or missing config.
 */
export async function predictFromBackend(input: PredictionInput): Promise<PredictionResult> {
  try {
    const base = (typeof window !== "undefined")
      ? localStorage.getItem("attrix_backend_url")
      : null;
    if (!base) return scoreEmployee(input);

    const url = base.replace(/\/+$/, "") + "/predict";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return scoreEmployee(input);
    const data = await res.json();

    // Validate shape; if anything is off, fall back silently.
    if (
      !data ||
      !["high", "medium", "low"].includes(data.riskLevel) ||
      typeof data.confidence !== "number" ||
      !Array.isArray(data.factors)
    ) {
      return scoreEmployee(input);
    }
    return data as PredictionResult;
  } catch {
    return scoreEmployee(input);
  }
}
