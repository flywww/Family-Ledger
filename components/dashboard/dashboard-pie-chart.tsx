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
                    <Pie data={data} dataKey={valueKey}>
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