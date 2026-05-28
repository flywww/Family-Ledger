'use client'

import type { ComponentProps } from "react";
import { CircleUserRound, RefreshCw, ShieldCheck } from "lucide-react";
import AgentAccessPanel, {
  type AgentActivity,
  type AgentKey,
} from "@/components/setting/agent-access-panel";
import ChangePasswordForm from "@/components/setting/change-password-form";
import CronTestToggle from "@/components/setting/cron-test-toggle";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type CronTestProps = ComponentProps<typeof CronTestToggle>;

type SettingsShellProps = {
  account?: string | null;
  userId?: string | null;
  cronTestState: CronTestProps;
  agentAccessState: {
    keys: AgentKey[];
    activity: AgentActivity[];
  };
};

const settingsTabs = [
  { value: "profile", label: "Profile", icon: CircleUserRound },
  { value: "cron-jobs", label: "Cron jobs", icon: RefreshCw },
  { value: "agent-access", label: "Agent access", icon: ShieldCheck },
];

export default function SettingsShell({
  account,
  userId,
  cronTestState,
  agentAccessState,
}: SettingsShellProps) {
  return (
    <div className="flex w-full flex-col gap-4 px-4 py-4 sm:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">{account} · {userId}</p>
      </div>

      <Tabs
        defaultValue="profile"
        orientation="vertical"
        className="grid w-full max-w-5xl gap-3 md:grid-cols-[220px_minmax(0,1fr)]"
      >
        <Card className="h-fit rounded-lg shadow-sm">
          <CardContent className="p-2">
            <TabsList className="grid h-auto w-full gap-1 bg-transparent p-0">
              {settingsTabs.map((item) => {
                const Icon = item.icon;
                return (
                  <TabsTrigger
                    key={item.value}
                    value={item.value}
                    className="w-full justify-start gap-2 px-3 py-2 text-left text-muted-foreground shadow-none data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {item.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </CardContent>
        </Card>

        <div className="min-w-0">
          <TabsContent value="profile" className="m-0">
            <div className="space-y-4">
              <Card className="rounded-lg shadow-sm">
                <CardContent className="grid gap-3 p-5 text-sm">
                  <div>
                    <p className="text-muted-foreground">Account</p>
                    <p className="font-medium text-foreground">{account ?? "Unknown"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">User ID</p>
                    <p className="break-all font-mono text-xs text-foreground">{userId ?? "Unknown"}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-lg shadow-sm">
                <CardContent className="p-5">
                  <ChangePasswordForm />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="cron-jobs" className="m-0">
            <CronTestToggle {...cronTestState} />
          </TabsContent>

          <TabsContent value="agent-access" className="m-0">
            <AgentAccessPanel
              initialKeys={agentAccessState.keys}
              initialActivity={agentAccessState.activity}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
