import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { cn } from "./utils";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastCtx {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastCtx>({ toast: () => {} });

let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = ++counter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "neo-raised rounded-xl px-4 py-3 flex items-center gap-3 text-sm font-medium pointer-events-auto",
              "animate-in slide-in-from-bottom-2 fade-in duration-200",
              t.type === "error" && "border border-destructive/20",
              t.type === "success" && "border border-primary/20"
            )}
          >
            <span
              className={cn(
                "material-symbols-outlined flex-shrink-0",
                t.type === "success" && "text-primary",
                t.type === "error" && "text-destructive",
                t.type === "info" && "text-muted-foreground"
              )}
              style={{ fontSize: "18px", fontVariationSettings: "'FILL' 1" }}
            >
              {t.type === "success" ? "check_circle" : t.type === "error" ? "error" : "info"}
            </span>
            <span className="text-foreground">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
