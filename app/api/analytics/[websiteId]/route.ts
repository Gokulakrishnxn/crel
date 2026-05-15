import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getBrowsers,
  getCountries,
  getDevices,
  getOs,
  getOverviewStats,
  getTimeSeries,
  getTopPages,
  getTrafficSources,
  parseDateRange,
} from "@/lib/analytics/queries";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> }
) {
  const { websiteId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const range = parseDateRange(
    searchParams.get("from"),
    searchParams.get("to")
  );

  try {
    const [overview, timeSeries, topPages, sources, countries, browsers, devices, os] =
      await Promise.all([
        getOverviewStats(supabase, websiteId, range),
        getTimeSeries(supabase, websiteId, range),
        getTopPages(supabase, websiteId, range),
        getTrafficSources(supabase, websiteId, range),
        getCountries(supabase, websiteId, range),
        getBrowsers(supabase, websiteId, range),
        getDevices(supabase, websiteId, range),
        getOs(supabase, websiteId, range),
      ]);

    return NextResponse.json({
      overview,
      timeSeries,
      topPages,
      sources,
      countries,
      browsers,
      devices,
      os,
      range: {
        from: range.from.toISOString(),
        to: range.to.toISOString(),
      },
    });
  } catch (err) {
    console.error("[analytics]", err);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
