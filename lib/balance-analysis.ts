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
  const assetBalances = balances.filter((balance) => balance.holdingTypeName === "Assets");
  const filteredBalances =
    view === "all"
      ? assetBalances
      : assetBalances.filter(
          (balance) => balance.holdingCategoryName === BALANCE_ANALYSIS_CATEGORY_MAP[view],
        );

  const totalValue = filteredBalances.reduce((sum, balance) => sum + balance.value, 0);

  return filteredBalances.map((balance) => ({
    ...balance,
    percentage: totalValue > 0 ? balance.value / totalValue : 0,
  }));
}
