import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

type Role = "admin" | "company" | null;

interface AuthCtx {
  user: User | null;
  session: Session | null;
  role: Role;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

  const loadRole = async (uid: string) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    if (!data || data.length === 0) { setRole("company"); return; }
    if (data.some(r => r.role === "admin")) setRole("admin");
    else setRole("company");
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        setTimeout(() => loadRole(sess.user.id), 0);
      } else {
        setRole(null);
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) loadRole(session.user.id);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { display_name: displayName ?? email.split("@")[0] },
      },
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => { await supabase.auth.signOut(); };

  return (
    <Ctx.Provider value={{ user, session, role, loading, signIn, signUp, signOut }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be inside AuthProvider");
  return v;
};
