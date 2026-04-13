'use client'

import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { LoginCredentials, LoginSchema } from "@/lib/definitions"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { authenticate } from "@/lib/actions";
import LoadingSpinner from "../ui/loading-spinner";
import { useState } from "react";

export default function LoginForm(){
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loginMessage, setLoginMessage] = useState<string>("");
    const form = useForm<LoginCredentials>({
        resolver: zodResolver(LoginSchema),
        defaultValues: {
            account: "",
            password: "",
        },
    })

    const onSubmit = async (values: LoginCredentials) => {
        try {
            setIsLoading(true);
            const result = await authenticate(undefined, values);
            if(result.error){
                setIsLoading(false);
                setLoginMessage(result.error);
            }
        } catch (error) {
            setIsLoading(false);
            console.log(`[LoginForm] error: ${JSON.stringify(error)}`);
        }
    }
    
    return(
        <div className="w-auto">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}  className="space-y-2">
                    <FormField
                        control={form.control}
                        name="account"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel className="text-lg">Account</FormLabel>
                                <FormControl>
                                    <Input placeholder="Please input account name" {...field}/>
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel className="text-lg">Password</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="Please input password" {...field}/>
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                    <br />
                    <Button 
                        className="w-full mt-8 mb-6"
                        variant='default' 
                        type="submit"
                        size="lg"
                        disabled={isLoading}
                    >
                        { isLoading ? <LoadingSpinner size={6}/> : "Log in" }
                    </Button>
                    <p className="text-sm text-red-500">{loginMessage}</p>
                    <p className="text-sm text-muted-foreground">Demo login: `demo` / `demo`</p>
                    <br />
                    <br />
                </form>
            </Form>

        </div>
    )
}
