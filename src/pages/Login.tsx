import { useState, FormEvent } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const HERO_PHOTO = "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80";

export default function Login() {
  const { user, signIn, signUp } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/home" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Email and password required"); return; }
    setBusy(true);
    const fn = mode === "signin" ? signIn : signUp;
    const { error } = await fn(email, password);
    setBusy(false);
    if (error) { toast.error(error); return; }
    toast.success(mode === "signin" ? "Welcome back" : "Account created");
    nav("/home");
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background animate-fade-in">
      {/* Left visual */}
      <div className="relative md:w-1/2 min-h-[300px] md:min-h-screen overflow-hidden">
        <img src={HERO_PHOTO} alt="Modern office" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/85" />
        <div className="relative z-10 h-full flex flex-col justify-between p-8 md:p-12">
          <div className="pill-tag" style={{ background: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.85)" }}>
            HR Analytics Platform
          </div>
          <div className="text-white">
            <h1 className="hero-title text-6xl md:text-7xl lg:text-8xl mb-4" style={{ color: "#fff" }}>Attrix</h1>
            <p className="hero-tagline text-2xl md:text-4xl" style={{ color: "rgba(255,255,255,0.65)" }}>
              Predict. Retain. Grow.
            </p>
            <p className="mt-6 text-sm md:text-base text-white/55 max-w-md">
              Identify employees at risk of leaving before it is too late. Built for modern HR teams.
            </p>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="md:w-1/2 flex items-center justify-center px-6 py-12 md:py-0">
        <div className="w-full max-w-md animate-fade-up">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Welcome Back</h2>
          <p className="mt-2 text-muted-foreground">Sign in to your account</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground tracking-wide">EMAIL</span>
              <div className="mt-1.5 flex items-center gap-2 px-3 rounded-xl border border-border bg-card focus-ring">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="flex-1 bg-transparent outline-none py-3 text-sm"
                  autoComplete="email"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-medium text-muted-foreground tracking-wide">PASSWORD</span>
              <div className="mt-1.5 flex items-center gap-2 px-3 rounded-xl border border-border bg-card focus-ring">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 bg-transparent outline-none py-3 text-sm"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                />
                <button type="button" onClick={() => setShowPwd(s => !s)} className="text-muted-foreground hover:text-foreground transition-colors">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={busy}
              className="group w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-3.5 font-semibold tracking-tight transition-all duration-200 hover:scale-[1.02] disabled:opacity-60"
            >
              {busy ? "Please wait…" : mode === "signin" ? "Login" : "Create account"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>

            <p className="text-center text-xs text-muted-foreground pt-2">
              {mode === "signin" ? (
                <>Need access?{" "}
                  <button type="button" onClick={() => setMode("signup")} className="text-foreground underline-offset-4 hover:underline">
                    Create an account
                  </button>
                </>
              ) : (
                <>Already have an account?{" "}
                  <button type="button" onClick={() => setMode("signin")} className="text-foreground underline-offset-4 hover:underline">
                    Sign in
                  </button>
                </>
              )}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
