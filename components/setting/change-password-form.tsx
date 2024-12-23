'use client'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DialogClose } from "@radix-ui/react-dialog"
import { useState } from "react"
import { updatePassword } from "@/lib/actions"
import { useSession } from "next-auth/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

export default function ChangePasswordForm(){
    const [dialogOpen, setDialogOpen] = useState(false)
    const { data: session } = useSession();
    const form = useForm({
        resolver:zodResolver(z
            .object({
            newPassword: z.string().min(6, "Password must be at least 6 characters."),
            retypePassword: z.string(),
        })
        .refine((data) => data.newPassword === data.retypePassword, {
            message:"Password must match",
            path: ["retypePassword"],
        })),
        defaultValues:{
            newPassword: "",
            retypePassword: "",
        }
    })

    const onSubmit = async ({newPassword}: {newPassword:string}) => {
        if(session){
            await updatePassword(session.user.account,newPassword)
            setDialogOpen(false)
        }
    }

    return(
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" onClick={() => setDialogOpen(true)}>Change password</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Change password</DialogTitle>
                    <DialogDescription></DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                        <FormField
                            control={form.control}
                            name="newPassword"
                            render={({field}) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>New password</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                className="w-80"
                                                placeholder="Input new password"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                        />
                        <FormField              
                            control={form.control}
                            name="retypePassword"
                            render={({field}) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Repeat password</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                className="w-80"
                                                placeholder="repeat new password"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                    />
                    <DialogFooter className="pt-4">
                        <DialogClose asChild>
                            <Button variant="secondary">Cancel</Button>
                        </DialogClose>
                        <Button type="submit">Submit change</Button>
                    </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}