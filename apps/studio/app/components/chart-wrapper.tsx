import * as React from "react";
import { ChartAreaInteractive } from "./chart-area-interactive";

export function ChartWrapper() {
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="aspect-auto h-[250px] w-full rounded-lg border bg-card p-6">
        <div className="flex h-full items-center justify-center text-muted-foreground">
          Loading chart...
        </div>
      </div>
    );
  }

  return <ChartAreaInteractive />;
}