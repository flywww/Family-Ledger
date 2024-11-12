'use client'

import { 
    BalanceFormSchema, 
    BalanceRecord, 
    Category, 
    CategorySchema, 
    Holding, 
    Type } 
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
import CreateHoldingForm from "./holding-create-form";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod"
import { cn, firstDateOfMonth } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { minYear } from "@/lib/data";
import { Textarea } from "../ui/textarea";
import { useEffect, useRef, useState } from "react";
import { 
    fetchCategories, 
    fetchTypes, 
    fetchHoldings, 
    fetchHoldingsWithHoldingId,
    fetchCryptoPriceFromAPI,
    fetchListedStockPriceFromAPI
} from "@/lib/actions";



export default function CreateBalanceForm({ 
    initialDate, 
    backURL
}: { 
    initialDate: Date, 
    backURL: string
}){
    const router = useRouter()
    const form = useForm<BalanceRecord>({
        resolver: zodResolver(BalanceFormSchema),
        defaultValues:{
            holdingId: 1,
            date: firstDateOfMonth(initialDate), 
            quantity: 0,
            price: 0,
            value: 0,
            currency: 'TWD',
            userId: 1, //TODO: Should load user
            updatedAt: new Date(),
            createdAt: new Date(),
        },
    });
    const [categoryList, setCategoryList] = useState<Category[]>([]);
    const [typeList, setTypeList] = useState<Type[]>([]);
    const [holdingList, setHoldingList] = useState<Holding[]>([]); 
    const [holdingDBIsUpdated, setHoldingDBIsUpdated] = useState<boolean>(true)
    const [selectedCategory, setSelectedCategory] = useState<Category>();
    const [selectedType, setSelectedType] = useState<Type>();
    const [selectedHolding, setSelectedHolding] = useState<Holding>();
    const categoryId = form.watch('categoryName');
    const isListedStockOrCrypto = selectedCategory?.name === "Cryptocurrency" || selectedCategory?.name === "Listed stock";

    useEffect(() => {
        const getCategories = async () => {
            const categoryData = await fetchCategories();
            setCategoryList(categoryData);       
        }
        const getTypes = async () => {
            const typeData = await fetchTypes();
            setTypeList(typeData);
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
                setHoldingList(holdingData);
                setHoldingDBIsUpdated(false)
            }
            getHoldings();
        }
    },[holdingDBIsUpdated, categoryId])

    const fetchAndUpdatePrice = async (holdingName: string) => {
        if(isListedStockOrCrypto){
            if(selectedCategory.name === 'Cryptocurrency'){
                const price = await fetchCryptoPriceFromAPI(holdingName)
                form.setValue('price', price);
            }else if(selectedCategory.name === 'Listed stock'){
                const price = await fetchListedStockPriceFromAPI(holdingName)
                form.setValue('price', price);
            }
        }
    }

    function onSubmit(values: BalanceRecord){
        console.log(values);
        router.push(decodeURIComponent(backURL))        
    }
    
    return(
        <div>
            Create Balance Form
            <Form {...form}>
                <form   
                    onSubmit={form.handleSubmit(onSubmit, (errors) => { 
                        console.log('create balance form validation Errors:', errors)})
                    } 
                    className="space-y-1"
                >
                    <FormField
                        control={form.control}
                        name="categoryName"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel> Category </FormLabel>
                                <Select 
                                    onValueChange={(value) => {
                                        field.onChange(value);
                                        setSelectedCategory(categoryList.find((category) => category.id.toString() === value));
                                    }} 
                                    defaultValue={field.value}
                                    
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
                        name="typeName"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel> Type </FormLabel>
                                    <Select 
                                        onValueChange={(value) => { 
                                            field.onChange(value);
                                            setSelectedType(typeList.find((type) => value === type.id?.toString()));
                                        }} 
                                        defaultValue={field.value}
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
                        name="holdingName"
                        render={({field}) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Name</FormLabel>
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
                                                    ? holdingList.find( (holding) => holding.name === field.value )?.name
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
                                                            value={holding.name}
                                                            key={holding.name}
                                                            onSelect={() => {
                                                                form.setValue("holdingName", holding.name);
                                                                fetchAndUpdatePrice(holding.name);
                                                            }}
                                                        >
                                                            {holding.name}
                                                            <CheckIcon
                                                                className={cn(
                                                                    "ml-auto h-4 w-4",
                                                                    holding.name === field.value ? "opacity-100" : "opacity-0"
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

                    { (selectedType && selectedCategory) && <CreateHoldingForm
                        isListedStockOrCrypto={isListedStockOrCrypto} 
                        holdingDBIsUpdated={holdingDBIsUpdated}
                        setHoldingDBIsUpdated={setHoldingDBIsUpdated}
                        selectedCategory={selectedCategory}
                        selectedType={selectedType}
                    />}

                    <FormField
                        control={form.control}
                        name="quantity"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel> Quantity </FormLabel>
                                <FormControl>
                                    <Input type="number" className="w-80" placeholder="Category" {...field}/>
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
                                    <Input type="number" className="w-80" placeholder="Price" {...field}/>
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
                                    <Input type="number" className="w-80" placeholder="Value" {...field}/>
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
                                    <Select>
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
                            <FormItem>
                                <FormLabel> Date </FormLabel>
                                <FormControl>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant={"outline"} className={cn("w-80 justify-start text-left font-normal", !initialDate && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {initialDate ? format(initialDate, "MMM yyyy") : <span>Pick a month</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <MonthPicker 
                                                onMonthSelect={field.onChange} 
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
                                    <Textarea className="w-80" placeholder="add some note" {...field}/>
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />

                    <Button type="submit"> Submit </Button>
                </form>
            </Form>
        </div>
    )
}