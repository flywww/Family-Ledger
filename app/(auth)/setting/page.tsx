import SettingsShell from "@/components/setting/settings-shell";
import { Metadata }  from "next";
import { auth } from "@/auth";
import { fetchCronTestState } from "@/lib/actions";
import { fetchAgentAccessState } from "@/lib/agent-api-actions";

export const metadata: Metadata = {
	title: 'Setting',
};

export default async function Page() {
  const session = await auth();
  const [cronTestState, agentAccessState] = session
    ? await Promise.all([
        fetchCronTestState(session.user.id),
        fetchAgentAccessState(),
      ])
    : [undefined, { keys: [], activity: [] }];

  return (
    <SettingsShell
      account={session?.user.account}
      userId={session?.user.id}
      agentAccessState={{
        keys: agentAccessState.keys,
        activity: agentAccessState.activity,
      }}
      cronTestState={{
        activeTargetMonth: cronTestState?.activeTargetMonth,
        displayTargetMonth: cronTestState?.displayTargetMonth,
        startedAt: cronTestState?.startedAt,
        hasTestData: cronTestState?.hasTestData ?? false,
        staleTestData: cronTestState?.staleTestData ?? false,
        testMonthCount: cronTestState?.testMonthCount ?? 0,
        overview: cronTestState?.overview,
        availableSourceMonthKeys: cronTestState?.availableSourceMonthKeys ?? [],
        defaultSourceMonthKey: cronTestState?.defaultSourceMonthKey ?? null,
        nextCronRunAt: cronTestState?.nextCronRunAt,
        cronRunLogs: cronTestState?.cronRunLogs ?? [],
      }}
    />
  );
  }
