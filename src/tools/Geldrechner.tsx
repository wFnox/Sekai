import { useState, useMemo } from "react";
import { useGeldStore, exportGeldCsv, budgetPeriodeStart } from "../geldStore";
import { cn } from "../lib/utils";
import type { Eintrag } from "../types";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from "recharts";

// ── Helpers ───────────────────────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatBetrag(n: number, waehrung: string) {
  return `${n.toFixed(2)} ${waehrung}`;
}

const MONATSNAMEN = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

// ── Summary card ──────────────────────────────────────────────────────────────

function SummaryCard({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  return (
    <div className="neo-raised rounded-2xl p-5 flex items-center gap-4 flex-1 min-w-0">
      <div className={cn("w-11 h-11 rounded-xl neo-pressed flex items-center justify-center flex-shrink-0", color)}>
        <span className="material-symbols-outlined" style={{ fontSize: "22px", fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-base font-bold text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}

// ── Add entry dialog ──────────────────────────────────────────────────────────

function AddEintragDialog({ open, kategorien, onSave, onClose }: {
  open: boolean;
  kategorien: { Einnahme: string[]; Ausgabe: string[] };
  onSave: (e: Omit<Eintrag, "wiederkehrend">, wieder: boolean) => void;
  onClose: () => void;
}) {
  const [typ, setTyp] = useState<"Einnahme" | "Ausgabe">("Ausgabe");
  const [betrag, setBetrag] = useState("");
  const [beschreibung, setBeschreibung] = useState("");
  const [kategorie, setKategorie] = useState(kategorien.Ausgabe[0] ?? "Sonstiges");
  const [datum, setDatum] = useState(today());
  const [wieder, setWieder] = useState(false);
  const [error, setError] = useState("");

  const kats = kategorien[typ];

  function handleTypChange(t: "Einnahme" | "Ausgabe") {
    setTyp(t);
    setKategorie(kategorien[t][0] ?? "Sonstiges");
  }

  function handleSave() {
    const b = parseFloat(betrag.replace(",", "."));
    if (isNaN(b) || b <= 0) { setError("Bitte einen gültigen Betrag eingeben."); return; }
    onSave({ datum, typ, betrag: b, beschreibung: beschreibung.trim() || "–", kategorie }, wieder);
    setBetrag(""); setBeschreibung(""); setError(""); setWieder(false);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 neo-raised rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-foreground text-lg">Neuer Eintrag</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>close</span>
          </button>
        </div>

        {/* Typ toggle */}
        <div className="flex rounded-xl neo-pressed p-1 gap-1">
          {(["Ausgabe", "Einnahme"] as const).map((t) => (
            <button
              key={t}
              onClick={() => handleTypChange(t)}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-semibold transition-all",
                typ === t
                  ? t === "Einnahme" ? "neo-raised text-green-500" : "neo-raised text-destructive"
                  : "text-muted-foreground"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Betrag</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={betrag}
              onChange={(e) => setBetrag(e.target.value)}
              className="w-full neo-pressed rounded-xl py-2.5 px-4 text-foreground border-none focus:outline-none text-sm bg-background"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Kategorie</label>
            <div className="relative">
              <select
                value={kategorie}
                onChange={(e) => setKategorie(e.target.value)}
                className="w-full appearance-none neo-pressed rounded-xl py-2.5 pl-4 pr-9 text-sm text-foreground border-none focus:outline-none bg-background cursor-pointer"
              >
                {kats.map((k) => <option key={k}>{k}</option>)}
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" style={{ fontSize: "18px" }}>arrow_drop_down</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Beschreibung</label>
            <input
              type="text"
              placeholder="Optional"
              value={beschreibung}
              onChange={(e) => setBeschreibung(e.target.value)}
              className="w-full neo-pressed rounded-xl py-2.5 px-4 text-foreground border-none focus:outline-none text-sm bg-background"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Datum</label>
            <input
              type="date"
              value={datum}
              onChange={(e) => setDatum(e.target.value)}
              className="w-full neo-pressed rounded-xl py-2.5 px-4 text-foreground border-none focus:outline-none text-sm bg-background"
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setWieder(!wieder)}
              className={cn(
                "w-10 h-6 rounded-full transition-colors relative flex-shrink-0",
                wieder ? "bg-primary" : "neo-pressed"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 rounded-full transition-all",
                wieder ? "left-5 bg-white" : "left-1 bg-muted-foreground"
              )} />
            </div>
            <span className="text-sm text-foreground">Monatlich wiederkehrend</span>
          </label>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <button
          onClick={handleSave}
          className="w-full py-3 rounded-xl neo-raised text-primary font-bold text-sm hover:opacity-80 transition-opacity"
        >
          Hinzufügen
        </button>
      </div>
    </div>
  );
}

// ── Tab: Einträge ─────────────────────────────────────────────────────────────

function EintraegeTab() {
  const { data, deleteEintrag, addEintrag } = useGeldStore();
  const [showAdd, setShowAdd] = useState(false);
  const [selIdx, setSelIdx] = useState<number | null>(null);
  const [filterTyp, setFilterTyp] = useState("Alle");
  const [filterKat, setFilterKat] = useState("Alle");
  const [filterMonat, setFilterMonat] = useState("Alle");
  const [suche, setSuche] = useState("");

  const { eintraege, einstellungen } = data;
  const w = einstellungen.waehrung;

  const monate = useMemo(() =>
    [...new Set(eintraege.map((e) => e.datum.slice(0, 7)))].sort().reverse(),
    [eintraege]
  );
  const kategorien = useMemo(() => {
    const all = [...einstellungen.kategorien.Einnahme, ...einstellungen.kategorien.Ausgabe];
    return [...new Set(all)].sort();
  }, [einstellungen]);

  const filtered = useMemo(() => {
    return eintraege
      .map((e, i) => ({ e, i }))
      .filter(({ e }) => {
        if (filterTyp !== "Alle" && e.typ !== filterTyp) return false;
        if (filterKat !== "Alle" && e.kategorie !== filterKat) return false;
        if (filterMonat !== "Alle" && !e.datum.startsWith(filterMonat)) return false;
        if (suche && !e.beschreibung.toLowerCase().includes(suche.toLowerCase()) && !e.kategorie.toLowerCase().includes(suche.toLowerCase())) return false;
        return true;
      })
      .reverse();
  }, [eintraege, filterTyp, filterKat, filterMonat, suche]);

  const monatEinnahmen = useMemo(() => {
    const m = new Date().toISOString().slice(0, 7);
    return eintraege.filter((e) => e.typ === "Einnahme" && e.datum.startsWith(m)).reduce((s, e) => s + e.betrag, 0);
  }, [eintraege]);
  const monatAusgaben = useMemo(() => {
    const m = new Date().toISOString().slice(0, 7);
    return eintraege.filter((e) => e.typ === "Ausgabe" && e.datum.startsWith(m)).reduce((s, e) => s + e.betrag, 0);
  }, [eintraege]);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Summary row */}
      <div className="flex gap-3 flex-wrap flex-shrink-0">
        <SummaryCard label="Einnahmen (Monat)" value={formatBetrag(monatEinnahmen, w)} icon="trending_up" color="text-green-500" />
        <SummaryCard label="Ausgaben (Monat)" value={formatBetrag(monatAusgaben, w)} icon="trending_down" color="text-destructive" />
        <SummaryCard
          label="Bilanz (Monat)"
          value={formatBetrag(monatEinnahmen - monatAusgaben, w)}
          icon="account_balance_wallet"
          color={monatEinnahmen - monatAusgaben >= 0 ? "text-primary" : "text-destructive"}
        />
      </div>

      {/* Filter bar */}
      <div className="neo-raised rounded-2xl px-4 py-3 flex items-center gap-3 flex-wrap flex-shrink-0">
        <input
          type="text"
          placeholder="Suche..."
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
          className="neo-pressed rounded-xl py-2 px-4 text-sm text-foreground border-none focus:outline-none bg-background w-40"
        />
        {[
          { label: "Typ", val: filterTyp, set: setFilterTyp, opts: ["Alle", "Einnahme", "Ausgabe"] },
          { label: "Kategorie", val: filterKat, set: setFilterKat, opts: ["Alle", ...kategorien] },
          { label: "Monat", val: filterMonat, set: setFilterMonat, opts: ["Alle", ...monate] },
        ].map(({ label, val, set, opts }) => (
          <div key={label} className="relative">
            <select
              value={val}
              onChange={(e) => set(e.target.value)}
              className="appearance-none neo-pressed rounded-xl py-2 pl-3 pr-8 text-sm text-foreground border-none focus:outline-none bg-background cursor-pointer"
            >
              {opts.map((o) => <option key={o}>{o}</option>)}
            </select>
            <span className="material-symbols-outlined absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" style={{ fontSize: "16px" }}>arrow_drop_down</span>
          </div>
        ))}
        <button
          onClick={() => { setSuche(""); setFilterTyp("Alle"); setFilterKat("Alle"); setFilterMonat("Alle"); }}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-2"
        >
          Zurücksetzen
        </button>
        <div className="flex-1" />
        <button
          onClick={() => exportGeldCsv(data).catch(console.error)}
          className="px-4 py-2 rounded-xl neo-raised text-muted-foreground font-medium text-sm flex items-center gap-2 hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "17px" }}>download</span>
          CSV
        </button>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 rounded-xl neo-raised text-primary font-bold text-sm flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
          Eintrag
        </button>
      </div>

      {/* Table */}
      <div className="neo-raised rounded-2xl flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="overflow-y-auto flex-1">
          {filtered.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground py-16">
              <span className="material-symbols-outlined opacity-20" style={{ fontSize: "48px" }}>receipt_long</span>
              <p className="text-sm">Keine Einträge gefunden.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-background z-10">
                <tr className="text-muted-foreground text-xs font-semibold border-b border-border/40">
                  <th className="py-4 px-5">Datum</th>
                  <th className="py-4 px-5">Typ</th>
                  <th className="py-4 px-5">Kategorie</th>
                  <th className="py-4 px-5">Betrag</th>
                  <th className="py-4 px-5">Beschreibung</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(({ e, i }) => {
                  const isSel = selIdx === i;
                  return (
                    <tr
                      key={i}
                      onClick={() => setSelIdx(isSel ? null : i)}
                      className={cn(
                        "border-b border-border/20 cursor-pointer transition-colors text-sm",
                        isSel ? "bg-primary/5" : "hover:bg-secondary/30"
                      )}
                    >
                      <td className="py-3 px-5 text-muted-foreground text-xs">{e.datum}</td>
                      <td className="py-3 px-5">
                        <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-lg", e.typ === "Einnahme" ? "text-green-500 bg-green-500/10" : "text-destructive bg-destructive/10")}>
                          {e.typ}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-muted-foreground text-xs">{e.kategorie}</td>
                      <td className={cn("py-3 px-5 font-semibold text-sm", e.typ === "Einnahme" ? "text-green-500" : "text-destructive")}>
                        {e.typ === "Einnahme" ? "+" : "−"}{formatBetrag(e.betrag, w)}
                      </td>
                      <td className="py-3 px-5 text-muted-foreground truncate max-w-xs">{e.beschreibung}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        {selIdx !== null && (
          <div className="border-t border-border px-5 py-3 flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => { deleteEintrag(selIdx); setSelIdx(null); }}
              className="px-4 py-2 rounded-xl neo-raised text-destructive font-medium text-sm flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "17px" }}>delete</span>
              Eintrag löschen
            </button>
            <span className="text-xs text-muted-foreground">Eintrag #{selIdx + 1} ausgewählt</span>
          </div>
        )}
      </div>

      <AddEintragDialog
        open={showAdd}
        kategorien={einstellungen.kategorien}
        onSave={addEintrag}
        onClose={() => setShowAdd(false)}
      />
    </div>
  );
}

// ── Tab: Bilanzverlauf ────────────────────────────────────────────────────────

function BilanzverlaufTab() {
  const { data } = useGeldStore();
  const { eintraege, einstellungen } = data;
  const w = einstellungen.waehrung;

  const chartData = useMemo(() => {
    let bilanz = 0;
    return [{ idx: 0, bilanz: 0 }, ...eintraege.map((e, i) => {
      bilanz += e.typ === "Einnahme" ? e.betrag : -e.betrag;
      return { idx: i + 1, bilanz: parseFloat(bilanz.toFixed(2)) };
    })];
  }, [eintraege]);

  const total = chartData[chartData.length - 1]?.bilanz ?? 0;

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex gap-3 flex-wrap flex-shrink-0">
        <SummaryCard
          label="Gesamtbilanz"
          value={formatBetrag(total, w)}
          icon={total >= 0 ? "trending_up" : "trending_down"}
          color={total >= 0 ? "text-green-500" : "text-destructive"}
        />
        <SummaryCard label="Einträge gesamt" value={String(eintraege.length)} icon="receipt_long" color="text-primary" />
      </div>

      <div className="neo-raised rounded-2xl p-6 flex-1 min-h-0">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: "18px" }}>show_chart</span>
          Bilanzverlauf
        </h3>
        {eintraege.length < 2 ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
            Noch zu wenig Einträge für eine Grafik.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.4} />
              <XAxis dataKey="idx" tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} tickLine={false} axisLine={false} label={{ value: "Einträge", position: "insideBottom", offset: -2, fill: "var(--color-muted-foreground)", fontSize: 11 }} />
              <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v} ${w}`} width={80} />
              <Tooltip
                contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "12px", color: "var(--color-foreground)", fontSize: 12 }}
                formatter={(v) => [formatBetrag(Number(v), w), "Bilanz"]}
              />
              <ReferenceLine y={0} stroke="var(--color-border)" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="bilanz" stroke="var(--color-primary)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "var(--color-primary)" }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

// ── Tab: Monatsansicht ────────────────────────────────────────────────────────

function MonatsansichtTab() {
  const { data } = useGeldStore();
  const { eintraege, einstellungen } = data;
  const w = einstellungen.waehrung;

  const jahre = useMemo(() => {
    const ys = [...new Set(eintraege.map((e) => e.datum.slice(0, 4)))].sort().reverse();
    return ys.length > 0 ? ys : [String(new Date().getFullYear())];
  }, [eintraege]);

  const [jahr, setJahr] = useState(() => jahre[0]);

  const chartData = useMemo(() => {
    return MONATSNAMEN.map((name, idx) => {
      const prefix = `${jahr}-${String(idx + 1).padStart(2, "0")}`;
      const ein = eintraege.filter((e) => e.typ === "Einnahme" && e.datum.startsWith(prefix)).reduce((s, e) => s + e.betrag, 0);
      const aus = eintraege.filter((e) => e.typ === "Ausgabe" && e.datum.startsWith(prefix)).reduce((s, e) => s + e.betrag, 0);
      return { name, Einnahmen: parseFloat(ein.toFixed(2)), Ausgaben: parseFloat(aus.toFixed(2)), Bilanz: parseFloat((ein - aus).toFixed(2)) };
    });
  }, [eintraege, jahr]);

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="neo-raised rounded-2xl p-6 flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: "18px" }}>bar_chart</span>
            Monatsübersicht
          </h3>
          <div className="relative">
            <select
              value={jahr}
              onChange={(e) => setJahr(e.target.value)}
              className="appearance-none neo-pressed rounded-xl py-2 pl-4 pr-8 text-sm text-foreground border-none focus:outline-none bg-background cursor-pointer"
            >
              {jahre.map((y) => <option key={y}>{y}</option>)}
            </select>
            <span className="material-symbols-outlined absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" style={{ fontSize: "16px" }}>arrow_drop_down</span>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.4} />
              <XAxis dataKey="name" tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}`} width={55} />
              <Tooltip
                contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "12px", color: "var(--color-foreground)", fontSize: 12 }}
                formatter={(v, name) => [formatBetrag(Number(v), w), String(name)]}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: "var(--color-muted-foreground)", paddingTop: "8px" }} />
              <Bar dataKey="Einnahmen" fill="#22c55e" opacity={0.8} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Ausgaben" fill="var(--color-destructive)" opacity={0.8} radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="Bilanz" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 3, fill: "var(--color-primary)" }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Budget-Ziele ─────────────────────────────────────────────────────────

