import type { Holding } from "./definitions";

export type BalancePricePrefill =
  | {
      kind: "cryptocurrency";
      sourceId: string;
      currency: "USD";
    }
  | {
      kind: "listed-security";
      sourceId: string;
      currency: "USD" | "TWD";
    };

export function isQuoteBackedBalanceCategory(categoryName: string | null | undefined) {
  const normalized = categoryName?.trim().toLowerCase();
  return (
    normalized === "cryptocurrency" ||
    normalized === "listed stock" ||
    normalized === "etf" ||
    normalized === "exchange traded fund" ||
    normalized === "exchange-traded fund"
  );
}

export function getBalancePricePrefill(
  holding: Pick<Holding, "sourceId" | "category">,
): BalancePricePrefill | null {
  const sourceId = holding.sourceId?.trim();
  if (!sourceId) {
    return null;
  }

  const categoryName = holding.category?.name?.trim().toLowerCase();
  if (categoryName === "cryptocurrency") {
    return {
      kind: "cryptocurrency",
      sourceId,
      currency: "USD",
    };
  }

  if (
    categoryName === "listed stock" ||
    categoryName === "etf" ||
    categoryName === "exchange traded fund" ||
    categoryName === "exchange-traded fund"
  ) {
    return {
      kind: "listed-security",
      sourceId,
      currency: sourceId.startsWith("TWSE:") || sourceId.startsWith("TPEX:") ? "TWD" : "USD",
    };
  }

  return null;
}
