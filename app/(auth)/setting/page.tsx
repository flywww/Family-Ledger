import ChangePasswordForm from "@/components/setting/change-password-form";
import CronTestToggle from "@/components/setting/cron-test-toggle";
import { Metadata }  from "next";
import { auth } from "@/auth";
import { fetchCronTestState } from "@/lib/actions";

export const metadata: Metadata = {
	title: 'Setting',
};

export default async function Page() {
  const session = await auth();
  const cronTestState = session ? await fetchCronTestState(session.user.id) : undefined;

  return (
      <div className="flex flex-col gap-4 justify-start items-center">
        <div className="flex flex-col gap-1 items-center">
          <h1 className="text-3xl max-w-40">{session?.user.account}</h1>
          <p className="text-sm text-slate-500">{session?.user.id}</p>
        </div>
        <CronTestToggle
          activeTargetMonth={cronTestState?.activeTargetMonth}
          displayTargetMonth={cronTestState?.displayTargetMonth}
          startedAt={cronTestState?.startedAt}
          hasTestData={cronTestState?.hasTestData ?? false}
          staleTestData={cronTestState?.staleTestData ?? false}
          testMonthCount={cronTestState?.testMonthCount ?? 0}
          overview={cronTestState?.overview}
          availableSourceMonthKeys={cronTestState?.availableSourceMonthKeys ?? []}
          defaultSourceMonthKey={cronTestState?.defaultSourceMonthKey ?? null}
          nextCronRunAt={cronTestState?.nextCronRunAt}
          cronRunLogs={cronTestState?.cronRunLogs ?? []}
        />
        <ChangePasswordForm/>
      </div>
      
    );
  }
