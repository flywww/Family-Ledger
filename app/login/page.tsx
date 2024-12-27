import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"  
import LoginForm from "@/components/login/login-form"

export default function LoginPage(){
    return(
        <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-blue-500 to-slate-500 overflow-hidden sm:overflow-auto">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Family Ledger</CardTitle>
                    <CardDescription>
                        <p className="text-center">Please login to continue</p>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <LoginForm/>
                </CardContent>
            </Card>
        </div>
    )
}