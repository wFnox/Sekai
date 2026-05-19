import { useState, useEffect } from "react";
import { useAppStore, weightedAvg, neededGrade, exportCsv } from "../store";
import { FachDialog } from "../components/FachDialog";
import { NoteDialog } from "../components/NoteDialog";
import { cn } from "../lib/utils";
import { useToast } from "../lib/toast";
import { useConfirm } from "../lib/confirm";
import type { Semester } from "../types";

type SortField = "note" | "gewicht" | "semester";
type SortDir = "asc" | "desc";

const PASS = 4.0;

function GradeBadge({ value }: { value: number }) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center w-10 h-10 rounded-xl neo-raised-sm font-bold text-sm",
        value >= 5 ? "text-green-500" : value >= PASS ? "text-primary" : "text-destructive"
      )}
    >
      {value.toFixed(1)}
    </div>
  );
}

export default function Notenrechner() {
  const { data, addFach, deleteFach, updateZiel, addNote, deleteNote } = useAppStore();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const [selected, setSelected] = useState<string | null>(null);
  const [semFilter, setSemFilter] = useState<string>("Alle");
  const [calcWeight, setCalcWeight] = useState("1");
  const [calcResult, setCalcResult] = useState<{ text: string; type: "ok" | "warn" | "good" } | null>(null);
  const [showAddFach, setShowAddFach] = useState(false);
  const [showEditZiel, setShowEditZiel] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [selNote, setSelNote] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("note");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const faecher = data.faecher;
  const fachInfo = selected ? faecher[selected] : null;

  const filteredNoten = fachInfo
    ? (semFilter === "Alle" ? fachInfo.noten : fachInfo.noten.filter((n) => n.semester === (semFilter as Semester)))
        .filter((n) => !search || n.beschreibung.toLowerCase().includes(search.toLowerCase()) || String(n.note).includes(search))
        .slice()
        .sort((a, b) => {
          const mul = sortDir === "asc" ? 1 : -1;
          if (sortField === "note") return (a.note - b.note) * mul;
          if (sortField === "gewicht") return (a.gewicht - b.gewicht) * mul;
          return a.semester.localeCompare(b.semester) * mul;
        })
    : [];

  async function handleDeleteFach() {
    if (!selected) return;
    const ok = await confirm({ title: "Fach löschen", message: `"${selected}" und alle Noten wirklich löschen?`, confirmLabel: "Löschen", danger: true });
    if (ok) { deleteFach(selected); setSelected(null); toast("Fach gelöscht"); }
  }

  async function handleDeleteNote() {
    if (selNote === null || !selected) return;
    const ok = await confirm({ title: "Note löschen", message: "Diese Note wirklich löschen?", confirmLabel: "Löschen", danger: true });
    if (ok) { deleteNote(selected, selNote); setSelNote(null); toast("Note gelöscht"); }
  }

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Delete" && selNote !== null) handleDeleteNote();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selNote, selected]);

  function handleCalc() {
    if (!fachInfo || !selected) return;
    const w = parseFloat(calcWeight.replace(",", "."));
    if (isNaN(w) || w <= 0) {
      setCalcResult({ text: "Ungültige Gewichtung.", type: "warn" });
      return;
    }
    const n = neededGrade(filteredNoten, fachInfo.ziel, w);
    if (n > 6)
      setCalcResult({ text: `Ziel ${fachInfo.ziel.toFixed(1)} nicht mehr erreichbar (bräuchtest ${n.toFixed(2)})`, type: "warn" });
    else if (n < 1)
      setCalcResult({ text: `Ziel ${fachInfo.ziel.toFixed(1)} bereits sicher! (bräuchtest nur ${n.toFixed(2)})`, type: "good" });
    else
      setCalcResult({ text: `Du brauchst mindestens ${n.toFixed(2)} (Gewicht ×${w})`, type: "ok" });
  }

  const allAvg = fachInfo ? weightedAvg(fachInfo.noten) : null;
  const filtAvg = filteredNoten.length ? weightedAvg(filteredNoten) : null;

  return (
    <div className="flex flex-1 gap-4 min-h-0">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col neo-raised rounded-2xl overflow-hidden">
        <div className="px-5 pt-5 pb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: "20px", fontVariationSettings: "'FILL' 1" }}>
            menu_book
          </span>
          <h2 className="font-bold text-foreground">Fächer</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-2 space-y-1">
          {Object.entries(faecher).map(([name, info]) => {
            const avg = weightedAvg(info.noten);
            const isActive = selected === name;
            const fail = avg !== null && avg < PASS;
            return (
              <button
                key={name}
                onClick={() => { setSelected(name); setCalcResult(null); setSelNote(null); }}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all",
                  isActive ? "neo-pressed" : "hover:neo-raised-sm"
                )}
              >
                <div
                  className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0",
                    isActive ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                  )}
                >
                  {name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn("font-medium text-sm truncate", isActive ? "text-primary" : "text-foreground")}>{name}</p>
                  <p className={cn("text-xs", fail ? "text-destructive" : "text-muted-foreground")}>
                    Schnitt: {avg != null ? avg.toFixed(2) : "–"}
                  </p>
                </div>
              </button>
            );
          })}
          {Object.keys(faecher).length === 0 && (
            <p className="text-xs text-muted-foreground px-3 py-2">Kein Fach vorhanden</p>
          )}
        </div>

        <div className="p-3 border-t border-border flex gap-2">
          <button
            onClick={() => setShowAddFach(true)}
            className="flex-1 py-2.5 px-3 rounded-xl neo-raised text-primary font-medium text-sm flex items-center justify-center gap-1.5 hover:opacity-80 transition-opacity"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
            Fach
          </button>
          <button
            onClick={handleDeleteFach}
            disabled={!selected}
            className="py-2.5 px-3 rounded-xl neo-raised text-destructive flex items-center justify-center hover:opacity-80 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>delete</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto flex flex-col gap-4 min-w-0 px-0.5 pt-0.5 pb-2">
        {!selected || !fachInfo ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground min-h-0">
            <span className="material-symbols-outlined opacity-20" style={{ fontSize: "64px" }}>menu_book</span>
            <p className="text-sm">Wähle ein Fach aus oder erstelle ein neues.</p>
            <button
              onClick={() => setShowAddFach(true)}
              className="px-5 py-2.5 rounded-xl neo-raised text-primary font-medium text-sm flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
              Fach hinzufügen
            </button>
          </div>
        ) : (
          <>
            <div className="neo-raised rounded-2xl p-6 flex items-center justify-between gap-4 flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl neo-pressed flex items-center justify-center text-primary text-xl font-bold flex-shrink-0">
                  {selected.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{selected}</h2>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-0.5 flex-wrap">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>calendar_month</span>
                      {semFilter === "Alle" ? "Alle Semester" : semFilter === "S1" ? "Semester 1" : semFilter === "S2" ? "Semester 2" : semFilter}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>flag</span>
                      Ziel: {fachInfo.ziel.toFixed(1)}
                    </span>
                    {allAvg !== null && (
                      <span className={cn("font-medium", allAvg >= fachInfo.ziel ? "text-green-500" : "text-destructive")}>
                        {allAvg >= fachInfo.ziel
                          ? `+${(allAvg - fachInfo.ziel).toFixed(2)} über Ziel`
                          : `${(fachInfo.ziel - allAvg).toFixed(2)} unter Ziel`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowEditZiel(true)}
                className="px-4 py-2 rounded-xl neo-raised text-muted-foreground font-medium text-sm flex items-center gap-2 hover:text-primary transition-colors flex-shrink-0"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "17px" }}>edit</span>
                Ziel ändern
              </button>
            </div>

            <div className="neo-raised rounded-2xl p-6 flex flex-col gap-5 flex-shrink-0">
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-xs">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" style={{ fontSize: "17px" }}>search</span>
                  <input
                    type="text"
                    placeholder="Suchen..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full neo-pressed rounded-xl py-2 pl-9 pr-4 text-sm text-foreground border-none focus:outline-none bg-background"
                  />
                </div>
              <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground hidden sm:block">Semester:</span>
                  <div className="relative">
                    <select
                      value={semFilter}
                      onChange={(e) => { setSemFilter(e.target.value); setCalcResult(null); }}
                      className="appearance-none neo-pressed rounded-xl py-2 pl-4 pr-9 text-sm text-foreground font-medium focus:outline-none border-none cursor-pointer bg-background"
                    >
                      <option value="Alle">Alle</option>
                      <option value="S1">Semester 1</option>
                      <option value="S2">Semester 2</option>
                      <option value="Ganzes Jahr">Ganzes Jahr</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" style={{ fontSize: "18px" }}>
                      arrow_drop_down
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => exportCsv(data).catch(console.error)}
                  className="px-4 py-2 rounded-xl neo-raised text-muted-foreground font-medium text-sm flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "17px" }}>download</span>
                  CSV exportieren
                </button>
              </div>

              <div className="neo-pressed rounded-xl overflow-hidden">
                {filteredNoten.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <span className="material-symbols-outlined opacity-40" style={{ fontSize: "40px" }}>note_stack</span>
                    <p className="text-sm">Keine Noten vorhanden.</p>
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-muted-foreground text-xs font-semibold border-b border-border/40">
                        <th className="py-4 px-5 w-12 text-center">#</th>
                        {(["note", "gewicht", "semester"] as SortField[]).map((f) => (
                          <th key={f} className="py-4 px-5 cursor-pointer hover:text-foreground transition-colors" onClick={() => toggleSort(f)}>
                            <span className="flex items-center gap-1">
                              {f === "note" ? "Note" : f === "gewicht" ? "Gewicht" : "Semester"}
                              {sortField === f && <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>{sortDir === "asc" ? "arrow_upward" : "arrow_downward"}</span>}
                            </span>
                          </th>
                        ))}
                        <th className="py-4 px-5">Beschreibung</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredNoten.map((n, i) => {
                        const realIdx = fachInfo.noten.indexOf(n);
                        const isSel = selNote === realIdx;
                        return (
                          <tr
                            key={i}
                            onClick={() => setSelNote(isSel ? null : realIdx)}
                            className={cn(
                              "border-b border-border/20 cursor-pointer transition-colors text-sm",
                              isSel ? "bg-primary/5" : "hover:bg-secondary/30"
                            )}
                          >
                            <td className="py-3.5 px-5 text-center text-muted-foreground text-xs">{i + 1}</td>
                            <td className="py-3.5 px-5"><GradeBadge value={n.note} /></td>
                            <td className="py-3.5 px-5 text-muted-foreground">{n.gewicht}</td>
                            <td className="py-3.5 px-5 text-muted-foreground">
                              {n.semester === "S1" ? "Semester 1" : n.semester === "S2" ? "Semester 2" : n.semester}
                            </td>
                            <td className="py-3.5 px-5 text-muted-foreground truncate max-w-xs">{n.beschreibung || "–"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowAddNote(true)}
                    className="px-5 py-2.5 rounded-xl neo-raised text-primary font-bold text-sm flex items-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
                    Note hinzufügen
                  </button>
                  <button
                    onClick={handleDeleteNote}
                    disabled={selNote === null}
                    className={cn(
                      "px-5 py-2.5 rounded-xl neo-raised text-destructive font-medium text-sm flex items-center gap-2 transition-opacity",
                      selNote === null ? "opacity-40 cursor-not-allowed" : "hover:opacity-80"
                    )}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>delete</span>
                    Note löschen
                    {selNote !== null && <span className="text-xs text-muted-foreground ml-1">(Entf)</span>}
                  </button>
                </div>
                {filtAvg != null && (
                  <div className="flex items-center gap-3 neo-pressed px-5 py-2.5 rounded-2xl">
                    <span className="text-muted-foreground font-medium text-sm">Aktueller Schnitt:</span>
                    <span className={cn("text-2xl font-bold", filtAvg >= PASS ? "text-primary" : "text-destructive")}>
                      {filtAvg.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="neo-raised rounded-2xl p-6 flex-shrink-0">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: "20px" }}>calculate</span>
                Benötigte Note berechnen
              </h3>
              <div className="flex items-end gap-4 flex-wrap">
                <div className="flex-1 min-w-40 max-w-xs">
                  <label className="block text-sm text-muted-foreground mb-2">Gewichtung der nächsten Note:</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={calcWeight}
                    onChange={(e) => setCalcWeight(e.target.value)}
                    className="w-full neo-pressed rounded-xl py-3 px-4 text-foreground font-medium border-none focus:outline-none text-sm bg-background"
                  />
                </div>
                <button
                  onClick={handleCalc}
                  className="px-7 py-3 rounded-xl neo-raised text-primary font-bold text-sm hover:opacity-80 transition-opacity"
                >
                  Berechnen
                </button>
              </div>
              {calcResult && (
                <div
                  className={cn(
                    "mt-4 p-4 rounded-xl neo-pressed flex items-start gap-3",
                    calcResult.type === "warn" ? "bg-destructive/5" : calcResult.type === "good" ? "bg-green-500/5" : "bg-primary/5"
                  )}
                >
                  <span
                    className={cn(
                      "material-symbols-outlined flex-shrink-0",
                      calcResult.type === "warn" ? "text-destructive" : calcResult.type === "good" ? "text-green-500" : "text-primary"
                    )}
                    style={{ fontSize: "20px" }}
                  >
                    info
                  </span>
                  <p className="text-sm text-foreground">{calcResult.text}</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <FachDialog
        open={showAddFach}
        title="Neues Fach"
        onSave={(name, ziel) => { addFach(name, ziel); setSelected(name); }}
        onClose={() => setShowAddFach(false)}
      />
      {selected && fachInfo && (
        <FachDialog
          open={showEditZiel}
          title="Wunschnote ändern"
          initialName={selected}
          initialZiel={fachInfo.ziel}
          nameReadonly
          onSave={(_, ziel) => updateZiel(selected, ziel)}
          onClose={() => setShowEditZiel(false)}
        />
      )}
      <NoteDialog
        open={showAddNote}
        onSave={(note) => { if (selected) addNote(selected, note); }}
        onClose={() => setShowAddNote(false)}
      />
    </div>
  );
}
