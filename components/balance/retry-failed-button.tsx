'use client'

import { retryFailedMonthlyRefresh } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function RetryFailedButton({ date }: { date: Date }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await retryFailedMonthlyRefresh(date);
          router.refresh();
        });
      }}
    >
      {isPending ? "Retrying..." : "Retry Failed Only"}
    </Button>
  );
}
