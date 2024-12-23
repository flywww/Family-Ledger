'use client'

import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useForm } from "react-hook-form";

export default function Page() {
  const { data:session } = useSession();
  const form = useForm({
    defaultValues:{
      newPassword: "",
      retypePassword: "",
    }
  })

  return (
      <div>
        <p>Setting Page</p>
        <p>{session?.user.account}</p>
        <p>{session?.user.id}</p>
        <Button onClick={()=>{
          fetch('/api/create-valueData', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'value' }) // Adjust payload as needed
          })
          .then(response => response.json())
          .then(data => console.log(data))
          .catch(error => console.error(error));
        }}> Create valueData </Button>
        <br />
        <Button onClick={()=>{
          fetch('/api/update-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'value' })
          })
          .then(response => response.json())
          .then(data => console.log(data))
          .catch(error => console.error(error))
        }}> Update Password </Button>
      </div>
    );
  }