import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export const ThemeToggle = () => {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="relative h-9 w-9 grid place-items-center rounded-full border border-border bg-card/40 hover:bg-card transition-all duration-300 hover:scale-105"
    >
      <Sun className={`absolute h-4 w-4 transition-all duration-300 ${theme === "dark" ? "opacity-0 -rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"}`} />
      <Moon className={`absolute h-4 w-4 transition-all duration-300 ${theme === "dark" ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-50"}`} />
    </button>
  );
};
