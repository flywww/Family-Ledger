import ChangePasswordForm from "@/components/setting/change-password-form";
import { Metadata }  from "next";
import { auth } from "@/auth";

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
      </div>
      
    );
  }
