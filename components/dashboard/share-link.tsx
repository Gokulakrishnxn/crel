"use client";

import { useState } from "react";
import { Check, Copy, Globe, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ShareLink({
  websiteId,
  shareId,
  appUrl,
}: {
  websiteId: string;
  shareId: string | null;
  appUrl: string;
}) {
  const [currentShareId, setCurrentShareId] = useState(shareId);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = currentShareId ? `${appUrl}/share/${currentShareId}` : null;

  async function enable() {
    setLoading(true);
    const supabase = createClient();
    const newShareId = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    const { error } = await supabase
      .from("websites")
      .update({ share_id: newShareId })
      .eq("id", websiteId);
    if (!error) setCurrentShareId(newShareId);
    setLoading(false);
  }

  async function disable() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("websites")
      .update({ share_id: null })
      .eq("id", websiteId);
    if (!error) setCurrentShareId(null);
    setLoading(false);
  }

  async function copy() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="rounded-2xl border-border/60 bg-card/90">
      <CardHeader>
        <CardTitle className="text-[17px] font-semibold tracking-[-0.02em]">
          Public dashboard
        </CardTitle>
        <CardDescription className="text-[14px]">
          Share a read-only view of this website&apos;s analytics with anyone.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentShareId ? (
          <>
            <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
              <Globe className="h-4 w-4 shrink-0 text-primary" />
              <code className="min-w-0 flex-1 truncate text-[13px]">{shareUrl}</code>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copy} className="apple-pill gap-2">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy link"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={disable}
                disabled={loading}
                className="apple-pill gap-2 text-destructive hover:text-destructive"
              >
                <Lock className="h-3.5 w-3.5" />
                Disable sharing
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-[14px] text-muted-foreground">
              Public sharing is disabled. Enable it to get a shareable link.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={enable}
              disabled={loading}
              className="apple-pill gap-2"
            >
              <Globe className="h-3.5 w-3.5" />
              Enable public link
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
