const MIN_CHART_DOMAIN_PADDING = 1;
const CHART_DOMAIN_PADDING_RATIO = 0.25;

export function paddedYAxisDomain([dataMin, dataMax]: [number, number]): [number, number] {
  const range = dataMax - dataMin;
  const padding =
    range === 0
      ? Math.max(Math.abs(dataMax) * CHART_DOMAIN_PADDING_RATIO, MIN_CHART_DOMAIN_PADDING)
      : Math.max(range * CHART_DOMAIN_PADDING_RATIO, MIN_CHART_DOMAIN_PADDING);

  return [Math.max(0, dataMin - padding), dataMax + padding];
}
