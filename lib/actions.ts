'use server'

import prisma from "./prisma";
import { BalanceRecord, BalanceRecordSchema, CategoryForm, CategoryFormSchema, HoldingForm, HoldingsFormSchema, TypeForm, TypeFormSchema } from "./definitions";
import { Category, Type } from "@prisma/client";
import { log } from "console";


export async function fetchMonthlyBalance( queryDate: Date  ){
    //TODO: fetch with user id
    console.log('Fetching monthly balance with date', queryDate);

    try {
        const data = await prisma.balance.findMany({
            where:{ date: queryDate },
            select:{
                id: true,
                date: true,
                quantity: true,
                price: true,
                value: true,
                currency: true,
                note: true,
                userId: true,
                createdAt: true,
                updatedAt: true,
                holding:{
                    select:{
                        name: true,
                        symbol: true,
                        type:{
                            select:{
                                name: true,
                            }
                        },
                        category:{
                            select:{
                                name: true,
                                isHide: true,
                            }
                        }
                    }
                }
            },
            orderBy:{
                id: 'asc'
            }
        })

        const balanceRecords = data.map( (balance) => {
            const parsed = BalanceRecordSchema.safeParse({
                id: balance.id,
                date: balance.date,
                holdingName: balance.holding.name,
                holdingSymbol: balance.holding.symbol,
                categoryName: balance.holding.category.name,
                categoryIsHide: balance.holding.category.isHide,
                typeName: balance.holding.type.name,
                quantity: balance.quantity,
                price: balance.price,
                value: balance.value,
                currency: balance.currency as 'TWD' | 'USD',
                note: balance.note ?? undefined,
                userId: balance.userId,
                updateAt: balance.updatedAt,
                createdAt: balance.createdAt,
            })
            if(!parsed.success){
                console.error("Invalid balance record:", parsed.error);
                return null;
            }
            return parsed.data;
        })
        return balanceRecords;
    } catch (error) {
        console.error("Failed to fetch balance data:", error);
        return [];
    }
}

export async function createBalance( balance: BalanceRecord ){
    
}

export async function createMonthBalance( balances: BalanceRecord[] ){

}

export async function deleteBalance( id: number ){

}

export async function updateBalance( id: number ){

}


//User
export async function fetchUserWithId( id:number ){

}


//Holding
export async function fetchHoldingWithId( id:number ){

}

export async function fetchHoldings(){
    try {
        const data = await prisma.holding.findMany({
            select:{
                id: true,
                name: true,
                symbol: true,
                typeId: true,
                userId: true,
                categoryId: true,
                updatedAt: true,
                createdAt: true,
            }, orderBy:{
                id:'asc'
            }
        })
        
        const parsed = HoldingsFormSchema.safeParse(data);
        if(!parsed.success){
            //console.error("Invalid holding data", parsed.error)
            return [];
        }
        return parsed.data;
    } catch (error) {
        console.error('Fail to fetch Holdings', error);
        return [];
    }
}

export async function fetchHoldingsFromAPI(keywords: string){

}

//Category
export async function fetchCategories(){
    try {
        const data = await prisma.category.findMany({
            select:{
                id: true,
                name: true,
                isHide: true,
                updatedAt: true,
                createdAt: true,
            },
            orderBy:{
                id:'asc'
            }
        });
        
        const categoryList = data.map( (category) => {
            const parsed = CategoryFormSchema.safeParse({
                id: category.id,
                name: category.name,
                isHide: category.isHide,
            })
            if(!parsed.success){
                console.error("Invalid category data", parsed.error)
                return null;
            }
            return parsed.data;
        }).filter( (category): category is CategoryForm => category !== null )
        return categoryList;

    } catch (error) {
        console.error("Failed to fetch categories", error)
        return [];
    }
}

//Type
export async function fetchTypes(){
    try {
        const data = await prisma.type.findMany({
            select:{
                name: true,
                id: true,
            },
            orderBy:{
                id: 'desc'
            }
        });
        const typeList = data.map( (type) => {
            const parsed = TypeFormSchema.safeParse({
                id: type.id,
                name: type.name
            })
            if(!parsed.success){
                console.error("Invalid type data", parsed.error);
                return null;
            }
            return parsed.data;
        }).filter( (type): type is TypeForm => type !== null)
        return typeList;
    } catch (error) {
        console.log('Failed to fetch types', error);
        return [];
    }
}
