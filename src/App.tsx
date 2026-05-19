import { useState } from "react";
import { useAppStore } from "./store";
import { useTheme } from "./useTheme";
import { cn } from "./lib/utils";
import Notenrechner from "./tools/Notenrechner";
import Geldrechner from "./tools/Geldrechner";
import Settings from "./tools/Settings";

// ── Sidebar ───────────────────────────────────────────────────────────────────

type ToolKey = "notenrechner" | "geldrechner" | "einstellungen";

const NAV_TOOLS: { key: ToolKey; label: string; icon: string }[] = [
  { key: "notenrechner", label: "Notenrechner", icon: "school" },
  { key: "geldrechner", label: "Geldrechner", icon: "payments" },
];

const NAV_BOTTOM: { key: ToolKey; label: string; icon: string }[] = [
  { key: "einstellungen", label: "Einstellungen", icon: "settings" },
];

function Sidebar({
  active,
  setActive,
  expanded,
  setExpanded,
}: {
  active: ToolKey;
  setActive: (k: ToolKey) => void;
  expanded: boolean;
  setExpanded: (v: boolean) => void;
}) {
  function NavItem({ item }: { item: (typeof NAV_TOOLS)[number] }) {
    const isActive = active === item.key;
    return (
      <button
        onClick={() => setActive(item.key)}
        title={!expanded ? item.label : undefined}
        className={cn(
          "flex items-center rounded-xl transition-all duration-200 flex-shrink-0",
          expanded ? "w-full px-3 py-2.5 gap-3" : "w-10 h-10 mx-auto justify-center",
          isActive
            ? "neo-pressed text-primary"
            : "text-muted-foreground hover:text-foreground hover:neo-raised-sm"
        )}
      >
        <span
          className="material-symbols-outlined flex-shrink-0"
          style={{ fontSize: "20px", fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
        >
          {item.icon}
        </span>
        <span
          className={cn(
            "text-sm font-medium whitespace-nowrap transition-all duration-200",
            expanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
          )}
        >
          {item.label}
        </span>
      </button>
    );
  }

  return (
    <aside
      className={cn(
        "flex flex-col neo-raised rounded-2xl flex-shrink-0 overflow-hidden transition-all duration-200 ease-in-out",
        expanded ? "w-52" : "w-14"
      )}
    >
      {/* All nav in one unified padding container */}
      <div className="flex flex-col flex-1 px-2 pt-2 gap-1 min-h-0">
        {/* Toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "flex items-center rounded-xl transition-all duration-200 flex-shrink-0 text-muted-foreground hover:text-foreground",
            expanded ? "w-full px-3 py-2 gap-3" : "w-10 h-10 mx-auto justify-center"
          )}
          title={expanded ? "Einklappen" : "Ausklappen"}
        >
          <span
            className="material-symbols-outlined flex-shrink-0 transition-transform duration-200"
            style={{ fontSize: "20px", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            chevron_right
          </span>
          <span
            className={cn(
              "text-xs font-semibold uppercase tracking-widest whitespace-nowrap transition-all duration-200",
              expanded ? "opacity-50" : "opacity-0 w-0 overflow-hidden"
            )}
          >
            Tools
          </span>
        </button>

        {/* Tool nav */}
        <nav className="flex flex-col gap-1 flex-1">
          {NAV_TOOLS.map((item) => (
            <NavItem key={item.key} item={item as (typeof NAV_TOOLS)[number]} />
          ))}
        </nav>

        {/* Bottom nav */}
        <div className="flex flex-col gap-1 border-t border-border pb-2 pt-2">
          {NAV_BOTTOM.map((item) => (
            <NavItem key={item.key} item={item as (typeof NAV_TOOLS)[number]} />
          ))}
        </div>
      </div>
    </aside>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const { ready } = useAppStore();
  useTheme();

  const [active, setActive] = useState<ToolKey>("notenrechner");
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-muted-foreground text-sm">
        Lade...
      </div>
    );
  }

  const toolLabels: Record<ToolKey, string> = {
    notenrechner: "Notenrechner",
    geldrechner: "Geldrechner",
    einstellungen: "Einstellungen",
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden p-4 gap-4">
      <Sidebar
        active={active}
        setActive={setActive}
        expanded={sidebarExpanded}
        setExpanded={setSidebarExpanded}
      />

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 gap-4">
        {/* Breadcrumb header */}
        <header className="neo-raised rounded-2xl px-5 py-3 flex items-center gap-3 flex-shrink-0">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: "20px" }}>
            {active === "notenrechner" ? "school" : active === "geldrechner" ? "payments" : "settings"}
          </span>
          <h1 className="font-semibold text-foreground text-sm">{toolLabels[active]}</h1>
        </header>

        {/* Tool area */}
        <div className="flex flex-1 min-h-0">
          {active === "notenrechner" && <Notenrechner />}
          {active === "geldrechner" && <Geldrechner />}
          {active === "einstellungen" && <Settings />}
        </div>
      </div>
    </div>
  );
}
