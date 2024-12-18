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
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { SettingContext } from "@/context/settingContext";
import { currencyType } from "@/lib/definitions";
import { convertCurrency } from "@/lib/utils";
import { useContext, useEffect, useState } from "react";
import { Pie, PieChart, LabelList } from "recharts"

export default function DashboardPieChart({
    title,
    labels,
    data,
    labelKey,
    valueKey,
}:{
    title: string,
    labels: string[],
    data: Array<Record<string, string | number>>,
    labelKey: string,
    valueKey: string,
}){

    const [displayedCurrency, setDisplayedCurrency] = useState<currencyType>('USD');
    const [convertedData, setConvertedData] = useState(data);
    const settingContext = useContext(SettingContext);
    if(!settingContext){
        throw Error ("Setting must be used within a setting provider")
    }
    const { setting } = settingContext;         
    useEffect(()=>{
        console.log(`pie-chart useEffect - setting`);
        if (setting && 'displayCurrency' in setting){
            setDisplayedCurrency(setting.displayCurrency as currencyType);
        }
    }, [setting])

    useEffect(()=>{
        console.log(`pie-chart useEffect - setting`);
        const newData = data.map( dataItem => (
            { ...dataItem,
                value: convertCurrency('USD', displayedCurrency, dataItem['value'] as number, new Date()) //TODO: update currency ex-rate by date
            }
        ))
        setConvertedData(newData);
    }, [data, displayedCurrency])

    const colors = [
        "hsl(var(--chart-1))", 
        "hsl(var(--chart-2))", 
        "hsl(var(--chart-3))", 
        "hsl(var(--chart-4))", 
        "hsl(var(--chart-5))",
    ]
    
    const pieChartConfig = labels.reduce( (config, label, index) => {
        const cssSafeLabel = label.replace(/\s+/g, "");
        config[cssSafeLabel] = {
            label: label,
            color: colors[index % colors.length]
        }
        config[valueKey] = {
            label: valueKey
        }
        console.log(`config: ${JSON.stringify(config)}`);
        
        return config;
    }, {} as Record<string, { label: string; color?: string }> ) satisfies ChartConfig;

    return (
        <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
            <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
            <ChartContainer
                config={pieChartConfig}
                className="mx-auto aspect-square max-h-[300px] [&_.recharts-text]:fill-background"
            >
                <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey={labelKey}/>}/>
                    <Pie data={convertedData} dataKey={valueKey}>
                        <LabelList
                            dataKey={labelKey}
                            className="fill-background"
                            stroke="none"
                            fontSize={12}
                            formatter={(value: keyof typeof pieChartConfig) =>
                                pieChartConfig[value]?.label
                            }
                        /> 
                    </Pie>
                    <ChartLegend
                            content={<ChartLegendContent nameKey={labelKey} />}
                            className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                        />
                </PieChart>
            </ChartContainer>
        </CardContent>
    </Card>
    )
}