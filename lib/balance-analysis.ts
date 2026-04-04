import { balanceAnalysisViewType, FlattedBalanceType } from "@/lib/definitions";

export const BALANCE_ANALYSIS_VIEW_LABELS: Record<balanceAnalysisViewType, string> = {
  all: "All",
  cash: "Cash",
  crypto: "Crypto currency",
  stock: "Stock",
};

const BALANCE_ANALYSIS_CATEGORY_MAP: Record<Exclude<balanceAnalysisViewType, "all">, string> = {
  cash: "Cash",
  crypto: "Cryptocurrency",
  stock: "Listed stock",
};

export function resolveBalanceAnalysisView(value?: string): balanceAnalysisViewType {
  if (value === "cash" || value === "crypto" || value === "stock") {
    return value;
  }

  return "all";
}

export function applyBalanceAnalysisView(
  balances: FlattedBalanceType[],
  view: balanceAnalysisViewType,
): FlattedBalanceType[] {
  const filteredBalances =
    view === "all"
      ? balances
      : balances.filter(
          (balance) => balance.holdingCategoryName === BALANCE_ANALYSIS_CATEGORY_MAP[view],
        );

  const totalValueByType = filteredBalances.reduce<Record<string, number>>((totals, balance) => {
    const typeName = balance.holdingTypeName;
    totals[typeName] = (totals[typeName] ?? 0) + balance.value;
    return totals;
  }, {});

  return filteredBalances.map((balance) => ({
    ...balance,
    percentage:
      totalValueByType[balance.holdingTypeName] > 0
        ? balance.value / totalValueByType[balance.holdingTypeName]
        : 0,
  }));
}
