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
import { CartesianGrid, XAxis, Line, LineChart } from "recharts"

export default function DashboardLineChart({
    title,
    labels,
    highlightLabel,
    data,
    xAxisDataKey,
    className,
}:{
    title: string,
    labels: string[],
    highlightLabel: string,
    data: Array<Record<string, string | number>>,
    xAxisDataKey: string,
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

    return (
        <Card className={`w-full ${className}`}>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent>
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
                                    type="natural"
                                    stroke={`var(--color-${label.replace(/\s+/g,"")})`}
                                    strokeWidth = {label === highlightLabel ? 3 : 1}
                                    dot={false}
                                />
                            ))}

                        </LineChart>
                    </ChartContainer>
                </CardContent>
            </Card>
    )
}