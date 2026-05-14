import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ReactNode } from "react";

export const ProtectedRoute = ({ children, role }: { children: ReactNode; role?: "admin" | "company" }) => {
  const { user, loading, role: userRole } = useAuth();
  const loc = useLocation();
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-muted-foreground text-sm tracking-wide">Loading…</div>
    </div>;
  }
  if (!user) return <Navigate to="/login" state={{ from: loc }} replace />;
  if (role && userRole !== role) return <Navigate to="/home" replace />;
  return <>{children}</>;
};
