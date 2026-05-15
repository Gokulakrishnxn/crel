"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  Check,
  Copy,
  Key,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  last_used_at: string | null;
  created_at: string;
}

interface CreatedKey extends ApiKey {
  key: string;
}

function CodeBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="group relative">
      {label && (
        <p className="mb-1.5 text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
      )}
      <div className="relative rounded-lg bg-muted">
        <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed">
          <code>{code}</code>
        </pre>
        <button
          onClick={copy}
          className="absolute right-2 top-2 rounded p-1.5 opacity-0 transition-opacity hover:bg-background group-hover:opacity-100"
          aria-label="Copy"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </button>
      </div>
    </div>
  );
}

export function ApiKeysList({
  websiteId,
  appUrl,
  initialKeys,
}: {
  websiteId: string;
  appUrl: string;
  initialKeys: ApiKey[];
}) {
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createdKey, setCreatedKey] = useState<CreatedKey | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);

  function openDialog() {
    setName("");
    setCreateError("");
    setCreatedKey(null);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setCreatedKey(null);
    setName("");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setCreateError("");

    const res = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ websiteId, name: name.trim() }),
    });

    const data = await res.json();
    setCreating(false);

    if (!res.ok) {
      setCreateError(data.error ?? "Failed to create key");
      return;
    }

    setCreatedKey(data as CreatedKey);
    setKeys((prev) => [{ ...data, key: undefined } as ApiKey, ...prev]);
  }

  async function copyCreatedKey() {
    if (!createdKey) return;
    await navigator.clipboard.writeText(createdKey.key);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 2000);
  }

  async function revokeKey(keyId: string) {
    setRevoking(keyId);
    const res = await fetch(`/api/keys/${keyId}`, { method: "DELETE" });
    if (res.ok) {
      setKeys((prev) => prev.filter((k) => k.id !== keyId));
    }
    setRevoking(null);
  }

  const exampleKey = keys[0]?.key_prefix.replace("…", "xxxx") ?? "crel_live_xxxxxxxxxxxxxxxx";
  const scriptSnippet = `<script
  async
  src="${appUrl}/crel.js"
  data-api-key="${exampleKey}"
></script>`;

  const envSnippet = `# .env.local (never commit this)
CREL_API_KEY=${exampleKey}

# In your Next.js layout.tsx
<Script
  src="${appUrl}/crel.js"
  data-api-key={process.env.CREL_API_KEY}
  strategy="afterInteractive"
/>`;

  const curlSnippet = `curl -X POST ${appUrl}/api/collect \\
  -H "Authorization: Bearer ${exampleKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "batch": [{
      "type": "pageview",
      "path": "/",
      "sessionId": "<uuid>",
      "visitorId": "<uuid>"
    }]
  }'`;

  return (
    <div className="space-y-6">
      {/* Keys table */}
      <Card className="rounded-2xl border-border/60 bg-card/90">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-[17px] font-semibold tracking-[-0.02em]">
              API Keys
            </CardTitle>
            <CardDescription className="text-[14px]">
              Connect any site or backend to Crel using a secret API key.
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={openDialog}
            className="apple-pill shrink-0 gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            New API Key
          </Button>
        </CardHeader>
        <CardContent>
          {keys.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 py-10 text-center">
              <Key className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-[14px] text-muted-foreground">
                No API keys yet. Create one to start sending events.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[14px]">
                <thead>
                  <tr className="border-b border-border text-left text-[12px] text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Name</th>
                    <th className="pb-2 pr-4 font-medium">Key</th>
                    <th className="pb-2 pr-4 font-medium">Last used</th>
                    <th className="pb-2 pr-4 font-medium">Created</th>
                    <th className="pb-2 font-medium" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {keys.map((k) => (
                    <tr key={k.id}>
                      <td className="py-3 pr-4 font-medium">{k.name}</td>
                      <td className="py-3 pr-4">
                        <code className="rounded bg-muted px-2 py-0.5 text-[12px]">
                          {k.key_prefix}
                        </code>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {k.last_used_at
                          ? formatDistanceToNow(new Date(k.last_used_at), {
                              addSuffix: true,
                            })
                          : "Never"}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {formatDistanceToNow(new Date(k.created_at), {
                          addSuffix: true,
                        })}
                      </td>
                      <td className="py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={revoking === k.id}
                          onClick={() => revokeKey(k.id)}
                          className="apple-pill h-7 gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Revoke
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Integration guide */}
      <Card className="rounded-2xl border-border/60 bg-card/90">
        <CardHeader>
          <CardTitle className="text-[17px] font-semibold tracking-[-0.02em]">
            How to use
          </CardTitle>
          <CardDescription className="text-[14px]">
            Three ways to send events to Crel using your API key.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-[14px] font-medium">
              1 — Script tag (any website)
            </p>
            <p className="text-[13px] text-muted-foreground">
              Drop this in your HTML{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-[12px]">
                &lt;head&gt;
              </code>
              . No tracking ID needed — the key identifies your site.
            </p>
            <CodeBlock code={scriptSnippet} />
          </div>

          <div className="space-y-2">
            <p className="text-[14px] font-medium">
              2 — Environment variable (Next.js / Vite / etc.)
            </p>
            <p className="text-[13px] text-muted-foreground">
              Store the key in your build environment so it never appears in
              source code.
            </p>
            <CodeBlock code={envSnippet} />
          </div>

          <div className="space-y-2">
            <p className="text-[14px] font-medium">
              3 — Server-side REST (backend / CI)
            </p>
            <p className="text-[13px] text-muted-foreground">
              Send events from your server using the{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-[12px]">
                Authorization
              </code>{" "}
              header. The key is never exposed to the browser.
            </p>
            <CodeBlock code={curlSnippet} />
          </div>
        </CardContent>
      </Card>

      {/* Create key dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {createdKey ? "API key created" : "Create API Key"}
            </DialogTitle>
            <DialogDescription>
              {createdKey
                ? "Copy this key now — it will not be shown again."
                : "Give this key a name so you can identify it later."}
            </DialogDescription>
          </DialogHeader>

          {createdKey ? (
            <div className="space-y-4">
              {/* Warning */}
              <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <p className="text-[13px] text-amber-700 dark:text-amber-400">
                  This key is shown only once. Store it somewhere safe before
                  closing.
                </p>
              </div>

              {/* Key value */}
              <div className="relative">
                <code className="block w-full overflow-x-auto rounded-lg border border-border bg-muted px-4 py-3 pr-10 text-[13px] break-all">
                  {createdKey.key}
                </code>
                <button
                  onClick={copyCreatedKey}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 hover:bg-background"
                  aria-label="Copy key"
                >
                  {keyCopied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={closeDialog}>
                  <X className="mr-1.5 h-3.5 w-3.5" />
                  Close
                </Button>
                <Button size="sm" onClick={copyCreatedKey}>
                  {keyCopied ? (
                    <Check className="mr-1.5 h-3.5 w-3.5" />
                  ) : (
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {keyCopied ? "Copied!" : "Copy key"}
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="key-name">Key name</Label>
                <Input
                  id="key-name"
                  placeholder="e.g. Production, Staging, CI"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  maxLength={50}
                />
                {createError && (
                  <p className="text-[13px] text-destructive">{createError}</p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={closeDialog}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={creating || !name.trim()}
                >
                  {creating ? "Creating…" : "Create key"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
