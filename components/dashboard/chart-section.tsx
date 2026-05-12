import { ValueData } from "@/lib/definitions"
import { getMonthKey } from "@/lib/utils"
import DashboardLineChart from "./dashboard-line-chart"
import DashboardPieChart from "./dashboard-pie-chart"

const LIABILITY_TYPE_NAME = "Liabilities";
const TOTAL_LABEL = "Total";

function isLiabilityData(data: ValueData) {
    return data.type.name === LIABILITY_TYPE_NAME;
}

function getCategoryLabels(data: ValueData[]) {
    return Array.from(new Set(data.map((item) => item.category.name)));
}

function buildLineChartData(valueData: ValueData[], labels: string[]) {
    return valueData
        .reduce((dataSet, data) => {
            let dateEntry = dataSet.find(entry => entry.date === data.date.toDateString())
            if(!dateEntry){
                dateEntry = {date: data.date.toDateString()};
                labels.forEach(label => {
                    dateEntry![label] = 0;
                })
                dataSet.push(dateEntry);
            }
            dateEntry[data.category.name] = data.value;
            dateEntry[TOTAL_LABEL] = (Number(dateEntry[TOTAL_LABEL]) || 0) + data.value;

            return dataSet;
        }, [] as Array<Record<string, string | number>>)
        .sort((a,b) => {
            return new Date(a.date as string).getTime() - new Date(b.date as string).getTime();
        })
}

function buildPieChartData(valueData: ValueData[]) {
    return valueData.reduce((dataSet, data) => {
        const cssSafeCategory = data.category.name.replace(/\s+/g, "")
        dataSet.push({
            category: data.category.name,
            value: data.value,
            fill:`var(--color-${cssSafeCategory})`,
            labelSafeKey: cssSafeCategory,
        })
        return dataSet;
    }, [] as Array<Record<string, string | number>>)
}

export default function ChartSection({
    queryDate, 
    categories,
    valueData, 
}:{
    queryDate: Date,
    categories: string[],
    valueData: ValueData[] | undefined,
}){
    const dashboardValueData = valueData || [];

    // Line Chart
    const assetValueData = dashboardValueData.filter(data => !isLiabilityData(data));
    const liabilityValueData = dashboardValueData.filter(data => isLiabilityData(data));
    const liabilityLabels = getCategoryLabels(liabilityValueData);
    const assetsLineChartLabels = [TOTAL_LABEL, ...categories]
    const liabilityLineChartLabels = [TOTAL_LABEL, ...liabilityLabels]
    const assetsLineChartData = buildLineChartData(assetValueData, assetsLineChartLabels)
    const liabilityLineChartData = buildLineChartData(liabilityValueData, liabilityLineChartLabels)

    // Pie Chart
    const assetsPieChartLabels = [...categories]
    const queryMonthKey = getMonthKey(queryDate)
    const assetsPieChartValueData = dashboardValueData.filter(data => {
        const isNotLiability = !isLiabilityData(data)
        const isThisMonth = getMonthKey(data.date) === queryMonthKey;
        return isNotLiability && isThisMonth
    })
    const liabilityPieChartValueData = dashboardValueData.filter(data => {
        const isLiability = isLiabilityData(data)
        const isThisMonth = getMonthKey(data.date) === queryMonthKey;
        return isLiability && isThisMonth
    })
    const assetsPieChartData = buildPieChartData(assetsPieChartValueData)
    const liabilityPieChartData = buildPieChartData(liabilityPieChartValueData)
    const liabilityPieChartLabels = getCategoryLabels(liabilityPieChartValueData)
    
    return(
        <div className="grid grid-cols-1 gap-3 w-full sm:grid-cols-3">
            <DashboardLineChart
                title = "Assets"
                labels = {assetsLineChartLabels}
                highlightLabel = {TOTAL_LABEL}
                data = {assetsLineChartData}
                xAxisDataKey = "date"
                className="col-span-1 row-span-1 sm:col-span-2 sm:row-span-1"
            />

            <DashboardPieChart
                title = "Assets ratio" 
                labels={assetsPieChartLabels}
                data={assetsPieChartData}
                labelKey="labelSafeKey"
                valueKey="value"
                className="col-span-1 row-span-1 sm:col-span-1 sm:row-span-1"
            />

            <DashboardLineChart
                title = "Liabilities"
                labels = {liabilityLineChartLabels}
                highlightLabel = {TOTAL_LABEL}
                data = {liabilityLineChartData}
                xAxisDataKey = "date"
                emptyMessage = "No liability data for the selected filters."
                className="col-span-1 row-span-1 sm:col-span-2 sm:row-span-1"
            />

            <DashboardPieChart
                title = "Liabilities ratio"
                labels={liabilityPieChartLabels}
                data={liabilityPieChartData}
                labelKey="labelSafeKey"
                valueKey="value"
                emptyMessage = "No liabilities this month."
                className="col-span-1 row-span-1 sm:col-span-1 sm:row-span-1"
            />
        </div>
    )
}  
