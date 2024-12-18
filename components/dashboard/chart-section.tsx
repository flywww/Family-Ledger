import { currencyType, ValueData } from "@/lib/definitions"
import DashboardLineChart from "./dashboard-line-chart"
import DashboardPieChart from "./dashboard-pie-chart"

export default function ChartSection({
    queryDate, 
    categories,
    valueData, 
}:{
    queryDate: Date,
    categories: string[],
    valueData: ValueData[] | undefined,
}){
    // Line Chart
    const assetsLineChartLabels = ["Total", ...categories]
    const assetsLineChartData = valueData
                        ?.filter(data => data.type.name !== "Liabilities")
                        .reduce((dataSet, data) => {
                            let dateEntry = dataSet.find( entry => entry.date === data.date.toDateString())
                            if(!dateEntry){
                                dateEntry = {date: data.date.toDateString()};
                                assetsLineChartLabels.forEach(label => {
                                    dateEntry![label] = 0;
                                })
                                dataSet.push(dateEntry);
                            }
                            dateEntry[data.category.name] = data.value;
                            dateEntry['Total'] = (Number(dateEntry['Total']) || 0) + data.value;  
                            
                            
                            return dataSet;
                        }, [] as Array<Record<string, string | number>>)
                        .sort((a,b) => {
                            return new Date(a.date as string).getTime() - new Date(b.date as string).getTime();
                        })

    // Pie Chart
    const assetsPieChartLabels = [...categories]
    const assetsPieChartData = valueData?.filter( data => {
        const isNotLiability = data.type.name !== 'Liabilities'
        const isThisMonth = data.date.getTime() === queryDate.getTime();
        return isNotLiability && isThisMonth
    }).reduce((dataSet, data) => {
        
        const cssSafeCategory = data.category.name.replace(/\s+/g, "")
        let dataEntry = {
            category: data.category.name, 
            value: data.value, 
            fill:`var(--color-${cssSafeCategory})`,
            labelSafeKey: cssSafeCategory,
        }
        dataSet.push(dataEntry)
        return dataSet;
    }, [] as Array<Record<string, string | number>>)
    

    return(
        <div className="">
            {assetsLineChartData && <DashboardLineChart
                title = "Assets"
                labels = {assetsLineChartLabels}
                highlightLabel = "Total"
                data = {assetsLineChartData}
                xAxisDataKey = "date"
            />}

            {assetsPieChartData && <DashboardPieChart
                title = "Assets ratio" 
                labels={assetsPieChartLabels}
                data={assetsPieChartData}
                labelKey="labelSafeKey"
                valueKey="value"
            />}
        </div>
    )
}  