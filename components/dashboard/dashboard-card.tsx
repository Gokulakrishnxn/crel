import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function DashboardCard({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Card>) {
  return (
    <Card className={cn("dashboard-card", className)} {...props}>
      {children}
    </Card>
  );
}

export function DashboardCardHeader({
  className,
  ...props
}: React.ComponentProps<typeof CardHeader>) {
  return (
    <CardHeader
      className={cn("space-y-1 px-4 pt-4 pb-0 sm:px-5 sm:pt-5", className)}
      {...props}
    />
  );
}

export function DashboardCardTitle({
  className,
  ...props
}: React.ComponentProps<typeof CardTitle>) {
  return (
    <CardTitle
      className={cn(
        "text-base font-semibold tracking-[-0.02em] sm:text-[17px]",
        className
      )}
      {...props}
    />
  );
}

export function DashboardCardDescription({
  className,
  ...props
}: React.ComponentProps<typeof CardDescription>) {
  return (
    <CardDescription
      className={cn("text-[13px] leading-relaxed sm:text-[14px]", className)}
      {...props}
    />
  );
}

export function DashboardCardContent({
  className,
  ...props
}: React.ComponentProps<typeof CardContent>) {
  return (
    <CardContent className={cn("px-4 pb-4 pt-3 sm:px-5 sm:pb-5", className)} {...props} />
  );
}
