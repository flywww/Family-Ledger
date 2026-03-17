import { NextResponse } from "next/server";
import fs from 'fs';
import path from "path";
import prisma from "@/lib/prisma";
import pLimit from 'p-limit';
import csvParser from 'csv-parser'
import { auth } from "@/auth";
import { Readable } from "stream";


export async function POST(req: Request){
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.formData();
    const file = data.get('file') as File;

    if(!file){
        return NextResponse.json({error: 'No file uploaded'}, {status: 400});
    }

    const uploadDir = path.join(process.cwd(), 'uploads');

    if (!fs.existsSync(uploadDir)) {
        console.log('The uploads directory does not exist. Creating uploads directory...');
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const sanitizedFileName = file.name.replace(/\s+/g, '_');  // Replace spaces with underscores
    const filePath = path.join(uploadDir, sanitizedFileName);
    const buffer = Buffer.from(await file.arrayBuffer());

    fs.writeFileSync(filePath, buffer);
    if (!fs.existsSync(filePath)) return NextResponse.json({ error: 'Failed to save the file' }, { status: 500 });

    try {
        const results: any[] = [];
        const rows = await new Promise<any[]>((resolve, reject) => {
            const parsedRows: any[] = [];
            Readable.from(buffer)
                .pipe(csvParser())
                .on('data', (row) => parsedRows.push(row))
                .on('end', () => resolve(parsedRows))
                .on('error', reject);
        });

        const limit = pLimit(10);
        await Promise.all(
            rows.map((row) =>
                limit(async () => {
                    row.Date = new Date(row.Date);
                    row.Quantity = row.Quantity ? parseFloat(row.Quantity.replace(/,/g, '')) : 0;
                    row.Price = row.Price ? parseFloat(row.Price.replace(/,/g, '')) : 0;
                    row.TotalValue = row.TotalValue ? parseFloat(row.TotalValue.replace(/,/g, '')) : 0;

                    let category = await prisma.category.findFirst({
                        where:{ name: row.Category as string}
                    })
                    if (!category) {
                        category = await prisma.category.create({
                            data:{
                                name: row.Category,
                                isHide: false
                            }
                        })
                    }

                    let type = await prisma.type.findUnique({
                        where:{ name: row.Type }
                    })
                    if (!type) {
                        type = await prisma.type.create({
                            data:{
                                name: row.Type,
                            }
                        })
                    }

                    let holding = await prisma.holding.findFirst({
                        where:{
                            name: row.Name, 
                            symbol: row.Symbol,
                            userId: session.user.id,
                        },
                    });
                    if(!holding){
                        holding = await prisma.holding.create({
                            data:{
                                name: row.Name,
                                symbol: row.Symbol,
                                typeId: type.id,
                                categoryId: category.id,
                                userId: session.user.id,
                            }
                        })
                    }
                    
                    const balance = await prisma.balance.create({
                        data:{
                            date: row.Date,
                            quantity: row.Quantity,
                            price: row.Price,
                            value: row.TotalValue,
                            note: row.Note,
                            currency: 'TWD',
                            holdingId: holding.id,
                            userId: session.user.id,
                            priceStatus: 'success',
                            priceSource: 'csv-import',
                            priceFetchedAt: new Date(),
                            priceError: null,
                        }
                    });

                    results.push(balance.id);
                })
            )
        );

        return NextResponse.json({ success: true, importedCount: results.length });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to process CSV' }, { status: 500 });
    }
}
