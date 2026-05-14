const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) throw new Error("LOVABLE_API_KEY missing");

    let prompt = "";
    if (body.kind === "individual") {
      prompt = `Explain in 2-3 short sentences why this employee was assessed as ${body.result.riskLevel.toUpperCase()} attrition risk (confidence ${body.result.confidence}%). Top factors: ${body.result.factors.slice(0,3).map((f:any)=>`${f.label} ${f.impact}%`).join(", ")}. Profile: ${JSON.stringify(body.input)}. Give one concrete HR recommendation. Be direct, no fluff.`;
    } else if (body.kind === "workforce") {
      prompt = `You are an HR strategist. Analyze this workforce: ${JSON.stringify(body.summary)}. Sample rows: ${JSON.stringify(body.rows.slice(0,30))}. Produce a short report (max 180 words) with: Overall risk level, Most at-risk department, Top 3 risk factors, 3 HR recommendations. Use plain prose, no markdown headers.`;
    } else {
      throw new Error("Unknown kind");
    }

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an expert HR analyst. Always answer in clear, professional English unless asked otherwise." },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (r.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (r.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!r.ok) throw new Error(await r.text());
    const data = await r.json();
    const text = data.choices?.[0]?.message?.content ?? "";
    return new Response(JSON.stringify({ text }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
