"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface IssueFiltersProps {
  organizations: { slug: string; name: string }[];
}

export function IssueFilters({ organizations }: IssueFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilters = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/issues?${params.toString()}`);
    },
    [router, searchParams]
  );

  const clearFilters = () => {
    router.push("/issues");
  };

  const hasFilters =
    searchParams.has("organization") ||
    searchParams.has("maxJamFactor") ||
    searchParams.has("minScore") ||
    searchParams.has("difficulty") ||
    searchParams.has("hasBeginnerLabel");

  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-center gap-4">
        <Select
          value={searchParams.get("organization") || ""}
          onValueChange={(value) => updateFilters("organization", value || null)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Organization" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Organizations</SelectItem>
            {organizations.map((org) => (
              <SelectItem key={org.slug} value={org.slug}>
                {org.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("maxJamFactor") || ""}
          onValueChange={(value) => updateFilters("maxJamFactor", value || null)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Competition Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any Competition</SelectItem>
            <SelectItem value="2">Low (0-2)</SelectItem>
            <SelectItem value="4">Moderate (0-4)</SelectItem>
            <SelectItem value="7">High (0-7)</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("minScore") || ""}
          onValueChange={(value) => updateFilters("minScore", value || null)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Min Score" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any Score</SelectItem>
            <SelectItem value="8">Excellent (8+)</SelectItem>
            <SelectItem value="6">Good (6+)</SelectItem>
            <SelectItem value="4">Fair (4+)</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("difficulty") || ""}
          onValueChange={(value) => updateFilters("difficulty", value || null)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any Difficulty</SelectItem>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center space-x-2">
          <Switch
            id="beginner-only"
            checked={searchParams.get("hasBeginnerLabel") === "true"}
            onCheckedChange={(checked) =>
              updateFilters("hasBeginnerLabel", checked ? "true" : null)
            }
          />
          <Label htmlFor="beginner-only" className="cursor-pointer">
            Good First Issues Only
          </Label>
        </div>

        {hasFilters && (
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        )}
      </div>

      <div className="text-sm text-muted-foreground">
        <span className="font-medium">Tip:</span> Look for issues with{" "}
        <span className="text-green-600">low jam factor</span> and{" "}
        <span className="text-blue-600">high opportunity score</span> for the
        best chances of getting your contribution accepted.
      </div>
    </div>
  );
}
