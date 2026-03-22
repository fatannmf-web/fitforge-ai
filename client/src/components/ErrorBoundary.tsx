import { Component, type ReactNode } from "react";
import { SplashScreen } from "./SplashScreen";

interface Props { children: ReactNode; }
interface State { hasError: boolean; error?: string; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, info: any) {
    console.error("[FitForge] App crash:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return <SplashScreen error={this.state.error || "Eroare necunoscută"} />;
    }
    return this.props.children;
  }
}
