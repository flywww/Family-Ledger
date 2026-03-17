import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "../../../lib/prisma";
import { rebuildValueDataForMonth } from "@/lib/monthly-refresh";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const dateArray = await prisma.balance.findMany({
            where:{
                userId: session.user.id,
            },
            distinct:['date'],
            select:{
                date: true
            }
        })

        await Promise.all(dateArray.map(async ({date}) => {
            await rebuildValueDataForMonth(session.user.id, date);
        }));

        return NextResponse.json({ success: true, rebuiltDates: dateArray.length });

    } catch (error) {
        console.log(`[createValueData] error: ${error}`);
        return NextResponse.json({ error: "Failed to rebuild value data" }, { status: 500 });
    }
}
