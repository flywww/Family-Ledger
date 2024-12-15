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
        authenticate(undefined, values)
    }
    
    return(
        <>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}  className="space-y-1">
                    <FormField
                        control={form.control}
                        name="account"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Account</FormLabel>
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
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <Input placeholder="Please input password" {...field}/>
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                    <Button type="submit" >Log in</Button>
                </form>
            </Form>

        </>
    )
}