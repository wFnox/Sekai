import { useState, useEffect } from "react";

export type Theme = "silk" | "dark" | "gruvbox";

export const THEME_META: Record<Theme, { label: string; bg: string; primary: string; description: string }> = {
  silk: {
    label: "Silk",
    bg: "#e8eaf0",
    primary: "#6366f1",
    description: "Hell, weich, neomorphisch",
  },
  dark: {
    label: "Dark",
    bg: "#242837",
    primary: "#818cf8",
    description: "Dunkles neomorphisches Design",
  },
  gruvbox: {
    label: "Gruvbox",
    bg: "#282828",
    primary: "#d79921",
    description: "Warme Retro-Palette",
  },
};

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    const initial = saved && saved in THEME_META ? saved : "silk";
    document.documentElement.setAttribute("data-theme", initial);
    return initial;
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  function setTheme(t: Theme) {
    setThemeState(t);
  }

  return { theme, setTheme };
}
