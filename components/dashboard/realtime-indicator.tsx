"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";

export function RealtimeIndicator({ websiteId }: { websiteId: string }) {
  const [live, setLive] = useState(0);

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
        () => setLive((n) => n + 1)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [websiteId]);

  return (
    <Badge variant="secondary" className="gap-1.5 font-normal">
      <Activity className="h-3 w-3 text-emerald-500" />
      Live · {live} events
    </Badge>
  );
}
