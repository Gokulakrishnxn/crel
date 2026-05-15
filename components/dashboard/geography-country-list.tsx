"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardDescription,
  DashboardCardHeader,
  DashboardCardTitle,
} from "@/components/dashboard/dashboard-card";
import { Input } from "@/components/ui/input";
import { getCountryFlag, getCountryName } from "@/lib/geography/country-labels";
import type { BreakdownRow } from "@/lib/types";
import { cn } from "@/lib/utils";

export function GeographyCountryList({ countries }: { countries: BreakdownRow[] }) {
  const [query, setQuery] = useState("");

  const total = useMemo(
    () => countries.reduce((sum, row) => sum + row.value, 0),
    [countries]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter((row) => {
      const name = getCountryName(row.label).toLowerCase();
      return name.includes(q) || row.label.toLowerCase().includes(q);
    });
  }, [countries, query]);

  const maxValue = countries[0]?.value ?? 1;

  return (
    <DashboardCard className="flex min-h-0 min-w-0 flex-col lg:max-h-[520px]">
      <DashboardCardHeader>
        <DashboardCardTitle>Countries</DashboardCardTitle>
        <DashboardCardDescription>
          Ranked by sessions in the selected period.
        </DashboardCardDescription>
        <div className="relative pt-2">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search country…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 rounded-lg pl-9 text-[14px]"
          />
        </div>
      </DashboardCardHeader>
      <DashboardCardContent className="min-h-0 flex-1 overflow-hidden p-0 sm:p-0">
        <ul className="max-h-[360px] overflow-y-auto px-2 pb-3 sm:max-h-[400px] sm:px-3">
          {filtered.length === 0 ? (
            <li className="px-3 py-8 text-center text-[13px] text-muted-foreground">
              {query ? "No countries match your search" : "No country data"}
            </li>
          ) : (
            filtered.map((row, index) => {
              const share = total ? (row.value / total) * 100 : 0;
              const barWidth = maxValue ? (row.value / maxValue) * 100 : 0;

              return (
                <li
                  key={row.label}
                  className="rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50 sm:px-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 shrink-0 text-center text-[11px] tabular-nums text-muted-foreground">
                      {index + 1}
                    </span>
                    <span className="text-lg leading-none" aria-hidden>
                      {getCountryFlag(row.label)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-[14px] font-medium">
                          {getCountryName(row.label)}
                        </p>
                        <p className="shrink-0 text-[13px] tabular-nums text-muted-foreground">
                          {row.value.toLocaleString()}
                        </p>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn("h-full rounded-full bg-primary transition-all")}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {share.toFixed(1)}% of traffic
                      </p>
                    </div>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </DashboardCardContent>
    </DashboardCard>
  );
}
