import type { ReactNode } from "react";
import { TooltipProvider } from "@nucel.cloud/design-system/components/ui/tooltip";

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return <TooltipProvider>{children}</TooltipProvider>;
}
