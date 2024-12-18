'use client'

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { SettingContext } from "@/context/settingContext"
import { currencyType } from "@/lib/definitions"
import { convertCurrency } from "@/lib/utils"
import { useContext, useEffect, useState } from "react"
import { CartesianGrid, XAxis, Line, LineChart } from "recharts"

export default function DashboardLineChart({
    title,
    labels,
    highlightLabel,
    data,
    xAxisDataKey,
}:{
    title: string,
    labels: string[],
    highlightLabel: string,
    data: Array<Record<string, string | number>>,
    xAxisDataKey: string
}){
    const [displayedCurrency, setDisplayedCurrency] = useState<currencyType>('USD');
    const [convertedData, setConvertedData] = useState(data);
    const settingContext = useContext(SettingContext);
    if(!settingContext){
        throw Error ("Setting must be used within a setting provider")
    }
    const { setting } = settingContext;         
    useEffect(()=>{
        console.log(`line-chart useEffect - setting`);
        
        if (setting && 'displayCurrency' in setting){
            setDisplayedCurrency(setting.displayCurrency as currencyType);
        }
    }, [setting])

    useEffect(()=>{
        console.log(`line-chart useEffect - displaycurrency`);
        const newData = data.reduce( (dataArray, dataObject) => {
            let newDataObject: Record<string, string | number> = {};
            const date = new Date(dataObject['date']);
            for (const [key, value] of Object.entries(dataObject)){
                if(key === 'date'){
                    newDataObject[key] = value;
                }else{
                    newDataObject[key] = convertCurrency('USD', displayedCurrency, value as number, date)
                }
            }
            dataArray.push(newDataObject);              
            return dataArray;
        }, [] as Array<Record<string, string | number>> )
        setConvertedData(newData);
    }, [data, displayedCurrency])

    const colors = [
        "hsl(var(--chart-1))", 
        "hsl(var(--chart-2))", 
        "hsl(var(--chart-3))", 
        "hsl(var(--chart-4))", 
        "hsl(var(--chart-5))",
    ]

    const chartConfig = labels.reduce((config, label, index) => {
        config[label.replace(/\s+/g,"")] = {
            label: label,
            color: colors[index % colors.length]
        }
        return config;
    }, {} as Record<string, { label: string; color: string }>) satisfies ChartConfig;

    return (
        <Card className="max-w-lg">
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig}>
                        <LineChart
                            accessibilityLayer
                            data={convertedData}
                            margin={{
                                left: 12,
                                right: 12
                            }}
                        >
                            <CartesianGrid vertical={false}/>
                            <XAxis
                                dataKey={xAxisDataKey}
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                tickFormatter={(value) => value.slice(3,7)}
                            />
                            <ChartTooltip cursor={true} content={<ChartTooltipContent/>}/>
                            {labels.map(label => (
                                <Line
                                    dataKey={label}
                                    type="natural"
                                    stroke={`var(--color-${label.replace(/\s+/g,"")})`}
                                    strokeWidth = {label === highlightLabel ? 3 : 1}
                                    dot={false}
                                />
                            ))}

                        </LineChart>
                    </ChartContainer>
                    <CardFooter>
                        <p>Footer</p>
                    </CardFooter>
                </CardContent>
            </Card>
    )
}