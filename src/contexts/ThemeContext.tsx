import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "dark" | "light";
interface ThemeCtx { theme: Theme; toggle: () => void; setTheme: (t: Theme) => void; }

const Ctx = createContext<ThemeCtx | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";
    const stored = localStorage.getItem("attrix-theme") as Theme | null;
    return stored ?? "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "light");
    root.classList.add(theme);
    localStorage.setItem("attrix-theme", theme);
  }, [theme]);

  return (
    <Ctx.Provider value={{ theme, toggle: () => setThemeState(t => t === "dark" ? "light" : "dark"), setTheme: setThemeState }}>
      {children}
    </Ctx.Provider>
  );
};

export const useTheme = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useTheme must be used inside ThemeProvider");
  return v;
};
