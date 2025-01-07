import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"  

export default async function SummaryCard({
    title,
    value,
    description,
    currency,
    className,
}:{
    title: string,
    value: string,
    description: string,
    currency: string,
    className?: string,
}){
    return(
            <Card className={`w-full ${className}`}>
                <CardHeader>
                    <CardTitle> {title} </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-row gap-2 justify-start items-baseline">
                        <p className="font-normal text-xl">{value}</p>
                        <p className="text-sm font-extralight">{currency}</p>    
                    </div>        
                    <CardDescription>{description}</CardDescription>
                </CardContent>
            </Card>
    )
}