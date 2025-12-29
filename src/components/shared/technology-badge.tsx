import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TechnologyBadgeProps {
  technology: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

// Color mapping for common technologies
const techColors: Record<string, string> = {
  python: "bg-blue-100 text-blue-800 border-blue-200",
  javascript: "bg-yellow-100 text-yellow-800 border-yellow-200",
  typescript: "bg-blue-100 text-blue-800 border-blue-200",
  java: "bg-orange-100 text-orange-800 border-orange-200",
  "c++": "bg-purple-100 text-purple-800 border-purple-200",
  c: "bg-gray-100 text-gray-800 border-gray-200",
  go: "bg-cyan-100 text-cyan-800 border-cyan-200",
  rust: "bg-orange-100 text-orange-800 border-orange-200",
  ruby: "bg-red-100 text-red-800 border-red-200",
  php: "bg-indigo-100 text-indigo-800 border-indigo-200",
  swift: "bg-orange-100 text-orange-800 border-orange-200",
  kotlin: "bg-purple-100 text-purple-800 border-purple-200",
  scala: "bg-red-100 text-red-800 border-red-200",
  react: "bg-cyan-100 text-cyan-800 border-cyan-200",
  vue: "bg-green-100 text-green-800 border-green-200",
  angular: "bg-red-100 text-red-800 border-red-200",
  node: "bg-green-100 text-green-800 border-green-200",
  nodejs: "bg-green-100 text-green-800 border-green-200",
  django: "bg-green-100 text-green-800 border-green-200",
  flask: "bg-gray-100 text-gray-800 border-gray-200",
  docker: "bg-blue-100 text-blue-800 border-blue-200",
  kubernetes: "bg-blue-100 text-blue-800 border-blue-200",
  aws: "bg-orange-100 text-orange-800 border-orange-200",
  tensorflow: "bg-orange-100 text-orange-800 border-orange-200",
  pytorch: "bg-red-100 text-red-800 border-red-200",
  "machine learning": "bg-purple-100 text-purple-800 border-purple-200",
  ai: "bg-purple-100 text-purple-800 border-purple-200",
};

function getTechColor(tech: string): string {
  const normalized = tech.toLowerCase().replace(/\s+/g, "");
  return techColors[normalized] || "bg-slate-100 text-slate-800 border-slate-200";
}

export function TechnologyBadge({
  technology,
  size = "md",
  className,
}: TechnologyBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-0.5",
    lg: "text-base px-2.5 py-1",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        getTechColor(technology),
        sizeClasses[size],
        "font-medium",
        className
      )}
    >
      {technology}
    </Badge>
  );
}
