import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@nucel.cloud/design-system/components/ui/alert";
import { cn } from "@nucel.cloud/design-system/lib/utils";
import { X } from "lucide-react";

type ToastProps = {
  message: string;
  type?: "success" | "error" | "info" | "warning";
  description?: string;
};

export function Toast({ message, type = "info", description }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  const variants = {
    success: "border-green-500 bg-green-50 text-green-900 dark:bg-green-900/20 dark:text-green-400",
    error: "border-destructive bg-destructive/10 text-destructive",
    warning: "border-yellow-500 bg-yellow-50 text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-400",
    info: "border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-400",
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2">
      <Alert className={cn("relative w-96", variants[type])}>
        <AlertDescription className="pr-8">
          <div className="font-medium">{message}</div>
          {description && <div className="mt-1 text-sm opacity-90">{description}</div>}
        </AlertDescription>
        <button
          onClick={() => setIsVisible(false)}
          className="absolute right-2 top-2 rounded-md p-1 hover:bg-black/5 dark:hover:bg-white/5"
        >
          <X className="h-4 w-4" />
        </button>
      </Alert>
    </div>
  );
}
