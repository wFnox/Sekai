import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background text-foreground p-8">
          <p className="text-lg font-semibold text-destructive">Ein Fehler ist aufgetreten</p>
          <pre className="max-w-lg rounded bg-secondary p-4 text-xs text-muted-foreground overflow-auto">
            {this.state.error.message}
          </pre>
          <button
            className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground"
            onClick={() => this.setState({ error: null })}
          >
            Neu laden
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
