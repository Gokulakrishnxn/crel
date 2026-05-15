"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";

export function RealtimeIndicator({ websiteId }: { websiteId: string }) {
  const [live, setLive] = useState(0);
  const [pulse, setPulse] = useState(false);
  const router = useRouter();
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`pageviews:${websiteId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "pageviews",
          filter: `website_id=eq.${websiteId}`,
        },
        () => {
          setLive((n) => n + 1);
          setPulse(true);
          setTimeout(() => setPulse(false), 600);

          // Debounce: refresh server data at most once every 3 s
          if (refreshTimer.current) clearTimeout(refreshTimer.current);
          refreshTimer.current = setTimeout(() => {
            router.refresh();
          }, 3000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, [websiteId, router]);

  return (
    <Badge
      variant="secondary"
      className={`gap-1.5 font-normal transition-colors duration-300 ${
        pulse ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : ""
      }`}
    >
      <Activity
        className={`h-3 w-3 transition-colors duration-300 ${
          pulse ? "text-emerald-500" : "text-emerald-500"
        }`}
      />
      Live · {live} new
    </Badge>
  );
}
