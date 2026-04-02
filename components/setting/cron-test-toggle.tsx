'use client'

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { startMonthlyRefreshCronTest, stopMonthlyRefreshCronTest } from "@/lib/actions";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CronHealthState, CronRunLog, MonthlyRefreshOverview } from "@/lib/definitions";
import { MonthKey, monthKeyToDate } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import CronHealthAlert from "@/components/cron-health-alert";

export default function CronTestToggle({
    activeTargetMonth,
    displayTargetMonth,
    startedAt,
    hasTestData,
    staleTestData,
    testMonthCount,
    overview,
    availableSourceMonthKeys,
    defaultSourceMonthKey,
    nextCronRunAt,
    cronRunLogs,
    cronHealth,
}:{
    activeTargetMonth?: Date | null,
    displayTargetMonth?: Date | null,
    startedAt?: Date | null,
    hasTestData: boolean,
    staleTestData: boolean,
    testMonthCount: number,
    overview?: MonthlyRefreshOverview,
    availableSourceMonthKeys: MonthKey[],
    defaultSourceMonthKey?: MonthKey | null,
    nextCronRunAt?: Date,
    cronRunLogs: CronRunLog[],
    cronHealth?: CronHealthState,
}){
    const [isPending, startTransition] = useTransition();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [currentTargetMonth, setCurrentTargetMonth] = useState<Date | null>(
        activeTargetMonth ?? null,
    );
    const [currentDisplayMonth, setCurrentDisplayMonth] = useState<Date | null>(
        displayTargetMonth ?? activeTargetMonth ?? null,
    );
    const [hasCurrentTestData, setHasCurrentTestData] = useState(hasTestData);
    const [hasStaleTestData, setHasStaleTestData] = useState(staleTestData);
    const [selectedSourceMonthKey, setSelectedSourceMonthKey] = useState<MonthKey | "">(
        defaultSourceMonthKey ?? "",
    );
    const router = useRouter();

    useEffect(() => {
        setCurrentTargetMonth(activeTargetMonth ?? null);
    }, [activeTargetMonth]);

    useEffect(() => {
        setCurrentDisplayMonth(displayTargetMonth ?? activeTargetMonth ?? null);
    }, [displayTargetMonth, activeTargetMonth]);

    useEffect(() => {
        setHasCurrentTestData(hasTestData);
    }, [hasTestData]);

    useEffect(() => {
        setHasStaleTestData(staleTestData);
    }, [staleTestData]);

    useEffect(() => {
        setSelectedSourceMonthKey(defaultSourceMonthKey ?? "");
    }, [defaultSourceMonthKey]);

    const handleClick = () => {
        setErrorMessage(null);
        setSuccessMessage(null);

        startTransition(() => {
            void (async () => {
                const result = currentTargetMonth || hasCurrentTestData
                    ? await stopMonthlyRefreshCronTest()
                    : await startMonthlyRefreshCronTest(
                        selectedSourceMonthKey || undefined,
                    );

                if (result?.error) {
                    setErrorMessage(result.error);
                    return;
                }

                if (currentTargetMonth || hasCurrentTestData) {
                    setCurrentTargetMonth(null);
                    setCurrentDisplayMonth(null);
                    setHasCurrentTestData(false);
                    setHasStaleTestData(false);
                } else {
                    setCurrentTargetMonth(result?.targetMonth ?? null);
                    setCurrentDisplayMonth(result?.targetMonth ?? null);
                    setHasCurrentTestData(Boolean(result?.targetMonth));
                    setHasStaleTestData(false);
                }

                setSuccessMessage(
                    currentTargetMonth || hasCurrentTestData
                        ? "Cron test data cleaned."
                        : "Cron test data prepared. Trigger the deployed cron route to process it.",
                );
                router.refresh();
            })();
        });
    };

    return(
        <div className="flex w-full max-w-3xl flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950 p-5 text-slate-100 shadow-sm">
            <div className="space-y-1">
                <h2 className="text-lg font-semibold text-slate-100">Cron Job Test</h2>
                <p className="text-sm text-slate-300">
                    Start test only prepares next-month test data. Use the deployed cron route to
                    run the real refresh flow. Clean test data removes all tagged test artifacts.
                </p>
                <CronHealthAlert health={cronHealth} forceVisible />
                {!hasCurrentTestData && (
                    <div className="space-y-2 pt-1">
                        <p className="text-sm text-slate-300">Source month</p>
                        <Select
                            value={selectedSourceMonthKey}
                            onValueChange={(value) => setSelectedSourceMonthKey(value as MonthKey)}
                        >
                            <SelectTrigger className="w-full border-slate-700 bg-slate-900 text-slate-100 [&>span]:text-slate-100">
                                <SelectValue placeholder="Select a month to copy" />
                            </SelectTrigger>
                            <SelectContent className="border-slate-700 bg-slate-900 text-slate-100">
                                {availableSourceMonthKeys.map((monthKey) => (
                                    <SelectItem key={monthKey} value={monthKey}>
                                        {format(monthKeyToDate(monthKey), "MMM yyyy")}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {selectedSourceMonthKey && (
                            <p className="text-xs text-slate-400">
                                Selected source month: {format(monthKeyToDate(selectedSourceMonthKey), "MMM yyyy")}
                            </p>
                        )}
                    </div>
                )}
                {nextCronRunAt && (
                    <p className="text-sm text-slate-300">
                        Next cron job run on {format(nextCronRunAt, "yyyy-MM-dd HH:mm:ss")}
                    </p>
                )}
                {currentDisplayMonth && (
                    <p className="text-sm text-slate-300">
                        Testing month: {format(currentDisplayMonth, "MMM yyyy")}
                    </p>
                )}
                {startedAt && hasCurrentTestData && (
                    <p className="text-sm text-slate-300">
                        Prepared at: {format(startedAt, "yyyy-MM-dd HH:mm")}
                    </p>
                )}
                {hasStaleTestData && (
                    <p className="text-sm text-amber-400">
                        Stale test data was detected. Clean it before starting a new test.
                    </p>
                )}
            </div>
            <div className="flex items-center gap-3">
                <Button
                    type="button"
                    onClick={handleClick}
                    disabled={isPending || (!hasCurrentTestData && !selectedSourceMonthKey)}
                >
                    {isPending
                        ? currentTargetMonth || hasCurrentTestData
                            ? "Cleaning test data..."
                            : "Starting test..."
                        : currentTargetMonth || hasCurrentTestData
                            ? "Stop test"
                            : "Start test"}
                </Button>
                {currentDisplayMonth && (
                    <Button asChild variant="outline">
                        <Link href={`/balance?month=${format(currentDisplayMonth, "yyyy-MM")}`}>
                            Open test month
                        </Link>
                    </Button>
                )}
            </div>
            {hasCurrentTestData && (
                <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-900 p-3 text-sm text-slate-200">
                    <p className="font-medium text-slate-100">Run the deployed cron route</p>
                    <p>
                        Manual production test uses the real cron endpoint. Replace the placeholders
                        with your deployed domain and secret.
                    </p>
                    <pre className="overflow-x-auto rounded bg-slate-900 p-3 text-xs text-slate-100">
{`curl -i -X GET https://YOUR_DOMAIN/api/cron/monthly-refresh \\
  -H "Authorization: Bearer YOUR_CRON_SECRET" \\
  -H "x-cron-trigger: manual_test"`}
                    </pre>
                    <p>
                        Manual calls appear in Vercel Runtime Logs. Scheduled cron calls appear in
                        the Cron Jobs page.
                    </p>
                </div>
            )}
            {overview && currentDisplayMonth && (
                <div className="grid gap-2 rounded-lg border border-slate-800 bg-slate-900 p-3 text-sm text-slate-200 sm:grid-cols-2">
                    <p>Status: <span className="font-medium text-slate-100">{overview.status}</span></p>
                    <p>Pending: <span className="font-medium text-slate-100">{overview.pendingCount}</span></p>
                    <p>Completed: <span className="font-medium text-slate-100">{overview.completedCount}</span></p>
                    <p>Failed: <span className="font-medium text-slate-100">{overview.failedCount}</span></p>
                    <p>Last run assets: <span className="font-medium text-slate-100">{overview.lastProcessedAssets ?? 0}</span></p>
                    <p>Last run duration: <span className="font-medium text-slate-100">{overview.lastDurationMs ?? 0} ms</span></p>
                    <p>Last run at: <span className="font-medium text-slate-100">{overview.lastRunAt ? format(overview.lastRunAt, "yyyy-MM-dd HH:mm:ss") : "Not yet"}</span></p>
                    <p>Tracked test months: <span className="font-medium text-slate-100">{testMonthCount}</span></p>
                </div>
            )}
            <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-900 p-3 text-sm text-slate-200">
                <p className="font-medium text-slate-100">Cron job log</p>
                {cronRunLogs.length === 0 ? (
                    <p className="text-slate-400">
                        {cronHealth?.hasObservedScheduledRun
                            ? "No cron logs for this user yet."
                            : "Cron has not run in production yet."}
                    </p>
                ) : (
                    <div className="space-y-2">
                        {cronRunLogs.map((log) => (
                            <div key={log.id} className="grid gap-1 rounded-md border border-slate-800 bg-slate-950 p-3 sm:grid-cols-[180px_120px_120px_1fr]">
                                <p>{format(log.startedAt, "yyyy-MM-dd HH:mm:ss")}</p>
                                <p>{format(log.targetMonth, "MMM yyyy")}</p>
                                <p className="capitalize">{log.triggerType.replace("_", " ")}</p>
                                <div className="space-y-1">
                                    <p className="font-medium text-slate-100">{log.status}</p>
                                    <p className="text-slate-300">{log.message}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {errorMessage && <p className="text-sm text-rose-600">{errorMessage}</p>}
            {successMessage && <p className="text-sm text-emerald-600">{successMessage}</p>}
        </div>
    )
}
