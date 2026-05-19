import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface Props {
  open: boolean;
  title: string;
  initialName?: string;
  initialZiel?: number;
  nameReadonly?: boolean;
  onSave: (name: string, ziel: number) => void;
  onClose: () => void;
}

export function FachDialog({ open, title, initialName = "", initialZiel = 5.0, nameReadonly, onSave, onClose }: Props) {
  const [name, setName] = useState(initialName);
  const [ziel, setZiel] = useState(String(initialZiel));
  const [error, setError] = useState("");

  function handleSave() {
    if (!name.trim()) { setError("Fachname darf nicht leer sein."); return; }
    const z = parseFloat(ziel.replace(",", "."));
    if (isNaN(z) || z < 1 || z > 6) { setError("Wunschnote muss zwischen 1.0 und 6.0 liegen."); return; }
    onSave(name.trim(), z);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <label className="text-sm text-muted-foreground">Fachname</label>
            <Input
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              readOnly={nameReadonly}
              placeholder="z.B. Mathematik"
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-sm text-muted-foreground">Wunschnote (1.0 – 6.0)</label>
            <Input
              value={ziel}
              onChange={(e) => { setZiel(e.target.value); setError(""); }}
              placeholder="5.0"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Abbrechen</Button>
          <Button onClick={handleSave}>Speichern</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
