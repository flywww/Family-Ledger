'use client'

import { useMemo, useState, useTransition } from "react";
import { Activity, Copy, KeyRound, Plus, ShieldCheck, Trash2 } from "lucide-react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createAgentApiKeyAction,
  revokeAgentApiKeyAction,
} from "@/lib/agent-api-actions";
import type { AgentApiPreset } from "@/lib/agent-api";

export type AgentKey = {
  id: string;
  name: string;
  preset: string;
  status: string;
  tokenDisplay: string;
  scopes: string[];
  createdAt: string;
  revokedAt: string | null;
  lastUsedAt: string | null;
};

export type AgentActivity = {
  id: string;
  action: string;
  status: string;
  targetType: string | null;
  targetId: string | null;
  monthKey: string | null;
  errorCode: string | null;
  keyName: string;
  createdAt: string;
};

const PRESETS: Array<{
  value: AgentApiPreset;
  label: string;
  description: string;
}> = [
  {
    value: "read_only",
    label: "Read only",
    description: "Holdings and balances read access.",
  },
  {
    value: "balance_writer",
    label: "Balance writer",
    description: "Read access plus single-balance dry-run and apply.",
  },
];

const formatDateTime = (value: string | null) => {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

export default function AgentAccessPanel({
  initialKeys,
  initialActivity,
}: {
  initialKeys: AgentKey[];
  initialActivity: AgentActivity[];
}) {
  const [keys, setKeys] = useState(initialKeys);
  const [activity, setActivity] = useState(initialActivity);
  const [name, setName] = useState("");
  const [preset, setPreset] = useState<AgentApiPreset>("read_only");
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeKeys = useMemo(() => keys.filter((key) => key.status === "active"), [keys]);

  const createKey = () => {
    setMessage(null);
    setCreatedToken(null);

    startTransition(() => {
      void (async () => {
        const result = await createAgentApiKeyAction({
          name: name.trim() || "Agent key",
          preset,
        });

        if (!result.ok) {
          setMessage(result.error);
          return;
        }

        setKeys((current) => [result.key, ...current]);
        setName("");
        setPreset("read_only");
        setCreatedToken(result.token);
        setActivity(result.activity);
        setMessage("Agent API key created.");
      })();
    });
  };

  const revokeKey = (id: string) => {
    setMessage(null);
    startTransition(() => {
      void (async () => {
        const result = await revokeAgentApiKeyAction(id);

        if (!result.ok) {
          setMessage(result.error);
          return;
        }

        setKeys((current) => current.map((key) => (key.id === id ? result.key : key)));
        setActivity(result.activity);
        setMessage("Agent API key revoked.");
      })();
    });
  };

  return (
    <div className="space-y-4">
          <Card className="rounded-lg shadow-sm">
            <CardHeader className="gap-1 p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
                <CardTitle className="text-lg">Agent access</CardTitle>
              </div>
              <CardDescription>
                Create dedicated API keys for trusted external agents.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-5 pt-0">
              {createdToken && (
                <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-50">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <p className="font-medium">Copy this token now. It will not be shown again.</p>
                      <code className="block overflow-x-auto rounded border border-emerald-500/40 bg-background p-2 text-xs text-emerald-100">
                        {createdToken}
                      </code>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="shrink-0 border-emerald-500/40 text-emerald-50 hover:bg-emerald-500/20 hover:text-emerald-50"
                      onClick={() => void navigator.clipboard.writeText(createdToken)}
                    >
                      <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
                      Copy
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]">
                <div className="space-y-2">
                  <Label htmlFor="agent-key-name">Key name</Label>
                  <Input
                    id="agent-key-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Monthly balance agent"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preset</Label>
                  <Select value={preset} onValueChange={(value) => setPreset(value as AgentApiPreset)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRESETS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button type="button" onClick={createKey} disabled={isPending}>
                    <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                    Create key
                  </Button>
                </div>
              </div>

              <div className="grid gap-2 rounded-lg border border-border bg-muted p-3 text-sm text-muted-foreground sm:grid-cols-2">
                {PRESETS.map((item) => (
                  <div key={item.value}>
                    <p className="font-medium text-foreground">{item.label}</p>
                    <p>{item.description}</p>
                  </div>
                ))}
              </div>

              {message && (
                <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
                  {message}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-lg shadow-sm">
            <CardHeader className="p-5">
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" aria-hidden="true" />
                <CardTitle className="text-lg">API keys</CardTitle>
              </div>
              <CardDescription>{activeKeys.length} active key{activeKeys.length === 1 ? "" : "s"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-5 pt-0">
              {keys.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No agent keys yet.
                </div>
              ) : (
                keys.map((key) => (
                  <div
                    key={key.id}
                    className="grid gap-3 rounded-lg border border-border p-4 md:grid-cols-[minmax(0,1fr)_auto]"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground">{key.name}</p>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {key.preset === "balance_writer" ? "Balance writer" : "Read only"}
                        </span>
                        <span className={key.status === "active" ? "text-xs text-emerald-500" : "text-xs text-rose-500"}>
                          {key.status}
                        </span>
                      </div>
                      <code className="block overflow-x-auto text-xs text-muted-foreground">{key.tokenDisplay}</code>
                      <p className="text-xs text-muted-foreground">
                        Created {formatDateTime(key.createdAt)} · Last used {formatDateTime(key.lastUsedAt)}
                      </p>
                    </div>
                    {key.status === "active" && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button type="button" variant="destructive" size="sm">
                            <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                            Revoke
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Revoke agent key?</DialogTitle>
                            <DialogDescription>
                              This immediately blocks requests using {key.name}. Existing audit logs are kept.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button type="button" variant="destructive" onClick={() => revokeKey(key.id)}>
                              Revoke key
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="rounded-lg shadow-sm">
            <CardHeader className="p-5">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" aria-hidden="true" />
                <CardTitle className="text-lg">Recent activity</CardTitle>
              </div>
              <CardDescription>Latest agent requests and key lifecycle events.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 p-5 pt-0">
              {activity.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No activity yet.
                </div>
              ) : (
                activity.map((item) => (
                  <div key={item.id} className="grid gap-1 rounded-lg border border-border p-3 text-sm sm:grid-cols-[1fr_auto]">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">
                        {item.action} · {item.status}
                      </p>
                      <p className="text-muted-foreground">
                        {item.keyName}
                        {item.monthKey ? ` · ${item.monthKey}` : ""}
                        {item.errorCode ? ` · ${item.errorCode}` : ""}
                      </p>
                    </div>
                    <p className="text-muted-foreground">{formatDateTime(item.createdAt)}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
    </div>
  );
}
