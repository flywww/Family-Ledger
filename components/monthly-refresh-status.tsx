import { MonthlyRefreshOverview } from "@/lib/definitions";

const statusLabels: Record<MonthlyRefreshOverview["status"], string> = {
  idle: "Up to date",
  pending: "Estimated",
  running: "Refreshing",
  partial_complete: "Partial Complete",
  completed: "Completed",
  failed: "Failed",
};

const statusClasses: Record<MonthlyRefreshOverview["status"], string> = {
  idle: "border-border bg-muted text-muted-foreground",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  running: "border-sky-200 bg-sky-50 text-sky-700",
  partial_complete: "border-amber-200 bg-amber-50 text-amber-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  failed: "border-rose-200 bg-rose-50 text-rose-700",
};

function formatScheduledRun(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Taipei",
  }).format(date);
}

export default function MonthlyRefreshStatus({
  overview,
  action,
  nextUpdateAt,
}: {
  overview?: MonthlyRefreshOverview;
  action?: React.ReactNode;
  nextUpdateAt?: Date;
}) {
  if (!overview || overview.status === "idle" || overview.estimatedCount === 0) {
    return null;
  }

  const statusLabel = statusLabels[overview.status];
  const isUrgent = overview.status === "failed";

  return (
    <div
      className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 text-card-foreground"
      role={isUrgent ? "alert" : "status"}
      aria-live={isUrgent ? "assertive" : "polite"}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusClasses[overview.status]}`}
          >
            {statusLabel}
          </span>
          <span className="text-sm text-muted-foreground">
            {overview.completedCount} refreshed, {overview.estimatedCount} estimated
          </span>
          {overview.failedCount > 0 && (
            <span className="text-sm text-muted-foreground">{overview.failedCount} failed</span>
          )}
        </div>
        {action}
      </div>
      {(overview.status === "pending" || overview.status === "running") && (
        <p className="text-sm text-muted-foreground">
          Totals are estimated until the monthly quote refresh finishes.
        </p>
      )}
      {nextUpdateAt && (
        <p className="text-sm text-muted-foreground">
          Next automatic update: {formatScheduledRun(nextUpdateAt)} (Asia/Taipei)
        </p>
      )}
      {overview.status === "partial_complete" && (
        <p className="text-sm text-muted-foreground">
          Some assets could not be refreshed automatically. The next scheduled run will retry them,
          or you can retry only the failed assets now.
        </p>
      )}
    </div>
  );
}
