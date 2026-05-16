import Link from "next/link";
import { notFound } from "next/navigation";
import { CrelLogo } from "@/components/brand/crel-logo";
import { createClient } from "@/lib/supabase/server";
import {
  getOverviewStats,
  getTimeSeries,
  getTopPages,
  getTrafficSources,
  parseDateRange,
} from "@/lib/analytics/queries";
import { AnalyticsChart } from "@/components/dashboard/analytics-chart";
import { BreakdownTable } from "@/components/dashboard/breakdown-table";
import { StatCards } from "@/components/dashboard/stat-cards";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ shareId: string }>;
}): Promise<Metadata> {
  const { shareId } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("websites")
    .select("name, domain")
    .eq("share_id", shareId)
    .single();

  if (!data) return { title: "Analytics" };
  return { title: `${data.name} — Crel Analytics` };
}

export default async function SharePage({
  params,
  searchParams,
}: {
  params: Promise<{ shareId: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { shareId } = await params;
  const sp = await searchParams;

  const supabase = await createClient();
  const { data: website } = await supabase
    .from("websites")
    .select("id, name, domain")
    .eq("share_id", shareId)
    .single();

  if (!website) notFound();

  const range = parseDateRange(sp.from, sp.to);

  const [overview, timeSeries, topPages, sources] = await Promise.all([
    getOverviewStats(supabase, website.id, range),
    getTimeSeries(supabase, website.id, range),
    getTopPages(supabase, website.id, range),
    getTrafficSources(supabase, website.id, range),
  ]);

  return (
    <div className="apple-hero-gradient min-h-screen">
      <header className="apple-glass sticky top-0 z-50 border-b border-border/60">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center" aria-label="Crel home">
            <CrelLogo height={28} className="max-w-[8.5rem]" />
          </Link>
          <div className="text-right">
            <p className="text-[15px] font-semibold">{website.name}</p>
            <p className="text-[12px] text-muted-foreground">{website.domain}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-8 pb-16">
        <div>
          <h1 className="text-[28px] font-semibold tracking-[-0.03em]">
            {website.name}
          </h1>
          <p className="mt-1 text-[15px] text-muted-foreground">{website.domain}</p>
        </div>
        <StatCards stats={overview} />
        <AnalyticsChart data={timeSeries} />
        <div className="grid gap-6 lg:grid-cols-2">
          <BreakdownTable title="Top pages" rows={topPages} />
          <BreakdownTable title="Traffic sources" rows={sources} />
        </div>
      </main>

      <footer className="border-t border-border/60 py-6 text-center text-[12px] text-muted-foreground">
        Powered by{" "}
        <a href="/" className="underline">
          Crel
        </a>{" "}
        — open-source analytics
      </footer>
    </div>
  );
}
