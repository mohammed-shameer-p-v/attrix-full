import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function Index() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center bg-background text-muted-foreground text-sm">Loading…</div>;
  return <Navigate to={user ? "/home" : "/login"} replace />;
}
