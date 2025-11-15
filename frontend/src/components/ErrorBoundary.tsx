import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "2rem",
            color: "white",
            backgroundColor: "#202428",
          }}
        >
          <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Something went wrong</h1>
          <p style={{ marginBottom: "1rem", opacity: 0.8 }}>
            {this.state.error?.message || "An error occurred"}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: undefined });
              window.location.reload();
            }}
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "8px",
              border: "1px solid rgba(99, 255, 0, 0.5)",
              background: "rgba(99, 255, 0, 0.1)",
              color: "#63ff00",
              cursor: "pointer",
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

