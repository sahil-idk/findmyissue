import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface JamFactorBadgeProps {
  jamFactor: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

function getJamFactorInfo(jamFactor: number) {
  if (jamFactor <= 2) {
    return {
      emoji: "🟢",
      label: "Low",
      color: "bg-green-100 text-green-800 border-green-200",
      description: "Great opportunity! Few competitors",
    };
  }
  if (jamFactor <= 4) {
    return {
      emoji: "🟡",
      label: "Moderate",
      color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      description: "Some competition, but manageable",
    };
  }
  if (jamFactor <= 7) {
    return {
      emoji: "🟠",
      label: "High",
      color: "bg-orange-100 text-orange-800 border-orange-200",
      description: "Crowded - consider other options",
    };
  }
  return {
    emoji: "🔴",
    label: "Very High",
    color: "bg-red-100 text-red-800 border-red-200",
    description: "Very crowded - avoid unless highly motivated",
  };
}

export function JamFactorBadge({
  jamFactor,
  showLabel = true,
  size = "md",
}: JamFactorBadgeProps) {
  const info = getJamFactorInfo(jamFactor);

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(info.color, sizeClasses[size], "font-medium")}
          >
            {info.emoji} {showLabel && info.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">Jam Factor: {jamFactor.toFixed(1)}/10</p>
          <p className="text-sm text-muted-foreground">{info.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
