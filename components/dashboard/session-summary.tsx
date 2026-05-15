import type { OverviewStats } from "@/lib/types";
import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardHeader,
  DashboardCardTitle,
} from "@/components/dashboard/dashboard-card";

function formatDuration(seconds: number) {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

const items = [
  {
    key: "sessions",
    label: "Total sessions",
    format: (s: OverviewStats) => s.sessions.toLocaleString(),
  },
  {
    key: "visitors",
    label: "Unique visitors",
    format: (s: OverviewStats) => s.visitors.toLocaleString(),
  },
  {
    key: "bounce",
    label: "Bounce rate",
    format: (s: OverviewStats) => `${s.bounceRate.toFixed(1)}%`,
  },
  {
    key: "duration",
    label: "Avg. duration",
    format: (s: OverviewStats) => formatDuration(s.avgDuration),
  },
] as const;

export function SessionSummary({ stats }: { stats: OverviewStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {items.map(({ key, label, format }) => (
        <DashboardCard key={key} className="min-w-0">
          <DashboardCardHeader className="pb-0">
            <DashboardCardTitle className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:text-[12px]">
              {label}
            </DashboardCardTitle>
          </DashboardCardHeader>
          <DashboardCardContent className="pt-2">
            <p className="text-xl font-semibold tracking-[-0.03em] tabular-nums sm:text-2xl">
              {format(stats)}
            </p>
          </DashboardCardContent>
        </DashboardCard>
      ))}
    </div>
  );
}
