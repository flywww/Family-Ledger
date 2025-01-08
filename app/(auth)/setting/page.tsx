import ChangePasswordForm from "@/components/setting/change-password-form";
import { Separator } from "@/components/ui/separator";
import { Metadata }  from "next";
import { auth } from "@/auth";
import AdminActions from "@/components/setting/admin-actions";

export const metadata: Metadata = {
	title: 'Setting',
};

export default async function Page() {
  const session = await auth();

  return (
      <div className="flex flex-col gap-4 justify-start items-center">
        <div className="flex flex-col gap-1 items-center">
          <h1 className="text-3xl max-w-40">{session?.user.account}</h1>
          <p className="text-sm text-slate-500">{session?.user.id}</p>
        </div>
        <ChangePasswordForm/>
        { session && session.user && session.user.id === 'cm4qh5eyz0000dh7ccntzdddz' &&
            
            <div className="flex flex-col gap-3 items-center">
            <Separator className="my-4 min-w-64"/>
            <p>Admin feature</p>
            <AdminActions/>
          </div>
        }
      </div>
      
    );
  }