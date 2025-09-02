import { ReactNode } from 'react';
import { Toaster } from './components/ui/sonner';
import { TooltipProvider } from './components/ui/tooltip';

type DesignSystemProviderProperties = {
    children: ReactNode,
};

export const DesignSystemProvider = ({
  children,
}: DesignSystemProviderProperties) => (
  <>
    <TooltipProvider>{children}</TooltipProvider>
    <Toaster />
  </>
);
