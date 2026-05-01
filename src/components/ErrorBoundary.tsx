import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props { children: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center gap-4">
          <div className="text-6xl">⚠️</div>
          <h2 className="text-xl font-bold font-amiri text-destructive">حدث خطأ غير متوقع</h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            {this.state.error?.message || "يرجى إعادة تحميل الصفحة أو العودة للرئيسية"}
          </p>
          <div className="flex gap-3">
            <Button onClick={() => window.location.reload()}>🔄 إعادة التحميل</Button>
            <Button variant="outline" onClick={() => { this.setState({ hasError: false }); window.location.href = "/dashboard"; }}>
              🏠 الرئيسية
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
