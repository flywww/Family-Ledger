'use client'

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { startMonthlyRefreshCronTest, stopMonthlyRefreshCronTest } from "@/lib/actions";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CronTestToggle({
    activeTargetMonth,
}:{
    activeTargetMonth?: Date | null,
}){
    const [isPending, startTransition] = useTransition();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [currentTargetMonth, setCurrentTargetMonth] = useState<Date | null>(
        activeTargetMonth ?? null,
    );
    const router = useRouter();

    useEffect(() => {
        setCurrentTargetMonth(activeTargetMonth ?? null);
    }, [activeTargetMonth]);

    const handleClick = () => {
        setErrorMessage(null);
        setSuccessMessage(null);

        startTransition(() => {
            void (async () => {
                const result = currentTargetMonth
                    ? await stopMonthlyRefreshCronTest()
                    : await startMonthlyRefreshCronTest();

                if (result?.error) {
                    setErrorMessage(result.error);
                    return;
                }

                setCurrentTargetMonth(result?.targetMonth ?? null);
                setSuccessMessage(
                    currentTargetMonth
                        ? "Cron job testing data restored."
                        : "Cron job test created and executed for next month.",
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
                    Start a test to copy the current accounting month into next month and run the
                    monthly refresh job immediately. Stop test removes the generated month data.
                </p>
                {currentTargetMonth && (
                    <p className="text-sm text-slate-600">
                        Testing month: {format(currentTargetMonth, "MMM yyyy")}
                    </p>
                )}
            </div>
            <div className="flex items-center gap-3">
                <Button type="button" onClick={handleClick} disabled={isPending}>
                    {isPending
                        ? currentTargetMonth
                            ? "Stopping test..."
                            : "Starting test..."
                        : currentTargetMonth
                            ? "Stop test"
                            : "Start test"}
                </Button>
                {currentTargetMonth && (
                    <Button asChild variant="outline">
                        <Link href={`/balance?date=${currentTargetMonth.toUTCString()}`}>
                            Open test month
                        </Link>
                    </Button>
                )}
            </div>
            {errorMessage && <p className="text-sm text-rose-600">{errorMessage}</p>}
            {successMessage && <p className="text-sm text-emerald-600">{successMessage}</p>}
        </div>
    )
}
