"use client";

// Boardly — ErrorBoundary: catches render errors in client components
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode; fallback?: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Boardly error boundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-muted/20 p-8 text-center">
          <p className="text-sm font-medium text-destructive">Something went wrong</p>
          <p className="text-xs text-muted-foreground">{this.state.error?.message}</p>
          <Button size="sm" variant="outline" onClick={() => this.setState({ hasError: false, error: null })}>
            Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
