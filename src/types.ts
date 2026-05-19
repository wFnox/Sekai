export type Semester = "S1" | "S2" | "Ganzes Jahr";

export interface Note {
  note: number;
  gewicht: number;
  semester: Semester;
  beschreibung: string;
}

export interface Fach {
  ziel: number;
  noten: Note[];
}

export interface AppData {
  faecher: Record<string, Fach>;
}

// ── Geldrechner ──────────────────────────────────────────────────────────────

export interface Eintrag {
  datum: string;       // ISO date "YYYY-MM-DD"
  typ: "Einnahme" | "Ausgabe";
  betrag: number;
  beschreibung: string;
  kategorie: string;
  wiederkehrend: boolean;
}

export interface WiederkehrendVorlage {
  typ: "Einnahme" | "Ausgabe";
  betrag: number;
  beschreibung: string;
  kategorie: string;
}

export interface GeldData {
  eintraege: Eintrag[];
  budgets: Record<string, number>;
  wiederkehrend: WiederkehrendVorlage[];
  wiederkehrend_monate: string[];
  einstellungen: GeldEinstellungen;
}

export interface GeldEinstellungen {
  waehrung: string;
  budget_starttag: number;
  kategorien: { Einnahme: string[]; Ausgabe: string[] };
}

export const DEFAULT_GELD_EINSTELLUNGEN: GeldEinstellungen = {
  waehrung: "CHF",
  budget_starttag: 1,
  kategorien: {
    Einnahme: ["Gehalt", "Freelance", "Geschenk", "Nebenjob", "Sonstiges"],
    Ausgabe: ["Lebensmittel", "Miete", "Transport", "Freizeit", "Gesundheit", "Kleidung", "Abonnement", "Sonstiges"],
  },
};
