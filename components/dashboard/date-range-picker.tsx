"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { DateRange as DayPickerRange } from "react-day-picker";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  from: Date;
  to: Date;
}

export function DateRangePicker({ from, to }: DateRangePickerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const range: DayPickerRange = { from, to };

  function onSelect(selected: DayPickerRange | undefined) {
    if (!selected?.from || !selected?.to) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", format(selected.from, "yyyy-MM-dd"));
    params.set("to", format(selected.to, "yyyy-MM-dd"));
    router.push(`?${params.toString()}`);
  }

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "inline-flex h-8 items-center justify-start gap-2 rounded-lg border border-border bg-background px-2.5 text-sm font-normal hover:bg-muted"
        )}
      >
        <CalendarIcon className="h-4 w-4" />
        {format(from, "MMM d, yyyy")} – {format(to, "MMM d, yyyy")}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="range"
          selected={range}
          onSelect={onSelect}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  );
}
