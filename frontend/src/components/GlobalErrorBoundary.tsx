import React from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // In a production app, log this to Sentry or a similar service.
    console.error("Global Error Boundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    // Basic reset strategy: reload the window
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background px-4 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 mb-6">
            <AlertTriangle className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="mb-2 text-2xl font-extrabold text-foreground tracking-tight">
            Oops! Something went wrong.
          </h1>
          <p className="mb-8 max-w-md text-sm text-muted-foreground">
            We've encountered an unexpected error. Please try refreshing the page or check back later.
          </p>
          
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white transition-transform hover:scale-105 active:scale-95 shadow-sm"
          >
            <RefreshCcw size={16} />
            Refresh Page
          </button>

          {/* Development only error stack */}
          {import.meta.env.DEV && this.state.error && (
            <div className="mt-12 w-full max-w-2xl rounded-xl bg-gray-900 p-4 text-left shadow-lg overflow-auto">
              <p className="font-mono text-xs text-red-400 font-bold mb-2">
                {this.state.error.toString()}
              </p>
              <pre className="font-mono text-[10px] text-gray-300 whitespace-pre-wrap">
                {this.state.error.stack}
              </pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
