import { format } from "date-fns";
import Search from "@/components/balance/search";
import BalanceTable from "@/components/balance/balance-table";
import { firstDateOfMonth } from "@/lib/utils";
import { buttonVariants, Button } from "@/components/ui/button";
import Link from "next/link";

export default async function Page({
  searchParams,
}:{
  searchParams?:{
    date?: string;
  }
}) {

    let queryDate = firstDateOfMonth(new Date());
    if(searchParams?.date) queryDate = new Date(searchParams.date);

    return (
      <div>
        <h1> balance page</h1>
        <Search/>
        <Button asChild>
          <Link href={`/balance/create?date=${queryDate}`}> New </Link>
        </Button>
        <BalanceTable date={ queryDate }/>
      </div>
    )
  }