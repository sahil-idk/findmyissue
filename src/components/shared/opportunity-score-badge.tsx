import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface OpportunityScoreBadgeProps {
  score: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

function getScoreInfo(score: number) {
  if (score >= 8) {
    return {
      label: "Excellent",
      color: "bg-green-100 text-green-800 border-green-200",
      description: "Highly recommended opportunity",
    };
  }
  if (score >= 6) {
    return {
      label: "Good",
      color: "bg-blue-100 text-blue-800 border-blue-200",
      description: "Solid opportunity worth considering",
    };
  }
  if (score >= 4) {
    return {
      label: "Fair",
      color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      description: "Decent opportunity, some concerns",
    };
  }
  return {
    label: "Low",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    description: "Consider looking for better options",
  };
}

export function OpportunityScoreBadge({
  score,
  showLabel = true,
  size = "md",
}: OpportunityScoreBadgeProps) {
  const info = getScoreInfo(score);

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
            {score.toFixed(1)} {showLabel && `- ${info.label}`}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">Opportunity Score: {score.toFixed(1)}/10</p>
          <p className="text-sm text-muted-foreground">{info.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
