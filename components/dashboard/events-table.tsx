import { formatDistanceToNow, parseISO } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { EventRow } from "@/lib/analytics/queries";
import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardHeader,
  DashboardCardTitle,
} from "@/components/dashboard/dashboard-card";

export function EventsTable({ events }: { events: EventRow[] }) {
  return (
    <DashboardCard className="min-w-0 overflow-hidden">
      <DashboardCardHeader>
        <DashboardCardTitle>Custom events</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardContent className="p-0 sm:p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-10 px-4 text-[12px] sm:px-5">Event name</TableHead>
                <TableHead className="h-10 px-4 text-right text-[12px] sm:px-5">
                  Count
                </TableHead>
                <TableHead className="h-10 px-4 text-right text-[12px] sm:px-5">
                  Last seen
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="px-4 py-8 text-center text-[13px] text-muted-foreground sm:px-5"
                  >
                    No events recorded for this period. Use{" "}
                    <code className="rounded bg-muted px-1 py-0.5 text-[12px]">
                      window.crel.track(&apos;event-name&apos;)
                    </code>{" "}
                    to send custom events.
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event) => (
                  <TableRow key={event.name}>
                    <TableCell className="max-w-[min(100%,12rem)] truncate px-4 py-3 sm:max-w-[260px] sm:px-5">
                      <code className="rounded bg-muted px-1.5 py-0.5 text-[12px]">
                        {event.name}
                      </code>
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-4 py-3 text-right text-[13px] tabular-nums sm:px-5">
                      {event.count.toLocaleString()}
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-4 py-3 text-right text-[12px] text-muted-foreground sm:px-5 sm:text-[13px]">
                      {formatDistanceToNow(parseISO(event.lastSeen), { addSuffix: true })}
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
