"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function TrackingSnippet({
  trackingId,
  appUrl,
}: {
  trackingId: string;
  appUrl: string;
}) {
  const [copied, setCopied] = useState(false);
  const snippet = `<script async src="${appUrl}/crel.js" data-website-id="${trackingId}"></script>`;

  async function copy() {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tracking script</CardTitle>
        <CardDescription>
          Add this snippet before the closing <code>&lt;/head&gt;</code> tag.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs">
          <code>{snippet}</code>
        </pre>
        <Button variant="outline" size="sm" onClick={copy}>
          {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
          {copied ? "Copied" : "Copy snippet"}
        </Button>
      </CardContent>
    </Card>
  );
}
