'use server'

import prisma from "./prisma";
import { BalanceRecord, BalanceRecordSchema, Category, CategorySchema, Holding, HoldingArraySchema, HoldingCreateSchema, HoldingCreateType, Type, TypeSchema } from "./definitions";
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
                        id: true,
                        name: true,
                        symbol: true,
                        createdAt: true,
                        updatedAt: true,
                        type:{
                            select:{
                                id: true,
                                name: true,
                                createdAt: true,
                                updatedAt: true,
                            }
                        },
                        category:{
                            select:{
                                id: true,
                                name: true,
                                isHide: true,
                                createdAt: true,
                                updatedAt: true,  
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
                holdingId: balance.holding.id,
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
                updatedAt: balance.updatedAt,
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
export async function createHolding( holding: HoldingCreateType ){    
    try {
        const data = await prisma.holding.create({
            data: holding
        })
    } catch (error) {
        console.error('Fail to create the Holding', error);
    }
}

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
        
        const parsed = HoldingArraySchema.safeParse(data);
        if(!parsed.success){
            console.error("Invalid holding data", parsed.error)
            return [];
        }
        return parsed.data;
    } catch (error) {
        console.error('Fail to fetch Holdings', error);
        return [];
    }
}

export async function fetchHoldingsWithHoldingId( categoryId: number ){
    console.log(`fetchHoldingsWithHoldingId, id: ${categoryId}`);
    
    try {
        const data = await prisma.holding.findMany({
            where:{
                categoryId: categoryId,
            },
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
        
        const parsed = HoldingArraySchema.safeParse(data);
        if(!parsed.success){
            console.error("Invalid holding data", parsed.error)
            return [];
        }
        return parsed.data;
    } catch (error) {
        console.error('Fail to fetch Holdings', error);
        return [];
    }
}

export async function fetchCryptosFromAPI(query: string) {
    const API_KEY = process.env.CMC_API_KEY;
    const fetchURL = "https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?"

    if (!API_KEY) {
        throw new Error("API key is missing");
    }

    const header = {
        headers:{
            "X-CMC_PRO_API_KEY": API_KEY,
        }
    }

    const [slugResponse, symbolResponse] = await Promise.all([
        fetch(`${fetchURL}slug=${query}`,header).then(response => response.json()),
        fetch(`${fetchURL}symbol=${query}`,header).then(response => response.json())
    ])

    const cryptosFromSlug = slugResponse.data 
        ? Object.values(slugResponse.data).map((crypto: any) => ({
            name: crypto.name,
            symbol: crypto.symbol,
        }))  
        : [];
    const cryptosFromSymbol = symbolResponse.data?.[query]?.map((crypto: any) => ({
        name: crypto.name,
        symbol: crypto.symbol,
    })) || [];
    const cryptoData = [...cryptosFromSlug, ...cryptosFromSymbol].filter( crypto => crypto !== undefined);

    return cryptoData;
}

export async function fetchListedStocksFromAVSAPI(query: string){
    const API_KEY = process.env.ALPHA_VANTAGE_STOCK_API_KEY;
    const fetchURL = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${query}&apikey=${API_KEY}`

    if (!API_KEY) {
        throw new Error("API key is missing");
    }    
    try {
        const response = await fetch(fetchURL);
        const data = await response.json();
        if(!data.bestMatches){
            return [];
        }

        const listedStocks = data.bestMatches.map((stock: any) => ({
            symbol: stock["1. symbol"],
            name: stock["2. name"],
        }))

        return listedStocks;
    
    } catch (error) {
        console.error("Failed to fetch or parse stocks data:", error);
        return [];    
    }
}

export async function fetchListedStocksFromAPI(query: string){
    const API_KEY = process.env.FMP_STOCK_API_KEY;
    const fetchURL = `https://financialmodelingprep.com/api/v3/search?query=${query}&limit=10&apikey=${API_KEY}`

    if (!API_KEY) {
        throw new Error("API key is missing");
    }    
    try {
        const response = await fetch(fetchURL);
        if(!response.ok){
            console.log(`Using backup API to fetch listed stock list`);
            const backupFetchedData = await fetchListedStocksFromAVSAPI(query);
            return backupFetchedData;
        }
        const data = await response.json();
        const listedStocks = data.map((stock: any) => ({
            symbol: stock["symbol"],
            name: stock["name"],
        }))

        return listedStocks;
    
    } catch (error) {
        console.error("Failed to fetch or parse stocks data:", error);
        return [];    
    }
}

export async function fetchCryptoHoldingsPriceFromAPI(symbol: string, name: string){
    const query = "BT"
    const API_KEY = "3ff2d93b-0a0f-45e5-a37a-281f433380c4"
    const response = await fetch(`https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?symbol=${query}`,
        {
            headers:{
                "X-CMC_PRO_API_KEY": API_KEY,
            }
        }
    )
    if (!response.ok) {
        console.log("Failed to fetch cryptocurrency data");
    }
    const data = await response.json();
    
    
    return data
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
            const parsed = CategorySchema.safeParse({
                id: category.id,
                name: category.name,
                isHide: category.isHide,
                updatedAt: category.updatedAt,
                createdAt: category.createdAt
            })
            if(!parsed.success){
                console.error("Invalid category data", parsed.error)
                return null;
            }
            return parsed.data;
        }).filter( (category): category is Category => category !== null )
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
                id: true,
                name: true,
                updatedAt: true,
                createdAt: true,
            },
            orderBy:{
                id: 'desc'
            }
        });
        const typeList = data.map( (type) => {
            const parsed = TypeSchema.safeParse({
                id: type.id,
                name: type.name,
                updatedAt: type.updatedAt,
                createdAt: type.createdAt
            })
            if(!parsed.success){
                console.error("Invalid type data", parsed.error);
                return null;
            }
            return parsed.data;
        }).filter( (type): type is Type => type !== null)
        return typeList;
    } catch (error) {
        console.log('Failed to fetch types', error);
        return [];
    }
}
