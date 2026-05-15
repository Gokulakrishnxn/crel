"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";
import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardHeader,
  DashboardCardTitle,
} from "@/components/dashboard/dashboard-card";
import type { TimeSeriesPoint } from "@/lib/types";

export function AnalyticsChart({ data }: { data: TimeSeriesPoint[] }) {
  const chartData = data.map((d) => ({
    ...d,
    label: format(parseISO(d.date), "MMM d"),
  }));

  return (
    <DashboardCard className="min-w-0 overflow-hidden">
      <DashboardCardHeader>
        <DashboardCardTitle>Traffic over time</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardContent className="pt-2">
        <div className="h-[220px] w-full min-w-0 sm:h-[260px] md:h-[300px] lg:h-[320px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="pv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                minTickGap={24}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={36}
                tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  fontSize: "13px",
                }}
              />
              <Area
                type="monotone"
                dataKey="pageviews"
                stroke="var(--chart-1)"
                fill="url(#pv)"
                name="Pageviews"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="sessions"
                stroke="var(--chart-2)"
                fill="transparent"
                name="Sessions"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </DashboardCardContent>
    </DashboardCard>
  );
}
