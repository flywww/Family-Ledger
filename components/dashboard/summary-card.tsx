import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"  

export default function SummaryCard({
    title,
    value,
    description,
    currency,
}:{
    title: string,
    value: string,
    description: string,
    currency: string,
}){
    return(
            <Card className="min-w-48 max-w-56">
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