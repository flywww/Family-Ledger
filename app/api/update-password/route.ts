import { updatePassword } from "@/lib/actions";
import prisma from "../../../lib/prisma";

export async function POST(req: Request) {
    try {
        await updatePassword('linhome', '29694946');
    } catch (error) {
        
    }
}