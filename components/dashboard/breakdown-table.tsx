import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { BreakdownRow } from "@/lib/types";
import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardHeader,
  DashboardCardTitle,
} from "@/components/dashboard/dashboard-card";

export function BreakdownTable({
  title,
  rows,
}: {
  title: string;
  rows: BreakdownRow[];
}) {
  return (
    <DashboardCard className="flex min-w-0 flex-col overflow-hidden">
      <DashboardCardHeader>
        <DashboardCardTitle>{title}</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardContent className="min-w-0 p-0 sm:p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-10 px-4 text-[12px] sm:px-5">Name</TableHead>
                <TableHead className="h-10 px-4 text-right text-[12px] sm:px-5">
                  Views
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={2}
                    className="px-4 py-8 text-center text-[13px] text-muted-foreground sm:px-5"
                  >
                    No data for this period
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.label}>
                    <TableCell className="max-w-[min(100%,14rem)] truncate px-4 py-3 text-[13px] font-medium sm:max-w-none sm:px-5 sm:text-[14px]">
                      {row.label}
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-4 py-3 text-right text-[13px] tabular-nums sm:px-5 sm:text-[14px]">
                      {row.value.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DashboardCardContent>
    </DashboardCard>
  );
}
