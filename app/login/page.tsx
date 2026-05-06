import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"  
import LoginForm from "@/components/login/login-form"

export default function LoginPage(){
    return(
        <div className="flex min-h-screen flex-col items-center justify-center overflow-hidden bg-muted p-4 sm:overflow-auto">
            <Card className="w-full max-w-sm shadow-sm">
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
