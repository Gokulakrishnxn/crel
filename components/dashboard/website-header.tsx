import { Suspense } from "react";
import { format } from "date-fns";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import type { Website } from "@/lib/types";

export function WebsiteHeader({
  website,
  range,
  title,
  description,
  children,
}: {
  website: Website;
  range: { from: Date; to: Date };
  title?: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="space-y-3 sm:space-y-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold tracking-[-0.03em] sm:text-[28px] lg:text-[32px]">
            {title ?? website.name}
          </h1>
          {description && (
            <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-muted-foreground sm:mt-2 sm:text-[15px]">
              {description}
            </p>
          )}
        </div>
        {children && (
          <div className="flex shrink-0 items-center sm:pt-1">{children}</div>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <p className="shrink-0 text-[12px] text-muted-foreground sm:text-[13px]">
          {format(range.from, "MMM d, yyyy")} – {format(range.to, "MMM d, yyyy")}
        </p>
        <Suspense fallback={null}>
          <DateRangePicker from={range.from} to={range.to} />
        </Suspense>
      </div>
    </header>
  );
}
