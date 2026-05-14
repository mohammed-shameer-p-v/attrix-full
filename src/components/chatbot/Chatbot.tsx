import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Msg = { role: "user" | "assistant" | "system"; content: string };

const SYSTEM_PROMPT =
  "You are the Attrix HR assistant. Help users understand employee attrition risk and how to use the Attrix platform. Reply in the user's language. Be concise, friendly and professional.";

export const Chatbot = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [groqKey, setGroqKey] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "assistant", content: "Hi! I am your HR assistant. Ask me anything about employee attrition or how to use Attrix. I support all languages." },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  useEffect(() => {
    const loadKey = async () => {
      try {
        const { data } = await supabase
          .from("app_settings")
          .select("value")
          .eq("key", "groq_api_key")
          .single();
        if (data?.value) {
          setGroqKey(data.value);
          localStorage.setItem("attrix_groq_key", data.value);
        } else {
          setGroqKey(localStorage.getItem("attrix_groq_key") ?? "");
        }
      } catch {
        setGroqKey(localStorage.getItem("attrix_groq_key") ?? "");
      }
    };
    loadKey();
  }, []);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs(next); setInput(""); setBusy(true);

    const apiKey = groqKey || localStorage.getItem("attrix_groq_key");
    if (!apiKey) {
      setMsgs([...next, { role: "assistant", content: "Admin has not configured the AI key yet." }]);
      setBusy(false);
      return;
    }

    try {
      const payload = {
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...next.map((m) => ({ role: m.role === "system" ? "user" : m.role, content: m.content })),
        ],
        temperature: 0.6,
        max_tokens: 1024,
      };
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Groq error:", err);
        setMsgs([...next, { role: "assistant", content: `Error: ${err?.error?.message || "Unknown error"}` }]);
      } else {
        const data = await res.json();
        const reply = data?.choices?.[0]?.message?.content?.trim();
        setMsgs([...next, { role: "assistant", content: reply || "Sorry, I didn't get a response." }]);
      }
    } catch (e) {
      console.error("Chatbot error:", e);
      setMsgs([...next, { role: "assistant", content: "Network error. Please try again." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-2xl grid place-items-center hover:scale-110 transition-all duration-300 animate-pulse-soft"
          aria-label="Open chat">
          <MessageCircle className="h-6 w-6" />
        </button>
      )}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[calc(100vw-3rem)] sm:w-[380px] h-[560px] max-h-[80vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl"
          style={{ animation: "slide-up 0.35s var(--ease-spring)" }}>
          <header className="flex items-center justify-between p-4 border-b border-border">
            <div>
              <div className="font-bold tracking-tight">Attrix Assistant</div>
              <div className="text-xs text-muted-foreground">Ask me anything</div>
            </div>
            <button onClick={() => setOpen(false)} className="h-8 w-8 grid place-items-center rounded-full hover:bg-secondary">
              <X className="h-4 w-4" />
            </button>
          </header>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed animate-fade-up ${
                  m.role === "user"
                    ? "bg-foreground text-background rounded-br-md"
                    : "bg-secondary text-foreground rounded-bl-md"
                }`}>{m.content}</div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="bg-secondary px-4 py-3 rounded-2xl rounded-bl-md inline-flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "120ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "240ms" }} />
                </div>
              </div>
            )}
          </div>
          <div className="p-3 border-t border-border flex items-center gap-2">
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") send(); }}
              placeholder="Ask anything…"
              className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus-ring" />
            <button onClick={send} disabled={busy || !input.trim()}
              className="h-10 w-10 grid place-items-center rounded-xl bg-primary text-primary-foreground hover:scale-105 transition-all disabled:opacity-50">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};