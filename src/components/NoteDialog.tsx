import { useState } from "react";
import type { Note, Semester } from "../types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface Props {
  open: boolean;
  onSave: (note: Note) => void;
  onClose: () => void;
}

export function NoteDialog({ open, onSave, onClose }: Props) {
  const [note, setNote] = useState("");
  const [gewicht, setGewicht] = useState("1");
  const [semester, setSemester] = useState<Semester>("S1");
  const [beschreibung, setBeschreibung] = useState("");
  const [error, setError] = useState("");

  function handleSave() {
    const n = parseFloat(note.replace(",", "."));
    if (isNaN(n) || n < 1 || n > 6) { setError("Note muss zwischen 1.0 und 6.0 liegen."); return; }
    const g = parseFloat(gewicht.replace(",", "."));
    if (isNaN(g) || g <= 0) { setError("Gewichtung muss eine positive Zahl sein."); return; }
    onSave({ note: n, gewicht: g, semester, beschreibung: beschreibung.trim() });
    setNote(""); setGewicht("1"); setSemester("S1"); setBeschreibung(""); setError("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Note hinzufügen</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <label className="text-sm text-muted-foreground">Note (1.0 – 6.0)</label>
            <Input value={note} onChange={(e) => { setNote(e.target.value); setError(""); }} placeholder="4.5" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <label className="text-sm text-muted-foreground">Gewichtung</label>
              <Input value={gewicht} onChange={(e) => { setGewicht(e.target.value); setError(""); }} placeholder="1" />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm text-muted-foreground">Semester</label>
              <Select value={semester} onValueChange={(v) => setSemester(v as Semester)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="S1">S1</SelectItem>
                  <SelectItem value="S2">S2</SelectItem>
                  <SelectItem value="Ganzes Jahr">Ganzes Jahr</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <label className="text-sm text-muted-foreground">Beschreibung (optional)</label>
            <Input value={beschreibung} onChange={(e) => setBeschreibung(e.target.value)} placeholder="z.B. Prüfung 1" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Abbrechen</Button>
          <Button onClick={handleSave}>Hinzufügen</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
