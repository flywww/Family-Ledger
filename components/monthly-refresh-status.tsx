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
  idle: "border-slate-200 bg-slate-50 text-slate-600",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  running: "border-sky-200 bg-sky-50 text-sky-700",
  partial_complete: "border-orange-200 bg-orange-50 text-orange-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  failed: "border-rose-200 bg-rose-50 text-rose-700",
};

export default function MonthlyRefreshStatus({
  overview,
  action,
}: {
  overview?: MonthlyRefreshOverview;
  action?: React.ReactNode;
}) {
  if (!overview || overview.status === "idle") {
    return null;
  }

  const statusLabel = statusLabels[overview.status];

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white/80 p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusClasses[overview.status]}`}
          >
            {statusLabel}
          </span>
          <span className="text-sm text-slate-600">
            {overview.completedCount} refreshed, {overview.estimatedCount} estimated
          </span>
          {overview.failedCount > 0 && (
            <span className="text-sm text-slate-600">{overview.failedCount} failed</span>
          )}
        </div>
        {action}
      </div>
      {(overview.status === "pending" || overview.status === "running") && (
        <p className="text-sm text-slate-500">
          Totals are estimated until the monthly quote refresh finishes.
        </p>
      )}
      {overview.status === "partial_complete" && (
        <p className="text-sm text-slate-500">
          Some assets could not be refreshed automatically. Retry only the failed assets when
          you are ready.
        </p>
      )}
    </div>
  );
}
