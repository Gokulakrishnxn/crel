"use client";

import { useMemo, useState } from "react";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardDescription,
  DashboardCardHeader,
  DashboardCardTitle,
} from "@/components/dashboard/dashboard-card";
import type { SessionListRow } from "@/lib/analytics/queries";
import {
  formatDeviceLabel,
  formatSessionDuration,
  formatSessionSource,
  formatVisitorId,
} from "@/lib/dashboard/session-format";
import { getCountryFlag } from "@/lib/geography/country-labels";
import { getCountryName } from "@/lib/geography/country-labels";

export function SessionsView({
  sessions,
  limit,
}: {
  sessions: SessionListRow[];
  limit: number;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter((row) => {
      const haystack = [
        row.visitor_id,
        row.country,
        row.city,
        row.browser,
        row.os,
        row.device,
        formatSessionSource(row),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [sessions, query]);

  return (
    <DashboardCard className="min-w-0 overflow-hidden">
      <DashboardCardHeader>
        <DashboardCardTitle>Recent sessions</DashboardCardTitle>
        <DashboardCardDescription>
          Latest {limit} sessions in the selected date range.
        </DashboardCardDescription>
        <div className="relative pt-2">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search visitor, country, source…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 rounded-lg pl-9 text-[14px]"
          />
        </div>
      </DashboardCardHeader>
      <DashboardCardContent className="space-y-4 p-0 sm:space-y-0 sm:p-0">
        {/* Mobile: session cards */}
        <ul className="space-y-2 px-3 pb-3 md:hidden">
          {filtered.length === 0 ? (
            <li className="py-8 text-center text-[13px] text-muted-foreground">
              {query ? "No sessions match your search" : "No sessions in this period"}
            </li>
          ) : (
            filtered.map((row) => (
              <li
                key={row.id}
                className="rounded-xl border border-border/50 bg-muted/20 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium tabular-nums text-muted-foreground">
                      {format(parseISO(row.started_at), "MMM d, h:mm a")}
                    </p>
                    <p className="mt-1 truncate font-mono text-[12px] text-foreground">
                      {formatVisitorId(row.visitor_id)}
                    </p>
                  </div>
                  <Badge variant={row.is_bounce ? "secondary" : "outline"} className="shrink-0">
                    {row.is_bounce ? "Bounce" : "Engaged"}
                  </Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
                  <div>
                    <p className="text-muted-foreground">Location</p>
                    <p className="mt-0.5 flex items-center gap-1 truncate font-medium">
                      {row.country && (
                        <span aria-hidden>{getCountryFlag(row.country)}</span>
                      )}
                      {row.country ? getCountryName(row.country) : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Device</p>
                    <p className="mt-0.5 truncate font-medium">{formatDeviceLabel(row)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Pages</p>
                    <p className="mt-0.5 font-medium tabular-nums">{row.pageview_count}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Duration</p>
                    <p className="mt-0.5 font-medium tabular-nums">
                      {formatSessionDuration(row.duration_seconds)}
                    </p>
                  </div>
                </div>
                <p className="mt-2 truncate text-[12px] text-muted-foreground">
                  {formatSessionSource(row)}
                </p>
              </li>
            ))
          )}
        </ul>

        {/* Desktop: table */}
        <div className="hidden overflow-x-auto md:block">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-10 px-4 text-[12px] sm:px-5">Started</TableHead>
                <TableHead className="hidden h-10 px-4 text-[12px] lg:table-cell sm:px-5">
                  Visitor
                </TableHead>
                <TableHead className="h-10 px-4 text-[12px] sm:px-5">Location</TableHead>
                <TableHead className="hidden h-10 px-4 text-[12px] xl:table-cell sm:px-5">
                  Device
                </TableHead>
                <TableHead className="h-10 px-4 text-right text-[12px] sm:px-5">
                  Pages
                </TableHead>
                <TableHead className="h-10 px-4 text-right text-[12px] sm:px-5">
                  Duration
                </TableHead>
                <TableHead className="hidden h-10 px-4 text-[12px] lg:table-cell sm:px-5">
                  Source
                </TableHead>
                <TableHead className="h-10 px-4 text-[12px] sm:px-5">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="px-4 py-10 text-center text-[13px] text-muted-foreground sm:px-5"
                  >
                    {query ? "No sessions match your search" : "No sessions in this period"}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap px-4 py-3 sm:px-5">
                      <p className="text-[13px] font-medium">
                        {format(parseISO(row.started_at), "MMM d, h:mm a")}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatDistanceToNow(parseISO(row.started_at), { addSuffix: true })}
                      </p>
                    </TableCell>
                    <TableCell className="hidden px-4 py-3 font-mono text-[12px] lg:table-cell sm:px-5">
                      {formatVisitorId(row.visitor_id)}
                    </TableCell>
                    <TableCell className="max-w-[140px] px-4 py-3 sm:max-w-none sm:px-5">
                      <p className="flex items-center gap-1.5 truncate text-[13px]">
                        {row.country && (
                          <span className="shrink-0" aria-hidden>
                            {getCountryFlag(row.country)}
                          </span>
                        )}
                        <span className="truncate">
                          {row.country ? getCountryName(row.country) : "—"}
                        </span>
                      </p>
                      {row.city && (
                        <p className="truncate text-[11px] text-muted-foreground">{row.city}</p>
                      )}
                    </TableCell>
                    <TableCell className="hidden max-w-[160px] truncate px-4 py-3 text-[13px] xl:table-cell sm:px-5">
                      {formatDeviceLabel(row)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right text-[13px] tabular-nums sm:px-5">
                      {row.pageview_count}
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-4 py-3 text-right text-[13px] tabular-nums sm:px-5">
                      {formatSessionDuration(row.duration_seconds)}
                    </TableCell>
                    <TableCell className="hidden max-w-[140px] truncate px-4 py-3 text-[13px] text-muted-foreground lg:table-cell sm:px-5">
                      {formatSessionSource(row)}
                    </TableCell>
                    <TableCell className="px-4 py-3 sm:px-5">
                      <Badge variant={row.is_bounce ? "secondary" : "outline"}>
                        {row.is_bounce ? "Bounce" : "Engaged"}
                      </Badge>
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
