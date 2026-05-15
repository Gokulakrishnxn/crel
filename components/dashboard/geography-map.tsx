"use client";

import { useMemo } from "react";
import WorldMap, { type ISOCode } from "react-svg-worldmap";
import { useTheme } from "next-themes";
import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardDescription,
  DashboardCardHeader,
  DashboardCardTitle,
} from "@/components/dashboard/dashboard-card";
import { toMapCountryCode } from "@/lib/geography/country-labels";
import type { BreakdownRow } from "@/lib/types";

export function GeographyMap({ countries }: { countries: BreakdownRow[] }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const mapData = useMemo(
    () =>
      countries
        .map((row) => {
          const code = toMapCountryCode(row.label);
          if (!code) return null;
          return { country: code as ISOCode, value: row.value };
        })
        .filter(
          (item): item is { country: ISOCode; value: number } => item !== null
        ),
    [countries]
  );

  const maxValue = mapData.reduce((max, item) => Math.max(max, item.value), 0);
  const totalSessions = countries.reduce((sum, row) => sum + row.value, 0);

  return (
    <DashboardCard className="flex min-w-0 flex-col overflow-hidden">
      <DashboardCardHeader>
        <DashboardCardTitle>Visitor map</DashboardCardTitle>
        <DashboardCardDescription>
          Session density by country. Darker blue = more traffic.
        </DashboardCardDescription>
      </DashboardCardHeader>
      <DashboardCardContent className="space-y-4">
        <div className="overflow-hidden rounded-xl border border-border/50 bg-muted/20 p-2 sm:p-4">
          {mapData.length === 0 ? (
            <div className="flex h-[220px] items-center justify-center text-[13px] text-muted-foreground sm:h-[280px]">
              No country data for this period
            </div>
          ) : (
            <WorldMap
              data={mapData}
              size="responsive"
              color={isDark ? "#0a84ff" : "#0071e3"}
              valueSuffix=" sessions"
              backgroundColor="transparent"
              borderColor={isDark ? "#3a3a3c" : "#d2d2d7"}
              tooltipBgColor="var(--popover)"
              tooltipTextColor="var(--popover-foreground)"
              strokeOpacity={0.4}
              frame={false}
              richInteraction
              styleFunction={({ countryValue, minValue, maxValue: max }) => {
                if (!countryValue) {
                  return {
                    fill: isDark ? "#2c2c2e" : "#e8e8ed",
                    stroke: isDark ? "#424245" : "#d2d2d7",
                    strokeWidth: 0.4,
                    outline: "none",
                  };
                }
                const ratio =
                  (Number(countryValue) - minValue) / (max - minValue || 1);
                return {
                  fill: isDark ? "#0a84ff" : "#0071e3",
                  fillOpacity: 0.35 + ratio * 0.65,
                  stroke: isDark ? "#636366" : "#aeaeb2",
                  strokeWidth: 0.5,
                  outline: "none",
                  cursor: "pointer",
                };
              }}
            />
          )}
        </div>

        {mapData.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 text-[12px] text-muted-foreground">
            <span>{mapData.length} countries · {totalSessions.toLocaleString()} sessions</span>
            <div className="flex items-center gap-2">
              <span>Less</span>
              <div
                className="h-2 w-24 rounded-full"
                style={{
                  background: `linear-gradient(to right, ${
                    isDark ? "rgba(10,132,255,0.2)" : "rgba(0,113,227,0.2)"
                  }, ${isDark ? "#0a84ff" : "#0071e3"})`,
                }}
              />
              <span>More</span>
              {maxValue > 0 && (
                <span className="tabular-nums">(max {maxValue.toLocaleString()})</span>
              )}
            </div>
          </div>
        )}
      </DashboardCardContent>
    </DashboardCard>
  );
}
