import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface LongevityBadgeProps {
  badge: "newcomer" | "experienced" | "veteran" | string;
  years?: number;
  size?: "sm" | "md" | "lg";
}

function getBadgeInfo(badge: string, years?: number) {
  switch (badge) {
    case "veteran":
      return {
        emoji: "🏆",
        label: "Veteran",
        color: "bg-purple-100 text-purple-800 border-purple-200",
        description: `${years || "7+"}+ years in GSoC - Highly established organization`,
      };
    case "experienced":
      return {
        emoji: "⭐",
        label: "Experienced",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        description: `${years || "3-6"} years in GSoC - Well-established organization`,
      };
    case "newcomer":
    default:
      return {
        emoji: "🌱",
        label: "Newcomer",
        color: "bg-green-100 text-green-800 border-green-200",
        description: `${years || "1-2"} years in GSoC - New to the program`,
      };
  }
}

export function LongevityBadge({
  badge,
  years,
  size = "md",
}: LongevityBadgeProps) {
  const info = getBadgeInfo(badge, years);

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
            {info.emoji} {info.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{info.label} Organization</p>
          <p className="text-sm text-muted-foreground">{info.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
