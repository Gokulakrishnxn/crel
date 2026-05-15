export type DeviceType = "desktop" | "mobile" | "tablet" | "unknown";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Website {
  id: string;
  user_id: string;
  name: string;
  domain: string;
  tracking_id: string;
  share_id: string | null;
  settings: Record<string, unknown>;
  created_at: string;
}

export interface CollectPayload {
  type: "pageview" | "event" | "heartbeat";
  websiteId: string;
  sessionId: string;
  visitorId: string;
  url?: string;
  path?: string;
  title?: string;
  referrer?: string;
  eventName?: string;
  eventProperties?: Record<string, unknown>;
  screen?: string;
  language?: string;
  country?: string;
  device?: DeviceType;
  browser?: string;
  browserVersion?: string;
  os?: string;
  osVersion?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
  duration?: number;
}

export interface OverviewStats {
  pageviews: number;
  sessions: number;
  visitors: number;
  bounceRate: number;
  avgDuration: number;
}

export interface TimeSeriesPoint {
  date: string;
  pageviews: number;
  sessions: number;
}

export interface BreakdownRow {
  label: string;
  value: number;
  percentage: number;
}
