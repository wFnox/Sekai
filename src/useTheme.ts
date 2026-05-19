import { useState, useEffect } from "react";

export type Theme = "silk" | "dark" | "gruvbox" | "aero" | "sage" | "dusk" | "evil" | "pastel";

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
  aero: {
    label: "Aero",
    bg: "#EEF1FF",
    primary: "#B1B2FF",
    description: "Sanftes Blau-Lavendel",
  },
  sage: {
    label: "Sage",
    bg: "#F8EDE3",
    primary: "#798777",
    description: "Natürlich, warm, grün",
  },
  dusk: {
    label: "Dusk",
    bg: "#355C7D",
    primary: "#F67280",
    description: "Dunkler Sonnenuntergang",
  },
  evil: {
    label: "Evil",
    bg: "#000000",
    primary: "#FF0000",
    description: "Dunkel, rot, intensiv",
  },
  pastel: {
    label: "Pastel",
    bg: "#F1F1F6",
    primary: "#BE9FE1",
    description: "Weiches Lila, verspielt",
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
