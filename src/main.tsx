import React from "react";
import ReactDOM from "react-dom/client";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { primaryMonitor, LogicalSize } from "@tauri-apps/api/window";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ToastProvider } from "./lib/toast";
import { ConfirmProvider } from "./lib/confirm";
import "./index.css";

async function setupWindow() {
  try {
    const monitor = await primaryMonitor();
    if (!monitor) return;
    const { width, height } = monitor.size;
    const win = getCurrentWindow();
    const w = Math.min(Math.max(Math.round(width * 0.72), 900), 1600);
    const h = Math.min(Math.max(Math.round(height * 0.72), 640), 1100);
    await win.setSize(new LogicalSize(w, h));
    await win.center();
  } catch {}
}

setupWindow();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <ConfirmProvider>
          <App />
        </ConfirmProvider>
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
