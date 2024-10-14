import { NextResponse } from "next/server";
import fs, { link } from 'fs';
import path from "path";
import prisma from "@/lib/prisma";
import pLimit from 'p-limit';
import csvParser from 'csv-parser'
import { log } from "console";


export async function POST(req: Request){
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
        const limit = pLimit(10);
        const results: any[] = [];
        const stream = fs.createReadStream(filePath)
                        .pipe(csvParser())
                        .on('data', async (row) => {
                            row.Date = new Date(row.Date);
                            row.Quantity = row.Quantity? parseFloat(row.Quantity.replace(/,/g,'')) : 0;
                            row.Price = row.Price? parseFloat(row.Price.replace(/,/g,'')) : 0;
                            row.TotalValue = row.TotalValue? parseFloat(row.TotalValue.replace(/,/g,'')) : 0;

                            await limit(async () => {
                                let user = await prisma.user.findUnique({
                                    where:{
                                        account: 'linhome'
                                    }
                                })
                                if (!user) {
                                    user = await prisma.user.create({
                                        data:{
                                            account: 'linhome',
                                            password: '29694946',
                                        }
                                    })
                                }
    
                                let category = await prisma.category.findUnique({
                                    where:{ name: row.Category }
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
    
                                let holding = await prisma.holding.upsert({
                                    where:{
                                        name_symbol: { name: row.Name, symbol: row.Symbol },
                                    },
                                    update:{},
                                    create:{
                                            name: row.Name,
                                            symbol: row.Symbol,
                                            typeId: type.id,
                                            categoryId: category.id,
                                            userId: user.id,
                                    }
                                });
                                
                                await prisma.balance.create({
                                    data:{
                                        date: row.Date,
                                        quantity: row.Quantity,
                                        price: row.Price,
                                        value: row.TotalValue,
                                        note: row.Note,
                                        currency: 'TWD',
                                        holdingId: holding.id,
                                        userId: user.id,
                                    }
                                })
                            })
                        })
                        .on('end', () => {
                            console.log(results);
                        });
        return NextResponse.json({ success: true, data: results });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to process CSV' }, { status: 500 });
    }
}