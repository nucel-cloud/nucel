import { Badge } from "@nucel.cloud/design-system/components/ui/badge";
import { CheckCircle, XCircle, Loader2, Clock, AlertCircle, Ban } from "lucide-react";

interface DeploymentStatusIconProps {
  status: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

const STATUS_CONFIG = {
  ready: {
    icon: CheckCircle,
    color: "text-green-500",
    variant: "default" as const,
    label: "Ready"
  },
  failed: {
    icon: XCircle,
    color: "text-red-500",
    variant: "destructive" as const,
    label: "Failed"
  },
  building: {
    icon: Loader2,
    color: "text-blue-500",
    variant: "secondary" as const,
    label: "Building",
    animate: true
  },
  deploying: {
    icon: Loader2,
    color: "text-blue-500",
    variant: "secondary" as const,
    label: "Deploying",
    animate: true
  },
  pending: {
    icon: Clock,
    color: "text-yellow-500",
    variant: "outline" as const,
    label: "Pending"
  },
  cancelled: {
    icon: Ban,
    color: "text-gray-500",
    variant: "outline" as const,
    label: "Cancelled"
  }
};

const ICON_SIZES = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5"
};

export function DeploymentStatusIcon({ 
  status, 
  showLabel = false, 
  size = "md" 
}: DeploymentStatusIconProps) {
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || {
    icon: AlertCircle,
    color: "text-gray-400",
    variant: "outline" as const,
    label: status
  };

  const Icon = config.icon;
  const iconSize = ICON_SIZES[size];
  const className = `${iconSize} ${config.color} ${config.animate ? 'animate-spin' : ''}`;

  if (showLabel) {
    return (
      <div className="flex items-center gap-1">
        <Icon className={className} />
        <Badge variant={config.variant} className="text-xs">
          {config.label}
        </Badge>
      </div>
    );
  }

  return <Icon className={className} />;
}