import { useTheme, THEME_META, type Theme } from "../useTheme";
import { cn } from "../lib/utils";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const themes = Object.entries(THEME_META) as [Theme, (typeof THEME_META)[Theme]][];

  return (
    <div className="flex-1 flex flex-col gap-6 p-6 overflow-y-auto">
      <div>
        <h2 className="text-lg font-bold text-foreground">Einstellungen</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Passe das Aussehen der App an.</p>
      </div>

      <div className="neo-raised rounded-2xl p-6 flex flex-col gap-5 max-w-2xl">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: "20px" }}>
            palette
          </span>
          Farbschema
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {themes.map(([key, meta]) => {
            const isActive = theme === key;
            return (
              <button
                key={key}
                onClick={() => setTheme(key)}
                className={cn(
                  "flex flex-col gap-3 p-4 rounded-2xl text-left transition-all",
                  isActive ? "neo-pressed" : "neo-raised hover:opacity-90"
                )}
              >
                <div
                  className="w-full h-16 rounded-xl flex items-end gap-1.5 p-2.5"
                  style={{ backgroundColor: meta.bg }}
                >
                  <div className="w-5 h-5 rounded-md" style={{ backgroundColor: meta.primary, opacity: 0.9 }} />
                  <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: meta.primary, opacity: 0.3 }} />
                  <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: meta.primary, opacity: 0.15 }} />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm text-foreground">{meta.label}</p>
                    <p className="text-xs text-muted-foreground">{meta.description}</p>
                  </div>
                  {isActive && (
                    <span
                      className="material-symbols-outlined text-primary flex-shrink-0"
                      style={{ fontSize: "20px", fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
