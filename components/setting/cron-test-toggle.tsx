'use client'

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { startMonthlyRefreshCronTest, stopMonthlyRefreshCronTest } from "@/lib/actions";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MonthlyRefreshOverview } from "@/lib/definitions";

export default function CronTestToggle({
    activeTargetMonth,
    displayTargetMonth,
    startedAt,
    hasTestData,
    staleTestData,
    testMonthCount,
    overview,
}:{
    activeTargetMonth?: Date | null,
    displayTargetMonth?: Date | null,
    startedAt?: Date | null,
    hasTestData: boolean,
    staleTestData: boolean,
    testMonthCount: number,
    overview?: MonthlyRefreshOverview,
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

    const handleClick = () => {
        setErrorMessage(null);
        setSuccessMessage(null);

        startTransition(() => {
            void (async () => {
                const result = currentTargetMonth || hasCurrentTestData
                    ? await stopMonthlyRefreshCronTest()
                    : await startMonthlyRefreshCronTest();

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
        <div className="flex w-full max-w-xl flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="space-y-1">
                <h2 className="text-lg font-semibold text-slate-900">Cron Job Test</h2>
                <p className="text-sm text-slate-500">
                    Start test only prepares next-month test data. Use the deployed cron route to
                    run the real refresh flow. Clean test data removes all tagged test artifacts.
                </p>
                {currentDisplayMonth && (
                    <p className="text-sm text-slate-600">
                        Testing month: {format(currentDisplayMonth, "MMM yyyy")}
                    </p>
                )}
                {startedAt && hasCurrentTestData && (
                    <p className="text-sm text-slate-600">
                        Prepared at: {format(startedAt, "yyyy-MM-dd HH:mm")}
                    </p>
                )}
                {hasStaleTestData && (
                    <p className="text-sm text-amber-600">
                        Stale test data was detected. Clean it before starting a new test.
                    </p>
                )}
            </div>
            <div className="flex items-center gap-3">
                <Button type="button" onClick={handleClick} disabled={isPending}>
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
                        <Link href={`/balance?date=${currentDisplayMonth.toUTCString()}`}>
                            Open test month
                        </Link>
                    </Button>
                )}
            </div>
            {hasCurrentTestData && (
                <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                    <p className="font-medium text-slate-900">Run the deployed cron route</p>
                    <p>
                        Manual production test uses the real cron endpoint. Replace the placeholders
                        with your deployed domain and secret.
                    </p>
                    <pre className="overflow-x-auto rounded bg-slate-900 p-3 text-xs text-slate-100">
{`curl -i -X GET https://YOUR_DOMAIN/api/cron/monthly-refresh \\
  -H "Authorization: Bearer YOUR_CRON_SECRET"`}
                    </pre>
                    <p>
                        Manual calls appear in Vercel Runtime Logs. Scheduled cron calls appear in
                        the Cron Jobs page.
                    </p>
                </div>
            )}
            {overview && currentDisplayMonth && (
                <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 sm:grid-cols-2">
                    <p>Status: <span className="font-medium text-slate-900">{overview.status}</span></p>
                    <p>Pending: <span className="font-medium text-slate-900">{overview.pendingCount}</span></p>
                    <p>Completed: <span className="font-medium text-slate-900">{overview.completedCount}</span></p>
                    <p>Failed: <span className="font-medium text-slate-900">{overview.failedCount}</span></p>
                    <p>Last run assets: <span className="font-medium text-slate-900">{overview.lastProcessedAssets ?? 0}</span></p>
                    <p>Last run duration: <span className="font-medium text-slate-900">{overview.lastDurationMs ?? 0} ms</span></p>
                    <p>Last run at: <span className="font-medium text-slate-900">{overview.lastRunAt ? format(overview.lastRunAt, "yyyy-MM-dd HH:mm:ss") : "Not yet"}</span></p>
                    <p>Tracked test months: <span className="font-medium text-slate-900">{testMonthCount}</span></p>
                </div>
            )}
            {errorMessage && <p className="text-sm text-rose-600">{errorMessage}</p>}
            {successMessage && <p className="text-sm text-emerald-600">{successMessage}</p>}
        </div>
    )
}
