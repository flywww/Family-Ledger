'use server'

import prisma from "./prisma";
import { 
    BalanceCreateType, 
    BalanceUpdateType, 
    Balance, 
    BalanceSchema, 
    Category, 
    CategorySchema, 
    Holding, 
    HoldingArraySchema, 
    HoldingCreateSchema, 
    HoldingCreateType, 
    Type, 
    TypeSchema, 
    HoldingsArray,
    HoldingUpdateType,
    HoldingSchema,
    SettingSchema,
    Setting,
    SettingUpdateType,
    BalanceCreateSchema,
    currencyType,
    FlattedBalanceType,
    ValueDataCreateSchema,
    ValueDataCreateType,
    ValueDataUpdateSchema,
    ValueDataSchema,
    User,
    UserSchema,
    currencySymbols,
    CurrencyExchangeRateCreateType,
} from "./definitions";
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { delay, getUTCDateString } from "./utils";
import bcrypt from 'bcryptjs';
import { auth, signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";


export async function fetchLastDateOfBalance(){
    try {
        const lastDate = await prisma.balance.findMany({
            take: 1,
            select:{
                date: true,
            },
            orderBy:{
                date: 'desc'
            }
        })
        return lastDate[0].date
    } catch (error) {
        console.log(`Fail to fetch last date of balance, error: ${error}`);
    }
}

export async function fetchBalance( id: number ){
    try {
        const data = await prisma.balance.findFirst({
            where:{ id: id },
            include: { 
                holding: {
                    include:{
                        category: true,
                        type: true,
                    }
                }, 
                user: true 
            },            
            orderBy:{ id: 'asc' }
        })

        if(!data){
            throw new Error('Failed to fetch balance. Can not find balance for this id!');
        }

        const parsed = BalanceSchema.safeParse( data )
        if(!parsed.success){
            console.error("Invalid balance record:", parsed.error);
            throw new Error('Failed to parse fetched balance.');
        }
        return parsed.data;

    } catch (error) {
        console.log(`Fail to fetch balance, error: ${error}`);
    }
}

export async function fetchMonthlyBalance( queryDate: Date  ){
    const session = await auth()
    if(!session) return
    try {
        const data = await prisma.balance.findMany({
            where:{ date: queryDate, userId: session.user.id },
            include: { 
                holding: {
                    include:{
                        category: true,
                        type: true,
                    }
                }, 
                user: true 
            },
            orderBy:{ id: 'asc' }
        })
        
        const balances = data.map( (balance) => {
            const parsed = BalanceSchema.safeParse( balance )
            if(!parsed.success){
                console.error("Invalid balance record:", parsed.error);
                throw new Error('Failed to fetch monthly balance.');
            }
            return parsed.data;
        })
        return balances;
    } catch (error) {
        console.error("Failed to fetch balance data:", error);
    }
}

async function convertToValueData( balances: Balance[] ){
    let valueData: Record<string, any> = {};

    for(const balance of balances){
        if(balance.holding?.category && balance.holding.type){
            const { date, holding: { category, type }, value, userId, currency } = balance;
            const key = `${date}-${category.name}-${type.name}-${userId}`;
            if (key === "Sun Dec 01 2024 00:00:00 GMT+0800 (Taipei Standard Time)-Cryptocurrency-Assets-cm4qh5eyz0000dh7ccntzdddz") {
                console.log(`[convertToValueData] balance: ${JSON.stringify(balance.value)}`);  
            }
    
            if (!valueData[key]) {
                valueData[key] = {
                    date: date,
                    category: category,
                    type: type,
                    value: 0,
                    userId: userId,
                    categoryId: category.id,
                    typeId: type.id,
                };
            }
            //console.log(`[convertToValueData] currency: ${currency}`);
            
            if(currency === 'USD'){
                valueData[key].value += value;
                if (key === "Sun Dec 01 2024 00:00:00 GMT+0800 (Taipei Standard Time)-Cryptocurrency-Assets-cm4qh5eyz0000dh7ccntzdddz") {
                    console.log(`USD ${value}`);  
                }
                //console.log(`[convertToValueData] key: ${key} \n valueData[key].value: ${valueData[key].value} (add value: ${value})`);
                
            }else{
                const addValue = await getConvertedCurrency(currency as currencyType, 'USD', value, date);
                valueData[key].value += addValue;
                if (key === "Sun Dec 01 2024 00:00:00 GMT+0800 (Taipei Standard Time)-Cryptocurrency-Assets-cm4qh5eyz0000dh7ccntzdddz") {
                    console.log(`Other ${addValue}`);
                }

                //console.log(`[convertToValueData] key: ${key} \n valueData[key].value: ${valueData[key].value} (add value: ${addValue})`); 
                
            }
        }
    };

    const valueDataArray = Object.values(valueData);
    //console.log(`[convertToValueData] valueDataArray: ${JSON.stringify(valueDataArray)}`);
    
    return valueDataArray;
}

export async function createValueData (balances:Balance[]){
    try {
        const valueDataArray = await convertToValueData(balances);
        const parsed = ValueDataCreateSchema.array().safeParse(valueDataArray);
        if(!parsed.success){
            throw new Error('Failed to parse valueData.');
        }
        await prisma.valueData.createMany({data: parsed.data})
        

    } catch (error) {
        console.log(`Fail to create valueData: ${error}`)
    }
}   

export async function updateValueData( balance: Balance ){
    try {
        console.log(`[updating valueData] Balance: ${JSON.stringify(balance)}`);
        
        const balances = await prisma.balance.findMany({
            where:{
                date: balance.date,
                holding:{
                    categoryId: balance.holding.categoryId,
                    typeId: balance.holding.typeId,
                },
                userId: balance.userId,
            },
            include:{
                holding:{
                    include:{
                        category: true,
                        type:true,
                    }
                }
            }
        })

        console.log(`[updating valueData] get balances: ${balances}`);
        
        // Delete valueData if it can not find any balances
        if(balances.length === 0){

            console.log(`[updating valueData] balance.length = 0, delete valueData`);

            await prisma.valueData.delete({
                where:{
                    date_categoryId_typeId_userId:{
                        date: balance.date,
                        categoryId: balance.holding.categoryId,
                        typeId: balance.holding.typeId,
                        userId: balance.userId,
                    }
                }
            })
            return;
        }
        const parsedBalances = BalanceSchema.array().safeParse(balances)
        if(!parsedBalances.success){
            throw new Error('Failed to parse balances.');
        }
        const valueDataArray = await convertToValueData(parsedBalances.data);

        console.log(`[updating valueData] convert to valueData: ${valueDataArray}`);
        
        const parsedValueData = ValueDataCreateSchema.array().safeParse(valueDataArray);
        if(!parsedValueData.success){
            throw new Error('Failed to parse valueData.');
        }      
        console.log(`[updating valueData] parsed  to be updated valueData: ${JSON.stringify(parsedValueData.data)}`);


        await prisma.valueData.upsert({
            where:{
                date_categoryId_typeId_userId:{
                    date: balance.date,
                    categoryId: balance.holding.categoryId,
                    typeId: balance.holding.typeId,
                    userId: balance.userId,
                }
            },
            update: parsedValueData.data[0],
            create: parsedValueData.data[0],
        })


    } catch (error) {
        console.log(`Fail to update valueData: ${error}`)
    }
}

export async function fetchValueData(){
    const session = await auth();
    if(!session) return;
    try {
        const data = await prisma.valueData.findMany({
            where:{
                userId: session.user.id,
            },
            include:{
                category: true,
                type: true,
            }
        })
        const parsed = ValueDataSchema.array().safeParse(data);
        if(!parsed.success){
            throw new Error(`Fail to parse valueData array: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`)
        }
        return parsed.data
    } catch (error) {
        console.log(`Fail to fetch valueData: ${error}`);
    }
}

//TODO: error handling sample
export async function createBalance( balance: BalanceCreateType ){
    try {
        const parsed = BalanceCreateSchema.safeParse(balance);
        if(!parsed.success){
            return {
                errors: parsed.error.flatten().fieldErrors,
                message: `Missing Fields. Failed to Create balance: ${parsed.error}`,
            };
        }
        //TODO: update if it has same holding in current month
        const result = await prisma.balance.create({
            data: parsed.data,
            include:{
                holding:{
                    include:{
                        category: true,
                        type:true,
                    }
                }
            }   
        })
        console.log(`[createBalance] balance created: ${JSON.stringify(result)}`);
        const parsedBalance = BalanceSchema.safeParse(result);
        if(!parsedBalance.success){
            console.log(`Fail to parse balance for valueData: ${parsedBalance.error}`);
        }else{
            console.log(`[createBalance] Proceed to update valueData`);
            updateValueData(parsedBalance.data);
        }
            

    } catch (error) {
        console.error('Fail to create the balance', error);
        return {
            message: 'Database Error: Failed to Create balance.',
        };
    }
    revalidatePath(`/balance/?date=${balance.date.toUTCString()}`);
    redirect(`/balance/?date=${balance.date.toUTCString()}`);
}

export async function createMonthBalances( date: Date , balances: Balance[] ){
    let updatedBalances: BalanceCreateType[] = [];
    
    try {
        for(const balance of balances){
            let newPrice = balance.price;
            let newCurrency = balance.currency;
            const { holding, user, id, updatedAt, createdAt, ...balanceData } = balance;
            //TODO: error handling when fetch price failed
            if(holding?.sourceId){
                console.log(`Fetching price for holding: ${holding.name}(${holding.symbol}) (sourceId: ${holding.sourceId})`);
                if(holding.category?.name === 'Cryptocurrency'){
                    newPrice = await fetchCryptoPriceFromAPI(holding.sourceId);
                    newCurrency = 'USD'
                }else if(holding.category?.name === 'Listed stock'){
                    newPrice = await fetchListedStockPriceFromAPI(holding.sourceId);
                    newCurrency = 'USD'
                }
            }
            updatedBalances.push({
                ...balanceData,
                date: date,
                price: newPrice,
                value: newPrice * balance.quantity,
                currency: newCurrency,
            })

            await delay(2100);
        }

        const createdBalances = await prisma.balance.createManyAndReturn({
            data: updatedBalances,
            include:{
                holding:{
                    include:{
                        category:true,
                        type:true,
                    }
                }
            }
        })

        const parsedBalances = BalanceSchema.array().safeParse(createdBalances);
        if(!parsedBalances.success){
            console.log(`Fail to parse balance for valueData: ${parsedBalances.error}`);
        }else{
            await createValueData(parsedBalances.data)
        }
        
        const session = await auth();
        if(!session) return;
        await updateSetting(session.user.id, { accountingDate:date })
    
    } catch (error) {
        throw new Error('Failed to create monthly balances.');
    }

    revalidatePath(`/balance/?date=${date.toUTCString()}`);
    redirect(`/balance/?date=${date.toUTCString()}`);
}

export async function deleteBalance( id: number, balance: Balance ){
    try {
        await prisma.balance.delete({
            where:{
                id: id
            }
        })
        updateValueData(balance);        
        revalidatePath(`/balance/?date=${balance.date.toUTCString()}`);
    } catch (error) {
        console.error('Fail to delete balance', error);
        throw new Error('Failed to delete balance.');
    }
}

export async function updateBalance( balance: BalanceUpdateType, backDate?: Date ){
    //BUG: update data can not contain id
    const { id, ...balanceWithoutId } = balance;
    try {
        const result = await prisma.balance.update({
            where:{ id: balance.id },
            data: balanceWithoutId,
        })
        if(balance.value){
            const balanceData = await fetchBalance(balance.id);
            balanceData && await updateValueData(balanceData);
        }
    } catch (error) {
        console.error('Fail to update balance', error)
    }
    if(!backDate) return;
    revalidatePath(`/balance/?date=${backDate.toUTCString()}`);
    redirect(`/balance/?date=${backDate.toUTCString()}`);
}


//User
export async function fetchUserWithAccount( account: string ){
    try {
        const user = await prisma.user.findUnique({
            where:{
                account: account
            }
        })
        return user;
    } catch (error) {
        console.log(`Fail to fetch user with email: ${error}`)
        throw new Error(`Fail to fetch user with email`);
    }
}

export async function updatePassword( account: string, password: string ){
    try {
        const hashedPassword: string = await bcrypt.hash(password, 10);
        console.log(`hashedPassword: ${hashedPassword}`);
        console.log(`account: ${account}`);

        const user = await prisma.user.update({
            where:{
                account: account
            },
            data: { password: hashedPassword }
        })

        console.log(`hashedPassword update result: ${JSON.stringify(user)}`);
    } catch (error) {
        console.log(`Fail to update user password: ${error}`)
        throw new Error(`Fail to update user password`);
    }
}

export async function authenticate(
    prevState: string | undefined,
    formData: User,
){
    try {
        await signIn('credentials', formData);
        return {success: "logged in"}
    } catch (error) {
        if (error instanceof AuthError){
            switch (error.type) {
                case 'CredentialsSignin':
                    return {error: 'Invalid credentials'}
                default:
                    return {error: 'something went wrong'};
            }
        }
        throw error;
    }
}

//Holding
export async function createHolding( holding: HoldingCreateType ){    
    try {
        const data = await prisma.holding.findFirst({
            where:{
                name: holding.name,
                symbol: holding.symbol,
            },
            include:{
                category: true,
                type: true,
            }
        })

        if(!data){
            await prisma.holding.create({
                data: holding
            })
        }else{
            const parsed = HoldingSchema.safeParse(data);
            if(parsed.success){
                updateHolding(parsed.data.id, holding as HoldingUpdateType)
            }
        }
    } catch (error) {
        console.error('Fail to create the Holding', error);
    }
}

export async function updateHolding( id: number, holding: HoldingUpdateType){
    try {

        //BUG: update data can not contain id
        await prisma.holding.update({
            where:{
                id: id
            },
            data: holding
        })
    } catch (error) {
        console.log(`Can not update holding with id:${id} and data: ${holding}, error: ${error}`);
    }
}

export async function fetchHoldingWithId( id:number ){

}

export async function fetchHoldings(){
    try {
        const data = await prisma.holding.findMany({
            orderBy:{
                id:'asc'
            }, 
            include:{
                category: true,
                type: true,
            }
        })
        
        const parsed = HoldingArraySchema.safeParse(data);
        if(!parsed.success){
            console.error("Invalid holding data", parsed.error)
            throw new Error(`Invalid holding data: ${parsed.data}, error: ${parsed.error}`);
        }
        return parsed.data;
    } catch (error) {
        console.error('Fail to fetch Holdings', error);
    }
}

export async function fetchHoldingsWithHoldingId( categoryId: number ){
    console.log(`fetchHoldingsWithHoldingId, id: ${categoryId}`);
    
    try {
        const data = await prisma.holding.findMany({
            where:{
                categoryId: categoryId,
            },
            include: { 
                category: true,
                type: true, 
                user: true 
            }, 
            orderBy:{
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
            sourceURL: fetchURL,
            sourceId: crypto.id.toString(),
            createdAt: new Date(),
            updatedAt: new Date(),
        }))  
        : [];
    const cryptosFromSymbol = symbolResponse.data?.[query]?.map((crypto: any) => ({
        name: crypto.name,
        symbol: crypto.symbol,
        sourceURL: fetchURL,
        sourceId: crypto.id.toString(),
    })) || [];
    const cryptoData = [...cryptosFromSlug, ...cryptosFromSymbol].filter( crypto => crypto !== undefined);

    return cryptoData;
}

export async function fetchCryptoPriceFromAPI(id: string){
    const API_KEY = process.env.CMC_API_KEY
    const fetchURL = "https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?"
    if (!API_KEY) {
        throw new Error("API key is missing");
    }
    const header = {
        headers:{
            "X-CMC_PRO_API_KEY": API_KEY,
        }
    }
    
    const response = await fetch(`${fetchURL}id=${id}`, header)
    if (!response.ok) {
        console.log("Failed to fetch cryptocurrency data");
        return 99999999
    }

    const data = await response.json();
    const price = data['data'][id.toString()].quote.USD.price
        
    return price
}

// export async function fetchListedStocksFromAVSAPI(query: string){
//     const API_KEY = process.env.ALPHA_VANTAGE_STOCK_API_KEY;
//     const fetchURL = `https://www.alphavantage.co/query?`

//     if (!API_KEY) {
//         throw new Error("API key is missing");
//     }    
//     try {
//         const response = await fetch(`${fetchURL}function=SYMBOL_SEARCH&keywords=${query}&apikey=${API_KEY}`);
//         const data = await response.json();
//         if(!data.bestMatches){
//             return [];
//         }

//         const listedStocks = data.bestMatches.map((stock: any) => ({
//             symbol: stock["1. symbol"],
//             name: stock["2. name"],
//             sourceURL: fetchURL,
//             sourceId:  stock["1. symbol"],
//         }))

//         return listedStocks;
    
//     } catch (error) {
//         console.error("Failed to fetch or parse stocks data:", error);
//         return [];    
//     }
// }

export async function fetchListedStocksFromAPI(query: string){
    const API_KEY = process.env.FMP_STOCK_API_KEY;
    const fetchURL = `https://financialmodelingprep.com/api/v3/search?`

    if (!API_KEY) {
        throw new Error("API key is missing");
    }    
    try {
        const response = await fetch(`${fetchURL}query=${query}&limit=10&apikey=${API_KEY}`);
        if(!response.ok){
            console.log(`Using backup API to fetch listed stock list`);
            // const backupFetchedData = await fetchListedStocksFromAVSAPI(query);
            return [];
        }
        const data = await response.json();
        const listedStocks = data.map((stock: any) => ({
            symbol: stock["symbol"],
            name: stock["name"],
            stockExchange: stock['stockExchange'],
            sourceURL: fetchURL,
            sourceId: stock["symbol"],
            
        })).filter((stock: any) => stock.stockExchange === 'NASDAQ Global Select')
        .map(({stockExchange, ...stock}: { stockExchange: any }) => stock)

        return listedStocks;
    
    } catch (error) {
        console.error("Failed to fetch or parse stocks data:", error);
        return [];    
    }
}

export async function fetchListedStockPriceFromAPI( symbol: string ){
    const API_KEY = process.env.FMP_STOCK_API_KEY;
    const fetchURL = `https://financialmodelingprep.com/api/v3/otc/real-time-price/${symbol}?apikey=${API_KEY}`
    try {
        const response = await fetch(fetchURL);
        const data = await response.json();

        console.log(`fetch listed stock price: ${data}`);
        
        const price = data.map((stock: any) => ({
            symbol: stock["symbol"],
            lastSalePrice: stock["lastSalePrice"],
        }))[0].lastSalePrice;

        return price;
    } catch (error) {
        console.error("Fail to fetch listed stock price", error);
        return 999999
    }
}

//Category
export async function fetchCategories(){
    try {
        const data = await prisma.category.findMany({
            orderBy:{
                id:'asc'
            }
        });
        
        const categoryList = data.map( (category) => {
            const parsed = CategorySchema.safeParse( category )
            if(!parsed.success){
                throw new Error(`Invalid category data: ${parsed.error}`);
            }
            return parsed.data;
        }).filter( (category): category is Category => category !== null )
        return categoryList;

    } catch (error) {
        console.error("Failed to fetch categories", error)
    }
}

//Type
export async function fetchTypes(){
    try {
        const data = await prisma.type.findMany({
            orderBy:{
                id: 'desc'
            }
        });
        const typeList = data.map( (type) => {
            const parsed = TypeSchema.safeParse(type)
            if(!parsed.success){
                throw new Error('Failed to parse fetched type.');
            }
            return parsed.data;
        }).filter( (type): type is Type => type !== null)
        return typeList;
    } catch (error) {
        console.log('Failed to fetch types', error);
    }
}

//Setting
export async function fetchSetting( userId: string ){
    try {
        const data = await prisma.setting.findFirst({
            where: {
                userId: userId
            }
        })
        const parsed = SettingSchema.safeParse(data);
        if(!parsed.success){
            throw new Error('Failed to parse fetched setting.');
        }
        return parsed.data

    } catch (error) {
        console.log(`Failed to fetch setting with id:${userId}, error: ${error}`);
    }
}

export async function updateSetting( userId: string, setting: SettingUpdateType ){
    //BUG: update data can not contain id
    try {
        const updatedSetting = await prisma.setting.update({
            where: {
                userId: userId
            },
            data: setting
        })
        const parsed = SettingSchema.safeParse(updatedSetting);
        if(!parsed.success){
            throw new Error('Failed to parse fetched updatedSetting.');
        }
        return parsed.data;
    } catch (error) {
        console.error(`Fail to update setting with userId:${userId} and setting:${setting}, error:${error}`)
    }
}

let usdExchangeRateCache= new Map<string, number>();

//Currency
export async function getConvertedCurrency(fromCurrency:currencyType, toCurrency:currencyType, amount:number, date: Date){
    try {
        //console.log(`[getConvertedCurrency] fromCurrency: ${fromCurrency}, toCurrency: ${toCurrency}, amount: ${amount}, date: ${date}`);
        
        if(fromCurrency === toCurrency) return amount;
        let fromCurrencyRate, toCurrencyRate;
        const fromCacheKey = `${fromCurrency}-${date.toISOString().split('T')[0]}`;
        const toCacheKey = `${toCurrency}-${date.toISOString().split('T')[0]}`;      
        if( usdExchangeRateCache.has(fromCacheKey) && usdExchangeRateCache.has(toCacheKey)){
            fromCurrencyRate = usdExchangeRateCache.get(fromCacheKey);
            toCurrencyRate = usdExchangeRateCache.get(toCacheKey);
            //console.log(`[getConvertedCurrency catch] fromCurrencyRate: ${fromCurrencyRate}, toCurrencyRate: ${toCurrencyRate}`);
            
            if(fromCurrencyRate !== undefined && toCurrencyRate !== undefined) return amount * toCurrencyRate / fromCurrencyRate;
        }
        
        const rateData = await prisma.currencyExchangeRate.findMany({
            where:{
                OR:[
                    {date: date, currency: fromCurrency},
                    {date: date, currency: toCurrency},
                ] 
            }
        })
        if(rateData.length === 0){
            const currencyData = await fetchCurrencyExchangeRates(date);
            //TODO: use insert?
            if(currencyData){
                await prisma.currencyExchangeRate.createMany({data: currencyData});
                //catch the rate
                fromCurrencyRate = currencyData.find( (data:any) => data.currency === fromCurrency)?.rate;
                if(fromCurrencyRate !== undefined) usdExchangeRateCache.set(fromCacheKey, fromCurrencyRate);
                toCurrencyRate = currencyData.find( (data:any) => data.currency === toCurrency)?.rate;
                if(toCurrencyRate !== undefined) usdExchangeRateCache.set(toCacheKey, toCurrencyRate);
                //console.log(`[getConvertedCurrency] fetch fromCurrencyRate: ${fromCurrencyRate}, toCurrencyRate: ${toCurrencyRate}`);
                
            }
        }else{
            //catch the rate
            fromCurrencyRate = rateData.find( (data:any) => data.currency === fromCurrency)?.rate;
            if(fromCurrencyRate !== undefined) usdExchangeRateCache.set(fromCacheKey, fromCurrencyRate);
            toCurrencyRate = rateData.find( (data:any) => data.currency === toCurrency)?.rate;
            if(toCurrencyRate !== undefined) usdExchangeRateCache.set(toCacheKey, toCurrencyRate);
            //console.log(`[getConvertedCurrency] db fromCurrencyRate: ${fromCurrencyRate}, toCurrencyRate: ${toCurrencyRate}`);
            
        } 
        let convertedResult = 0;
        //console.log(`[getConvertedCurrency] final fromCurrencyRate: ${fromCurrencyRate}, toCurrencyRate: ${toCurrencyRate}`);
        
        if(fromCurrencyRate !== undefined && toCurrencyRate !== undefined){
            convertedResult = amount * toCurrencyRate / fromCurrencyRate;
        }else{
            convertedResult = -1;
        }
        //console.log(`[getConvertedCurrency] convertedResult: ${convertedResult}`);
        
        return convertedResult;
    } catch (error) {
        console.log(`Fail to get converted currency: ${error}`);   
    }
}

let stopCount  = 0;
//Backup currency A=api
export const fetchCurrencyExchangeRates = async (date: Date) => {
    stopCount++;
    if(stopCount > 3){
        console.log(`[fetchCurrencyExchangeRates] stopCount: ${stopCount}`);
        return [];
    }
    try {
        const isHistoricalData = date < (new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));
        const API_KEY = process.env.CURRENCYAPI_API_KEY;
        if (!API_KEY) { throw new Error("Currency exchange API key is missing");}
        
        const header = { headers: { "apikey": API_KEY, }}
        const API_url = `https://api.currencyapi.com/v3/${isHistoricalData ? "historical" : "latest"}?`    
        const currencies = currencySymbols.join('%2C');
        const queryURL = isHistoricalData
                            ? `${API_url}currencies=${currencies}&date=${getUTCDateString(date)}`
                            : `${API_url}currencies=${currencies}`;
        const response = await fetch(queryURL, header);
        await delay(6100);
        
        if (!response.ok) {
            const errorText = await response.text(); // Read raw response
            console.error("Failed response body:", errorText);
            return [];
            throw new Error(`Response status: ${response.status}`);
        }
        const result = await response.json();
        const currencyData: CurrencyExchangeRateCreateType[] = Object.values(result.data).map((data: any) => ({
            currency: data.code, 
            rate: data.value, 
            date: date
        }))
        return currencyData;
    } catch (error) {
        console.log(`Fail to fetch currency exchange rates: ${error}`); 
    }
}