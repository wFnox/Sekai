import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { cn } from "./utils";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

interface ConfirmCtx {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmCtx>({ confirm: async () => false });

interface PendingConfirm extends ConfirmOptions {
  resolve: (val: boolean) => void;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setPending({ ...options, resolve });
    });
  }, []);

  function handleAnswer(val: boolean) {
    pending?.resolve(val);
    setPending(null);
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {pending && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => handleAnswer(false)} />
          <div className="relative z-10 neo-raised rounded-2xl p-6 w-full max-w-sm flex flex-col gap-5 mx-4">
            <div className="flex items-start gap-3">
              <span
                className={cn("material-symbols-outlined flex-shrink-0 mt-0.5", pending.danger ? "text-destructive" : "text-primary")}
                style={{ fontSize: "22px", fontVariationSettings: "'FILL' 1" }}
              >
                {pending.danger ? "warning" : "help"}
              </span>
              <div>
                <h2 className="font-bold text-foreground">{pending.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">{pending.message}</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => handleAnswer(false)}
                className="px-4 py-2 rounded-xl neo-raised text-muted-foreground text-sm font-semibold hover:text-foreground transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={() => handleAnswer(true)}
                className={cn(
                  "px-4 py-2 rounded-xl neo-raised text-sm font-bold transition-opacity hover:opacity-80",
                  pending.danger ? "text-destructive" : "text-primary"
                )}
              >
                {pending.confirmLabel ?? "Bestätigen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  return useContext(ConfirmContext);
}
