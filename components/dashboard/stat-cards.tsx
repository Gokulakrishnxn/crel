import type { OverviewStats } from "@/lib/types";
import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardHeader,
  DashboardCardTitle,
} from "@/components/dashboard/dashboard-card";
import { cn } from "@/lib/utils";

function formatDuration(seconds: number) {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

const metrics = [
  { key: "pageviews" as const, label: "Pageviews", format: (v: number) => v.toLocaleString() },
  { key: "sessions" as const, label: "Sessions", format: (v: number) => v.toLocaleString() },
  { key: "visitors" as const, label: "Visitors", format: (v: number) => v.toLocaleString() },
  {
    key: "bounceRate" as const,
    label: "Bounce rate",
    format: (v: number) => `${v.toFixed(1)}%`,
  },
  {
    key: "avgDuration" as const,
    label: "Avg. duration",
    format: formatDuration,
  },
];

export function StatCards({ stats }: { stats: OverviewStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
      {metrics.map(({ key, label, format }) => (
        <DashboardCard key={key} className="min-w-0">
          <DashboardCardHeader className="pb-0">
            <DashboardCardTitle className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:text-[12px]">
              {label}
            </DashboardCardTitle>
          </DashboardCardHeader>
          <DashboardCardContent className="pt-2">
            <p
              className={cn(
                "truncate text-xl font-semibold tracking-[-0.03em] tabular-nums sm:text-2xl lg:text-[28px]"
              )}
            >
              {format(stats[key])}
            </p>
          </DashboardCardContent>
        </DashboardCard>
      ))}
    </div>
  );
}
