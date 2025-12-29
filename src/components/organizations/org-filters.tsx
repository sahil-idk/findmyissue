"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OrganizationFiltersProps {
  technologies: string[];
}

export function OrganizationFilters({ technologies }: OrganizationFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");

  const updateFilters = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/organizations?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleSearch = () => {
    updateFilters("search", search || null);
  };

  const clearFilters = () => {
    setSearch("");
    router.push("/organizations");
  };

  const hasFilters =
    searchParams.has("search") ||
    searchParams.has("technology") ||
    searchParams.has("longevity");

  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap gap-4">
        <div className="flex flex-1 gap-2">
          <Input
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="min-w-[200px]"
          />
          <Button onClick={handleSearch}>Search</Button>
        </div>

        <Select
          value={searchParams.get("technology") || ""}
          onValueChange={(value) =>
            updateFilters("technology", value || null)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Technology" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Technologies</SelectItem>
            {technologies.slice(0, 30).map((tech) => (
              <SelectItem key={tech} value={tech}>
                {tech}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("longevity") || ""}
          onValueChange={(value) => updateFilters("longevity", value || null)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Experience Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Levels</SelectItem>
            <SelectItem value="veteran">Veteran (7+ years)</SelectItem>
            <SelectItem value="experienced">Experienced (3-6 years)</SelectItem>
            <SelectItem value="newcomer">Newcomer (1-2 years)</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
}