function BudgetTab() {
  const { data, setBudget, deleteBudget } = useGeldStore();
  const { eintraege, budgets, einstellungen } = data;
  const w = einstellungen.waehrung;

  const [kat, setKat] = useState("");
  const [betrag, setBetragStr] = useState("");
  const [error, setError] = useState("");

  const alleKats = useMemo(() => {
    return [...new Set([...einstellungen.kategorien.Einnahme, ...einstellungen.kategorien.Ausgabe])].sort();
  }, [einstellungen]);

  const periodeStart = budgetPeriodeStart(einstellungen.budget_starttag);

  const ausgabenPeriode = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of eintraege) {
      if (e.typ === "Ausgabe" && e.datum >= periodeStart) {
        map[e.kategorie] = (map[e.kategorie] ?? 0) + e.betrag;
      }
    }
    return map;
  }, [eintraege, periodeStart]);

  function handleSave() {
    const b = parseFloat(betrag.replace(",", "."));
    if (!kat) { setError("Bitte eine Kategorie wählen."); return; }
    if (isNaN(b) || b <= 0) { setError("Bitte einen gültigen Betrag eingeben."); return; }
    setBudget(kat, b);
    setBetragStr(""); setKat(""); setError("");
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Add budget */}
      <div className="neo-raised rounded-2xl p-5 flex items-end gap-3 flex-wrap flex-shrink-0">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Kategorie</label>
          <div className="relative">
            <select
              value={kat}
              onChange={(e) => setKat(e.target.value)}
              className="appearance-none neo-pressed rounded-xl py-2.5 pl-4 pr-9 text-sm text-foreground border-none focus:outline-none bg-background cursor-pointer"
            >
              <option value="">Wählen...</option>
              {alleKats.map((k) => <option key={k}>{k}</option>)}
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" style={{ fontSize: "16px" }}>arrow_drop_down</span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Budget ({w}/Periode)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={betrag}
            onChange={(e) => setBetragStr(e.target.value)}
            className="neo-pressed rounded-xl py-2.5 px-4 text-foreground border-none focus:outline-none text-sm bg-background w-36"
          />
        </div>
        <button
          onClick={handleSave}
          className="px-5 py-2.5 rounded-xl neo-raised text-primary font-bold text-sm hover:opacity-80 transition-opacity"
        >
          Speichern
        </button>
        {error && <p className="text-xs text-destructive w-full">{error}</p>}
      </div>

      {/* Budget list */}
      <div className="neo-raised rounded-2xl flex-1 overflow-hidden min-h-0 flex flex-col"><div className="overflow-y-auto flex-1">
        {Object.keys(budgets).length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground py-16">
            <span className="material-symbols-outlined opacity-20" style={{ fontSize: "48px" }}>savings</span>
            <p className="text-sm">Noch keine Budget-Ziele definiert.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-background">
              <tr className="text-muted-foreground text-xs font-semibold border-b border-border/40">
                <th className="py-4 px-5">Kategorie</th>
                <th className="py-4 px-5">Budget</th>
                <th className="py-4 px-5">Ausgaben (Periode)</th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5" />
              </tr>
            </thead>
            <tbody>
              {Object.entries(budgets).sort().map(([k, b]) => {
                const aus = ausgabenPeriode[k] ?? 0;
                const pct = b > 0 ? (aus / b) * 100 : 0;
                const { label, color } = pct >= 100
                  ? { label: `Überschritten (${pct.toFixed(0)}%)`, color: "text-destructive" }
                  : pct >= 80
                  ? { label: `Achtung: ${pct.toFixed(0)}% verbraucht`, color: "text-yellow-500" }
                  : { label: `OK (${pct.toFixed(0)}% verbraucht)`, color: "text-green-500" };
                return (
                  <tr key={k} className="border-b border-border/20 text-sm">
                    <td className="py-3.5 px-5 font-medium text-foreground">{k}</td>
                    <td className="py-3.5 px-5 text-muted-foreground">{formatBetrag(b, w)}</td>
                    <td className="py-3.5 px-5 text-muted-foreground">{formatBetrag(aus, w)}</td>
                    <td className={cn("py-3.5 px-5 font-semibold text-xs", color)}>
                      <div className="flex flex-col gap-1">
                        <span>{label}</span>
                        <div className="w-32 h-1.5 rounded-full bg-border overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all", pct >= 100 ? "bg-destructive" : pct >= 80 ? "bg-yellow-500" : "bg-green-500")}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <button onClick={() => deleteBudget(k)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>delete</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div></div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const TABS = [
  { key: "eintraege", label: "Einträge", icon: "receipt_long" },
  { key: "bilanz", label: "Bilanzverlauf", icon: "show_chart" },
  { key: "monat", label: "Monatsansicht", icon: "bar_chart" },
  { key: "budget", label: "Budget-Ziele", icon: "savings" },
] as const;

type GeldTab = (typeof TABS)[number]["key"];

export default function Geldrechner() {
  const { ready } = useGeldStore();
  const [tab, setTab] = useState<GeldTab>("eintraege");

  if (!ready) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">Lade...</div>
    );
  }

  return (
    <div className="flex flex-col flex-1 gap-4 min-h-0">
      {/* Inner tab bar */}
      <div className="flex gap-1 neo-raised rounded-2xl p-1.5 flex-shrink-0 w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
              tab === t.key ? "neo-pressed text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "17px", fontVariationSettings: tab === t.key ? "'FILL' 1" : "'FILL' 0" }}
            >
              {t.icon}
            </span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0">
        {tab === "eintraege" && <EintraegeTab />}
        {tab === "bilanz" && <BilanzverlaufTab />}
        {tab === "monat" && <MonatsansichtTab />}
        {tab === "budget" && <BudgetTab />}
      </div>
    </div>
  );
}
