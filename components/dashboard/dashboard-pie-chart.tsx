'use client'

import {
    Card,
    CardContent,
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
    emptyMessage,
    className,
}:{
    title: string,
    labels: string[],
    data: Array<Record<string, string | number>>,
    labelKey: string,
    valueKey: string,
    emptyMessage?: string,
    className?: string,
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
        return config;
    }, {} as Record<string, { label: string; color?: string }> ) satisfies ChartConfig;

    const hasChartData = data.some((entry) => Number(entry[valueKey]) > 0);

    return (
        <Card className={`flex flex-col w-full ${className || ""}`}>
            <CardHeader className="items-center pb-0">
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                {hasChartData || !emptyMessage ? (
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
                ) : (
                    <div className="mx-auto flex aspect-square max-h-[300px] w-full items-center justify-center rounded-md border border-dashed border-border bg-muted/20 px-4 text-center text-sm text-muted-foreground">
                        {emptyMessage}
                    </div>
                )}
            </CardContent>
    </Card>
    )
}
