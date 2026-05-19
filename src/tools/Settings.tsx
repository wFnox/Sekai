import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getVersion } from "@tauri-apps/api/app";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useTheme, THEME_META, type Theme } from "../useTheme";
import { cn } from "../lib/utils";

type UpdateStatus = "idle" | "checking" | "available" | "up-to-date" | "installing" | "error";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const themes = Object.entries(THEME_META) as [Theme, (typeof THEME_META)[Theme]][];
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>("idle");
  const [updateError, setUpdateError] = useState("");
  const [appVersion, setAppVersion] = useState("...");

  useEffect(() => {
    getVersion().then(setAppVersion).catch(() => setAppVersion("—"));
  }, []);

  async function checkUpdate() {
    setUpdateStatus("checking");
    setUpdateError("");
    try {
      const available = await invoke<boolean>("check_for_updates");
      setUpdateStatus(available ? "available" : "up-to-date");
    } catch (e) {
      const msg = String(e);
      // No release published yet → treat as up to date
      if (msg.includes("fetch") || msg.includes("JSON") || msg.includes("404") || msg.includes("remote")) {
        setUpdateStatus("up-to-date");
      } else {
        setUpdateError(msg);
        setUpdateStatus("error");
      }
    }
  }

  async function installUpdate() {
    setUpdateStatus("installing");
    try {
      await invoke("install_update");
    } catch (e) {
      setUpdateError(String(e));
      setUpdateStatus("error");
    }
  }

  return (
    <div className="flex-1 flex flex-col gap-6 p-6 overflow-y-auto">
      <div>
        <h2 className="text-lg font-bold text-foreground">Einstellungen</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Aussehen, Updates und App-Informationen.</p>
      </div>

      <div className="neo-raised rounded-2xl p-6 flex flex-col gap-5 max-w-2xl">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: "20px" }}>
            palette
          </span>
          Farbschema
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="neo-raised rounded-2xl p-6 flex flex-col gap-4 max-w-2xl">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: "20px" }}>
            info
          </span>
          Über die App
        </h3>
        <div className="flex flex-col divide-y divide-border">
          {[
            { label: "Version", value: `v${appVersion}` },
            { label: "Lizenz", value: "Alle Rechte vorbehalten" },
            { label: "Entwickler", value: "Noah Buchs" },
            { label: "Design", value: "Gabriel Lukic" },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <span className="text-sm text-muted-foreground">{label}</span>
              <span className="text-sm font-medium text-primary">{value}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-3 pt-1">
          <button
            onClick={() => openUrl("https://github.com/wFnox/Sekai/issues")}
            className="flex-1 neo-raised-sm rounded-xl px-4 py-2.5 text-sm font-semibold text-foreground hover:opacity-90 transition-all"
          >
            Hilfe &amp; Support
          </button>
        </div>
      </div>

      <div className="neo-raised rounded-2xl p-6 flex flex-col gap-4 max-w-2xl">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: "20px" }}>
            system_update
          </span>
          Updates
        </h3>
        <div className="flex items-center gap-4">
          <button
            onClick={updateStatus === "available" ? installUpdate : checkUpdate}
            disabled={updateStatus === "checking" || updateStatus === "installing"}
            className={cn(
              "neo-raised-sm rounded-xl px-4 py-2 text-sm font-semibold text-foreground transition-all",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "enabled:hover:opacity-90 enabled:active:neo-pressed"
            )}
          >
            {updateStatus === "checking" && "Prüfe..."}
            {updateStatus === "installing" && "Installiere..."}
            {updateStatus === "available" && "Jetzt installieren"}
            {(updateStatus === "idle" || updateStatus === "up-to-date" || updateStatus === "error") && "Auf Updates prüfen"}
          </button>
          {updateStatus === "up-to-date" && (
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: "16px", fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              App ist aktuell
            </span>
          )}
          {updateStatus === "available" && (
            <span className="text-sm text-primary font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined" style={{ fontSize: "16px", fontVariationSettings: "'FILL' 1" }}>new_releases</span>
              Update verfügbar!
            </span>
          )}
          {updateStatus === "error" && (
            <span className="text-sm text-destructive">{updateError || "Fehler beim Prüfen"}</span>
          )}
        </div>
      </div>
    </div>
  );
}
