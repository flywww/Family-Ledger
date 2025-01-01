'use client'


import { 
    BalanceSchema, 
    Balance, 
    Category, 
    CategorySchema, 
    Holding, 
    Type, 
    BalanceUpdateType,
    BalanceUpdateSchema} 
from "@/lib/definitions";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { 
    Popover, 
    PopoverContent, 
    PopoverTrigger 
} from "../ui/popover";
import { 
    SelectContent, 
    SelectTrigger,
    SelectValue, 
    Select, 
    SelectItem } 
from "../ui/select";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { MonthPicker } from "../ui/month-picker";
import { CaretSortIcon } from "@radix-ui/react-icons";
import { CalendarIcon, CheckIcon } from "lucide-react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod"
import { cn, firstDateOfMonth } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { minYear } from "@/lib/data";
import { Textarea } from "../ui/textarea";
import { useEffect, useState } from "react";
import { 
    fetchCategories, 
    fetchTypes, 
    fetchHoldings, 
    fetchHoldingsWithHoldingId,
    fetchCryptoPriceFromAPI,
    fetchListedStockPriceFromAPI,
    updateBalance
} from "@/lib/actions";

export default function EditBalanceForm({
    balance
}:{
    balance: Balance
}){

    const form = useForm<Balance>({
        resolver: zodResolver(BalanceUpdateSchema),
        defaultValues:{
            id: balance.id,
            holdingId: balance.holdingId,
            holding:{
                categoryId: balance.holding?.category?.id,
                typeId: balance.holding?.type?.id
            },
            date: balance.date, 
            quantity: balance.quantity,
            price: balance.price,
            value: balance.value,
            currency: balance.currency,
            userId: balance.userId, 
            note: balance.note,
        },
    });
    const [categoryList, setCategoryList] = useState<Category[]>([]);
    const [typeList, setTypeList] = useState<Type[]>([]);
    const [holdingList, setHoldingList] = useState<Holding[]>([]); 
    const [holdingDBIsUpdated, setHoldingDBIsUpdated] = useState<boolean>(true)
    const [selectedCategory, setSelectedCategory] = useState<Category>();
    const [selectedType, setSelectedType] = useState<Type>();
    const [selectedHolding, setSelectedHolding] = useState<Holding>();
    const [selectedDate, setSelectedDate] = useState<Date>(balance.date)
    const categoryId = form.watch('holding.category.id');
    const price = form.watch('price');
    const quantity = form.watch('quantity');
    //TODO: if it's float?
    const isListedStockOrCrypto = selectedCategory?.name === "Cryptocurrency" || selectedCategory?.name === "Listed stock";

    useEffect(() => {
        const getCategories = async () => {
            const categoryData = await fetchCategories();
            categoryData && setCategoryList(categoryData);       
        }
        const getTypes = async () => {
            const typeData = await fetchTypes();
            typeData && setTypeList(typeData);
        }
        getCategories();
        getTypes();
    },[])

    useEffect(() => {
        if(holdingDBIsUpdated || categoryId){
            const getHoldings = async () => {
                let holdingData;
                if(categoryId){
                    holdingData = await fetchHoldingsWithHoldingId(Number(categoryId));
                }else{
                    holdingData = await fetchHoldings();
                }
                holdingData && setHoldingList(holdingData);
                setHoldingDBIsUpdated(false)
            }
            getHoldings();
        }
    },[holdingDBIsUpdated, categoryId])

    useEffect(() => {
        form.setValue('value', price*quantity)
    }, [price, quantity])

    const fetchAndUpdatePrice = async (holding: Holding) => {
        if(isListedStockOrCrypto && holding.sourceId){
            if(selectedCategory.name === 'Cryptocurrency'){
                const price = await fetchCryptoPriceFromAPI(holding.sourceId)
                form.setValue('price', price);
            }else if(selectedCategory.name === 'Listed stock'){
                const price = await fetchListedStockPriceFromAPI(holding.sourceId.toString())
                form.setValue('price', price);
            }
        }
    }

    function onSubmit(values: BalanceUpdateType){
        updateBalance(values, values.date ?? balance.date);
        //TODO: Add transition UI
    }
    
    return(
        <div className="flex flex-col justify-start items-start">
            <Form {...form}>
                <form   
                    onSubmit={form.handleSubmit(onSubmit, (errors) => { 
                        console.log('update balance form validation Errors:', errors)})
                    } 
                    className="space-y-2"
                >
                    <FormField
                        control={form.control}
                        name="holding.categoryId"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel> Category </FormLabel>
                                <Select 
                                    {...field}
                                    value={ field.value ? field.value.toString() : ""}
                                    onValueChange={(value) => {
                                        field.onChange(value);
                                        setSelectedCategory(categoryList.find((category) => category.id.toString() === value));
                                    }}
                                >
                                    <FormControl>
                                        <SelectTrigger className="w-80">
                                            <SelectValue/>
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="w-80">
                                        {categoryList.map( (category) => (
                                            <SelectItem
                                                key={ category.id } 
                                                value={ category.id.toString() }
                                            > 
                                                {category.name} 
                                            </SelectItem> 
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="holding.typeId"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel> Type </FormLabel>
                                    <Select 
                                        {...field}
                                        value={ field.value ? field.value.toString() : ""}
                                        onValueChange={(value) => { 
                                            field.onChange(value);
                                            setSelectedType(typeList.find((type) => value === type.id?.toString()));
                                        }} 
                                    >
                                        <FormControl>
                                            <SelectTrigger className="w-80">
                                                <SelectValue/>
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="w-80">
                                            { typeList.map( (type) => (
                                                <SelectItem
                                                    key={ type.id } 
                                                    value={ type.id.toString() }
                                                > 
                                                    {type.name} 
                                                </SelectItem> 
                                            ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="holdingId"
                        render={({field}) => (
                            <FormItem className="flex flex-col">
                                <FormLabel className="py-1">Name</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button 
                                                variant="outline"
                                                role="combobox"
                                                className={cn(
                                                    "w-80 justify-between",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value
                                                    ? holdingList.find( (holding) => holding.id === field.value )?.name
                                                    : "Select a holding"}
                                                <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80 p-0">
                                        <Command>
                                            <CommandInput
                                                placeholder="Search holdings"
                                                className="h-9"
                                            />
                                            <CommandList>
                                                <CommandEmpty>No holding found.</CommandEmpty>
                                                <CommandGroup>
                                                    {holdingList.map( (holding) => (
                                                        <CommandItem
                                                            value={holding.id.toString()}
                                                            key={holding.id}
                                                            onSelect={() => {
                                                                form.setValue("holdingId", holding.id);
                                                                fetchAndUpdatePrice(holding);
                                                            }}
                                                        >
                                                            {holding.name}
                                                            <CheckIcon
                                                                className={cn(
                                                                    "ml-auto h-4 w-4",
                                                                    holding.id === field.value ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                        </CommandItem>    
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="quantity"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel> Quantity </FormLabel>
                                <FormControl>
                                    <Input 
                                        type="number" 
                                        className="w-80" 
                                        placeholder="Category"
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                    />
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="price"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel> Price </FormLabel>
                                <FormControl>
                                    <Input 
                                        type="number" 
                                        className="w-80" 
                                        placeholder="Price" 
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                    />
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="value"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel> Value </FormLabel>
                                <FormControl>
                                    <Input 
                                        type="number" 
                                        className="w-80" 
                                        placeholder="Value" 
                                        readOnly={true} 
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                    />
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="currency"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel> Currency </FormLabel>
                                    <Select {...field}>
                                        <FormControl>
                                            <SelectTrigger className="w-80">
                                                <SelectValue/>
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="w-80">
                                            <SelectItem value="TWD">TWD</SelectItem>
                                            <SelectItem value="USD">USD</SelectItem>
                                        </SelectContent>
                                    </Select>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="date"
                        render={({field}) => (
                            <FormItem className="flex flex-col">
                                <FormLabel className="py-1">Date</FormLabel>
                                <FormControl>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant={"outline"} className={cn("w-80 justify-start text-left font-normal", !balance.date && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {selectedDate ? format(selectedDate, "MMM yyyy") : <span>Pick a month</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <MonthPicker 
                                                onMonthSelect={(date:Date ) => {
                                                    setSelectedDate(date);
                                                    field.onChange(date);
                                                }} 
                                                selectedMonth={field.value}
                                                maxDate={new Date()}
                                                minDate={new Date(minYear,1,1)} />
                                        </PopoverContent>
                                    </Popover>
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="note"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel> Note </FormLabel>
                                <FormControl>
                                    <Textarea 
                                        {...field} 
                                        className="w-80" 
                                        placeholder="add some note"
                                    />
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />

                    <Button type="submit" className="w-full"> Submit </Button>
                </form>
            </Form>
        </div>
    )
}