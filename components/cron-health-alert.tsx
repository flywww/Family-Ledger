import { CronHealthState } from "@/lib/definitions";
import { format } from "date-fns";

const toneClasses: Record<NonNullable<CronHealthState["severity"]>, string> = {
  info: "border-sky-200 bg-sky-50 text-sky-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  critical: "border-rose-200 bg-rose-50 text-rose-800",
};

export default function CronHealthAlert({
  health,
  forceVisible = false,
}: {
  health?: CronHealthState;
  forceVisible?: boolean;
}) {
  if (!health) {
    return null;
  }

  const severity = health.severity ?? "info";
  const shouldRender =
    forceVisible ||
    Boolean(health.message) ||
    health.isOverdue ||
    health.isCurrentMonthMissing;

  if (!shouldRender) {
    return null;
  }

  return (
    <div className={`rounded-xl border p-4 ${toneClasses[severity]}`}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold">Cron health</p>
          <p className="text-xs uppercase tracking-wide">
            {health.lastScheduledStatus ?? "no scheduled logs"}
          </p>
        </div>
        {health.message && <p className="text-sm">{health.message}</p>}
        <div className="grid gap-1 text-xs sm:grid-cols-2">
          <p>
            Last scheduled run:{" "}
            {health.lastScheduledRunAt
              ? format(health.lastScheduledRunAt, "yyyy-MM-dd HH:mm:ss")
              : "Not observed yet"}
          </p>
          <p>
            Last successful run:{" "}
            {health.lastSuccessfulScheduledRunAt
              ? format(health.lastSuccessfulScheduledRunAt, "yyyy-MM-dd HH:mm:ss")
              : "Not observed yet"}
          </p>
          <p>
            Expected last run: {format(health.expectedLastScheduledRunAt, "yyyy-MM-dd HH:mm:ss")}
          </p>
          <p>Next run: {format(health.nextScheduledRunAt, "yyyy-MM-dd HH:mm:ss")}</p>
        </div>
      </div>
    </div>
  );
}
