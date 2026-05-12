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
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { paddedYAxisDomain } from "@/lib/dashboard/chart-domain"
import { CartesianGrid, XAxis, YAxis, Line, LineChart } from "recharts"

export default function DashboardLineChart({
    title,
    labels,
    highlightLabel,
    data,
    xAxisDataKey,
    emptyMessage,
    className,
}:{
    title: string,
    labels: string[],
    highlightLabel: string,
    data: Array<Record<string, string | number>>,
    xAxisDataKey: string,
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

    const chartConfig = labels.reduce((config, label, index) => {
        config[label.replace(/\s+/g,"")] = {
            label: label,
            color: colors[index % colors.length]
        }
        return config;
    }, {} as Record<string, { label: string; color: string }>) satisfies ChartConfig;

    const hasChartData = data.length > 0 && labels.some((label) => (
        label !== highlightLabel && data.some((entry) => Number(entry[label]) > 0)
    ));

    return (
        <Card className={`w-full ${className || ""}`}>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    {hasChartData || !emptyMessage ? (
                        <ChartContainer config={chartConfig} className="h-[300px] w-full">
                            <LineChart
                                accessibilityLayer
                                data={data}
                                margin={{
                                    left: 12,
                                    right: 12
                                }}
                            >
                            <CartesianGrid vertical={false}/>
                            <YAxis
                                hide
                                domain={paddedYAxisDomain}
                            />
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
                                        key={label}
                                        dataKey={label}
                                        type="monotone"
                                        stroke={`var(--color-${label.replace(/\s+/g,"")})`}
                                        strokeWidth = {label === highlightLabel ? 3 : 1}
                                        dot={false}
                                    />
                                ))}

                            </LineChart>
                        </ChartContainer>
                    ) : (
                        <div className="flex h-[300px] w-full items-center justify-center rounded-md border border-dashed border-border bg-muted/20 px-4 text-center text-sm text-muted-foreground">
                            {emptyMessage}
                        </div>
                    )}
                </CardContent>
            </Card>
    )
}
