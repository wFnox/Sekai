import { invoke } from "@tauri-apps/api/core";
import { useState, useEffect, useCallback } from "react";
import type { GeldData, Eintrag, WiederkehrendVorlage, GeldEinstellungen } from "./types";
import { DEFAULT_GELD_EINSTELLUNGEN } from "./types";

function emptyGeldData(): GeldData {
  return {
    eintraege: [],
    budgets: {},
    wiederkehrend: [],
    wiederkehrend_monate: [],
    einstellungen: { ...DEFAULT_GELD_EINSTELLUNGEN },
  };
}

export function useGeldStore() {
  const [data, setData] = useState<GeldData>(emptyGeldData());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    invoke<GeldData>("load_geld_data")
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setReady(true));
  }, []);

  const update = useCallback((fn: (d: GeldData) => GeldData) => {
    setData((prev) => {
      const next = fn(structuredClone(prev));
      invoke("save_geld_data", { data: next }).catch(console.error);
      return next;
    });
  }, []);

  function addEintrag(e: Omit<Eintrag, "wiederkehrend">, isWiederkehrend: boolean) {
    update((d) => {
      const eintrag: Eintrag = { ...e, wiederkehrend: isWiederkehrend };
      d.eintraege.push(eintrag);
      if (isWiederkehrend) {
        const vorlage: WiederkehrendVorlage = { typ: e.typ, betrag: e.betrag, beschreibung: e.beschreibung, kategorie: e.kategorie };
        d.wiederkehrend.push(vorlage);
      }
      return d;
    });
  }

  function deleteEintrag(idx: number) {
    update((d) => { d.eintraege.splice(idx, 1); return d; });
  }

  function setBudget(kategorie: string, betrag: number) {
    update((d) => { d.budgets[kategorie] = betrag; return d; });
  }

  function deleteBudget(kategorie: string) {
    update((d) => { delete d.budgets[kategorie]; return d; });
  }

  function deleteWiederkehrend(idx: number) {
    update((d) => { d.wiederkehrend.splice(idx, 1); return d; });
  }

  function saveEinstellungen(e: GeldEinstellungen) {
    update((d) => { d.einstellungen = e; return d; });
  }

  return { data, ready, addEintrag, deleteEintrag, setBudget, deleteBudget, deleteWiederkehrend, saveEinstellungen };
}

export async function exportGeldCsv(data: GeldData): Promise<void> {
  const csv = await invoke<string>("export_geld_csv", { data });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "finanzen.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function budgetPeriodeStart(starttag: number): string {
  const today = new Date();
  const tag = Math.max(1, Math.min(28, starttag));
  if (today.getDate() >= tag) {
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(tag).padStart(2, "0")}`;
  }
  const d = new Date(today.getFullYear(), today.getMonth() - 1, tag);
  return d.toISOString().slice(0, 10);
}
