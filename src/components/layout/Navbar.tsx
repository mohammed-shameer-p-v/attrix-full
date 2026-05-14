import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "./ThemeToggle";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

const adminLinks = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/companies", label: "Companies" },
  { to: "/predict", label: "Predict" },
  { to: "/workforce", label: "Workforce" },
  { to: "/settings", label: "Settings" },
];

const companyLinks = [
  { to: "/home", label: "Home" },
  { to: "/predict", label: "Predict" },
  { to: "/workforce", label: "Workforce" },
  { to: "/about", label: "About" },
  { to: "/profile", label: "Profile" },
];

export const Navbar = () => {
  const { role, signOut } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const links = role === "admin" ? adminLinks : companyLinks;

  const handleLogout = async () => {
    await signOut();
    nav("/login");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link to={role === "admin" ? "/dashboard" : "/home"} className="flex items-center gap-2 group">
          <span className="font-display font-bold text-xl tracking-tight">Attrix</span>
          {role === "admin" && (
            <span className="text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full bg-destructive/15 text-destructive border border-destructive/30">
              Admin
            </span>
          )}
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-foreground/10 text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all duration-200"
          >
            <LogOut className="h-3.5 w-3.5" /> Logout
          </button>
          <ThemeToggle />
          <button
            onClick={() => setOpen(o => !o)}
            className="md:hidden h-9 w-9 grid place-items-center rounded-full border border-border"
            aria-label="Menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background animate-fade-in">
          <div className="container py-3 flex flex-col gap-1">
            {links.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive ? "bg-foreground/10 text-foreground" : "text-muted-foreground"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <button
              onClick={handleLogout}
              className="text-left px-3 py-2 rounded-lg text-sm font-medium text-destructive"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
