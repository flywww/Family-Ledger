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
import { User, UserSchema } from "@/lib/definitions"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { authenticate } from "@/lib/actions";

export default function LoginForm(){
    const form = useForm<User>({
        resolver: zodResolver(UserSchema),
        defaultValues: {
            account: "",
            password: "",
        },
    })

    const onSubmit = (values: User) => {
        console.log("onSubmit triggered with values:", values);
        authenticate(undefined, values)
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
                    >
                        Log in
                    </Button>
                    <br />
                    <br />
                </form>
            </Form>

        </div>
    )
}