"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Database, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SeedButton({ websiteId }: { websiteId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"seed" | "clear" | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function seed() {
    setLoading("seed");
    setResult(null);
    const res = await fetch("/api/seed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ websiteId }),
    });
    const json = await res.json();
    if (json.ok) {
      setResult(
        `Inserted ${json.inserted.sessions} sessions, ${json.inserted.pageviews} pageviews, ${json.inserted.events} events.`
      );
      router.refresh();
    } else {
      setResult(`Error: ${json.error}`);
    }
    setLoading(null);
  }

  async function clear() {
    setLoading("clear");
    setResult(null);
    const res = await fetch("/api/seed", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ websiteId }),
    });
    const json = await res.json();
    if (json.ok) {
      setResult("All demo data cleared.");
      router.refresh();
    } else {
      setResult(`Error: ${json.error}`);
    }
    setLoading(null);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className="apple-pill gap-2 border-dashed"
        onClick={seed}
        disabled={loading !== null}
      >
        {loading === "seed" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Database className="h-3.5 w-3.5" />
        )}
        Load demo data
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="apple-pill gap-2 text-muted-foreground"
        onClick={clear}
        disabled={loading !== null}
      >
        {loading === "clear" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="h-3.5 w-3.5" />
        )}
        Clear data
      </Button>
      {result && (
        <p className="w-full text-[12px] text-muted-foreground">{result}</p>
      )}
    </div>
  );
}
