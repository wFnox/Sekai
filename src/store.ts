import { invoke } from "@tauri-apps/api/core";
import { useState, useEffect, useCallback } from "react";
import type { AppData, Note } from "./types";

export function useAppStore() {
  const [data, setData] = useState<AppData>({ faecher: {} });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    invoke<AppData>("load_data")
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setReady(true));
  }, []);

  const update = useCallback((fn: (d: AppData) => AppData) => {
    setData((prev) => {
      const next = fn(structuredClone(prev));
      invoke("save_data", { data: next }).catch(console.error);
      return next;
    });
  }, []);

  const addFach = useCallback(
    (name: string, ziel: number) => {
      update((d) => {
        d.faecher[name] = { ziel, noten: [] };
        return d;
      });
    },
    [update]
  );

  const deleteFach = useCallback(
    (name: string) => {
      update((d) => {
        delete d.faecher[name];
        return d;
      });
    },
    [update]
  );

  const updateZiel = useCallback(
    (name: string, ziel: number) => {
      update((d) => {
        d.faecher[name].ziel = ziel;
        return d;
      });
    },
    [update]
  );

  const addNote = useCallback(
    (fach: string, note: Note) => {
      update((d) => {
        d.faecher[fach].noten.push(note);
        return d;
      });
    },
    [update]
  );

  const deleteNote = useCallback(
    (fach: string, index: number) => {
      update((d) => {
        d.faecher[fach].noten.splice(index, 1);
        return d;
      });
    },
    [update]
  );

  return { data, ready, addFach, deleteFach, updateZiel, addNote, deleteNote };
}

export function weightedAvg(noten: Note[]): number | null {
  if (!noten.length) return null;
  const tw = noten.reduce((s, n) => s + n.gewicht, 0);
  if (tw === 0) return null;
  return noten.reduce((s, n) => s + n.note * n.gewicht, 0) / tw;
}

export function neededGrade(noten: Note[], target: number, weight: number): number {
  const tw = noten.reduce((s, n) => s + n.gewicht, 0);
  const ws = noten.reduce((s, n) => s + n.note * n.gewicht, 0);
  return (target * (tw + weight) - ws) / weight;
}

export async function exportCsv(data: AppData): Promise<void> {
  const csv = await invoke<string>("export_csv", { data });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "noten_export.csv";
  a.click();
  URL.revokeObjectURL(url);
}
