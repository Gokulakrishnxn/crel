import { cn } from "@/lib/utils";

export function DashboardPage({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "dashboard-page mx-auto w-full max-w-[1400px] space-y-5 pb-8 sm:space-y-6 sm:pb-10 lg:space-y-8",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Stat row + full-width blocks */
export function DashboardStack({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 sm:gap-5 lg:gap-6", className)}>
      {children}
    </div>
  );
}

/** Two-column cards — stacks on mobile */
export function DashboardGrid2({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:gap-6",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Three-column cards — 1 → 2 → 3 cols */
export function DashboardGrid3({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6",
        className
      )}
    >
      {children}
    </div>
  );
}
