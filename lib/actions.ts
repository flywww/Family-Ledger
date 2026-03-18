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
import {
    MonthKey,
    firstDateOfMonth,
    getCalculatedMonth,
    getMonthKey,
    monthKeyToDate,
} from "./utils";
import bcrypt from 'bcryptjs';
import { auth, signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";
import { fetchCurrencyExchangeRates, getConvertedCurrency } from "./fx";
import {
    createMonthlyBalancesAndJob,
    fetchMonthlyRefreshOverview,
    MONTHLY_REFRESH_DAILY_LIMIT,
    prepareNextMonthBalancesFromSourceMonth,
    rebuildValueDataForMonth,
    processMonthlyRefreshBatch,
    retryFailedMonthlyRefreshForMonth,
} from "./monthly-refresh";
import {
    fetchCryptoPriceFromAPI as fetchCryptoPrice,
    fetchListedStockPriceFromAPI as fetchListedStockPrice,
} from "./pricing";


export async function fetchLastDateOfBalance(){
    const session = await auth();
    if(!session) return;
    try {
        const lastDate = await prisma.balance.findMany({
            where:{
                userId: session.user.id,
            },
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
        const normalizedDate = firstDateOfMonth(queryDate);
        const data = await prisma.balance.findMany({
            where:{ date: normalizedDate, userId: session.user.id },
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

export { fetchCurrencyExchangeRates, getConvertedCurrency };

export async function fetchMonthlyRefreshState(date: Date) {
    const session = await auth();
    if (!session) return;

    return fetchMonthlyRefreshOverview(session.user.id, firstDateOfMonth(date));
}

export async function fetchBalanceMonthKeys(userId: string) {
    const months = await prisma.balance.findMany({
        where: {
            userId,
            isTestData: false,
        },
        select: {
            date: true,
        },
        distinct: ["date"],
        orderBy: {
            date: "desc",
        },
    });

    return months.map((item) => getMonthKey(item.date));
}

export async function retryFailedMonthlyRefresh(date: Date) {
    const session = await auth();
    if (!session) return;

    await retryFailedMonthlyRefreshForMonth(session.user.id, firstDateOfMonth(date));
    await rebuildValueDataForMonth(session.user.id, firstDateOfMonth(date));
    revalidatePath(`/balance/?date=${date.toUTCString()}`);
    revalidatePath(`/dashboard/?date=${date.toUTCString()}`);
}

async function listCronTestDataMonths(userId: string) {
    const [settings, jobMonths, snapshotMonths, balanceMonths, valueDataMonths] = await Promise.all([
        prisma.setting.findUnique({
            where: { userId },
            select: { cronTestTargetMonth: true },
        }),
        prisma.monthlyRefreshJob.findMany({
            where: { userId, isTestData: true },
            select: { targetMonth: true },
            distinct: ["targetMonth"],
        }),
        prisma.assetPriceSnapshot.findMany({
            where: { userId, isTestData: true },
            select: { targetMonth: true },
            distinct: ["targetMonth"],
        }),
        prisma.balance.findMany({
            where: { userId, isTestData: true },
            select: { date: true },
            distinct: ["date"],
        }),
        prisma.valueData.findMany({
            where: { userId, isTestData: true },
            select: { date: true },
            distinct: ["date"],
        }),
    ]);

    const months = new Map<string, Date>();
    const pushMonth = (value?: Date | null) => {
        if (!value) return;
        const month = firstDateOfMonth(value);
        months.set(month.toISOString(), month);
    };

    pushMonth(settings?.cronTestTargetMonth);
    for (const item of jobMonths) pushMonth(item.targetMonth);
    for (const item of snapshotMonths) pushMonth(item.targetMonth);
    for (const item of balanceMonths) pushMonth(item.date);
    for (const item of valueDataMonths) pushMonth(item.date);

    return Array.from(months.values()).sort((a, b) => a.getTime() - b.getTime());
}

async function cleanupCronTestData(userId: string, targetMonth?: Date | null) {
    const normalizedTargetMonth = targetMonth ? firstDateOfMonth(targetMonth) : null;
    const cleanedMonths = await listCronTestDataMonths(userId);
    const monthsToClean = normalizedTargetMonth
        ? cleanedMonths.filter((month) => month.getTime() === normalizedTargetMonth.getTime())
        : cleanedMonths;

    if (monthsToClean.length === 0) {
        return { cleanedMonths: [] as Date[] };
    }

    const monthFilters = monthsToClean.map((month) => ({ targetMonth: month }));
    const balanceFilters = monthsToClean.map((month) => ({ date: month }));

    await prisma.$transaction([
        prisma.assetPriceSnapshot.deleteMany({
            where: {
                userId,
                isTestData: true,
                OR: monthFilters,
            },
        }),
        prisma.monthlyRefreshJob.deleteMany({
            where: {
                userId,
                isTestData: true,
                OR: monthFilters,
            },
        }),
        prisma.valueData.deleteMany({
            where: {
                userId,
                isTestData: true,
                OR: balanceFilters,
            },
        }),
        prisma.balance.deleteMany({
            where: {
                userId,
                isTestData: true,
                OR: balanceFilters,
            },
        }),
        prisma.setting.update({
            where: {
                userId,
            },
            data: {
                cronTestTargetMonth: null,
                cronTestStartedAt: null,
            },
        }),
    ]);

    return { cleanedMonths: monthsToClean };
}

export async function fetchCronTestState(userId: string) {
    const setting = await prisma.setting.findUnique({
        where: {
            userId,
        },
        select: {
            cronTestTargetMonth: true,
            cronTestStartedAt: true,
        },
    });

    const testMonths = await listCronTestDataMonths(userId);
    const availableSourceMonthKeys = await fetchBalanceMonthKeys(userId);
    const activeTargetMonth = setting?.cronTestTargetMonth
        ? firstDateOfMonth(setting.cronTestTargetMonth)
        : null;
    const displayTargetMonth = activeTargetMonth ?? testMonths.at(0) ?? null;
    const overview = displayTargetMonth
        ? await fetchMonthlyRefreshOverview(userId, displayTargetMonth)
        : undefined;

    return {
        activeTargetMonth,
        displayTargetMonth,
        startedAt: setting?.cronTestStartedAt ?? null,
        hasTestData: testMonths.length > 0,
        staleTestData: testMonths.length > 0 && !activeTargetMonth,
        testMonthCount: testMonths.length,
        overview,
        availableSourceMonthKeys,
        defaultSourceMonthKey: availableSourceMonthKeys[0] ?? null,
    };
}

export async function startMonthlyRefreshCronTest(sourceMonthKey?: MonthKey) {
    const session = await auth();
    if (!session) {
        return { error: "Unauthorized" };
    }

    const setting = await prisma.setting.findUnique({
        where: {
            userId: session.user.id,
        },
    });

    if (!setting) {
        return { error: "Setting not found." };
    }

    if (setting.cronTestTargetMonth) {
        return { error: "A cron job test is already active." };
    }

    const existingTestMonths = await listCronTestDataMonths(session.user.id);
    if (existingTestMonths.length > 0) {
        return { error: "Existing cron test data was found. Clean it before starting a new test." };
    }

    if (!sourceMonthKey) {
        return { error: "Select a source month first." };
    }

    const availableSourceMonthKeys = await fetchBalanceMonthKeys(session.user.id);
    if (!availableSourceMonthKeys.includes(sourceMonthKey)) {
        return { error: "Selected source month has no balances." };
    }

    const sourceMonth = monthKeyToDate(sourceMonthKey);
    const expectedTargetMonth = firstDateOfMonth(getCalculatedMonth(sourceMonth, 1));

    const existingTargetBalance = await prisma.balance.count({
        where: {
            userId: session.user.id,
            date: expectedTargetMonth,
        },
    });

    if (existingTargetBalance > 0) {
        return { error: "Next month already has balances. Remove them before running the cron test." };
    }

    const existingTargetJob = await prisma.monthlyRefreshJob.findUnique({
        where: {
            userId_targetMonth: {
                userId: session.user.id,
                targetMonth: expectedTargetMonth,
            },
        },
    });

    if (existingTargetJob) {
        return { error: "Next month already has a refresh job. Clear it before running the cron test." };
    }

    const prepared = await prepareNextMonthBalancesFromSourceMonth({
        userId: session.user.id,
        sourceMonth,
        updateAccountingDate: false,
        isTestData: true,
    });

    if ("error" in prepared && prepared.error) {
        return { error: "No balances were found to copy into a test month." };
    }

    await prisma.setting.update({
        where: {
            userId: session.user.id,
        },
        data: {
            cronTestTargetMonth: prepared.targetMonth,
            cronTestStartedAt: new Date(),
        },
    });

    const targetMonthKey = getMonthKey(prepared.targetMonth);
    revalidatePath("/setting");
    revalidatePath(`/balance/?month=${targetMonthKey}`);
    revalidatePath(`/dashboard/?month=${targetMonthKey}`);

    return {
        success: true,
        targetMonth: prepared.targetMonth,
        targetMonthKey,
    };
}

export async function stopMonthlyRefreshCronTest() {
    const session = await auth();
    if (!session) {
        return { error: "Unauthorized" };
    }

    const cleanup = await cleanupCronTestData(session.user.id);

    if (cleanup.cleanedMonths.length === 0) {
        return { error: "No cron test data was found." };
    }

    revalidatePath("/setting");
    for (const cleanedMonth of cleanup.cleanedMonths) {
        revalidatePath(`/balance/?date=${cleanedMonth.toUTCString()}`);
        revalidatePath(`/dashboard/?date=${cleanedMonth.toUTCString()}`);
    }

    return {
        success: true,
        targetMonth: cleanup.cleanedMonths.at(0) ?? null,
        cleanedMonths: cleanup.cleanedMonths,
    };
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
            await updateValueData(parsedBalance.data);
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
    try {
        const session = await auth();
        if(!session) return;
        await createMonthlyBalancesAndJob({
            targetMonth: firstDateOfMonth(date),
            userId: session.user.id,
            sourceBalances: balances,
        });
    
    } catch (error) {
        throw new Error('Failed to create monthly balances.');
    }

    revalidatePath(`/balance/?date=${date.toUTCString()}`);
    revalidatePath(`/dashboard/?date=${date.toUTCString()}`);
    redirect(`/balance/?date=${date.toUTCString()}`);
}

export async function createNextMonthBalancesFromMonth(sourceMonthKey: MonthKey) {
    const session = await auth();
    if (!session) {
        return { error: "Unauthorized" };
    }

    const availableSourceMonthKeys = await fetchBalanceMonthKeys(session.user.id);
    if (!availableSourceMonthKeys.includes(sourceMonthKey)) {
        return { error: "Selected month has no balances to copy." };
    }

    const prepared = await prepareNextMonthBalancesFromSourceMonth({
        userId: session.user.id,
        sourceMonth: monthKeyToDate(sourceMonthKey),
    });

    if ("error" in prepared && prepared.error) {
        return {
            error: prepared.error,
            targetMonth: prepared.targetMonth,
        };
    }

    revalidatePath(`/balance/?date=${prepared.sourceMonth.toUTCString()}`);
    revalidatePath(`/balance/?month=${sourceMonthKey}`);
    revalidatePath(`/balance/?month=${getMonthKey(prepared.targetMonth)}`);
    revalidatePath(`/dashboard/?month=${getMonthKey(prepared.targetMonth)}`);

    return {
        success: true,
        created: prepared.created,
        targetMonth: prepared.targetMonth,
        targetMonthKey: getMonthKey(prepared.targetMonth),
    };
}

export async function deleteBalance( id: number, balance: Balance ){
    try {
        await prisma.balance.delete({
            where:{
                id: id
            }
        })
        await updateValueData(balance);        
        revalidatePath(`/balance/?date=${balance.date.toUTCString()}`);
    } catch (error) {
        console.error('Fail to delete balance', error);
        throw new Error('Failed to delete balance.');
    }
}

export async function updateBalance( balance: BalanceUpdateType, backDate?: Date ){
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
    return fetchCryptoPrice(id);
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
    return fetchListedStockPrice(symbol);
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
