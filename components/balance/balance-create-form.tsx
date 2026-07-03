'use client'

import {
    BalanceCreateType,
    Balance,
    Category,
    Holding,
    Type,
    BalanceCreateSchema}
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
import { useEffect, useState } from "react";
import {
    fetchCategories,
    fetchTypes,
    fetchHoldings,
    fetchHoldingsWithHoldingId,
    fetchCryptoPriceFromAPI,
    fetchListedStockPriceFromAPI,
    createBalance
} from "@/lib/actions";
import { useSession } from "next-auth/react";
import { getBalancePricePrefill, isQuoteBackedBalanceCategory } from "@/lib/balance-price-prefill";



export default function CreateBalanceForm({
    initialDate,
    backURL
}: {
    initialDate: Date,
    backURL: string
}){
    const router = useRouter()
    const { data: session } = useSession()
    const form = useForm<Balance>({
        resolver: zodResolver(BalanceCreateSchema),
        defaultValues:{
            date: firstDateOfMonth(initialDate),
            quantity: 0,
            price: 0,
            value: 0,
            currency: 'USD',
            userId: session?.user.id,
        },
    });
    const [categoryList, setCategoryList] = useState<Category[]>([]);
    const [typeList, setTypeList] = useState<Type[]>([]);
    const [holdingList, setHoldingList] = useState<Holding[]>([]);
    const [holdingDBIsUpdated, setHoldingDBIsUpdated] = useState<boolean>(true)
    const [selectedCategory, setSelectedCategory] = useState<Category>();
    const [selectedType, setSelectedType] = useState<Type>();
    const [selectedDate, setSelectedDate] = useState<Date>(initialDate)
    const [submitMessage, setSubmitMessage] = useState<string | null>(null);
    const categoryId = form.watch('holding.category.id');
    const price = form.watch('price');
    const quantity = form.watch('quantity');
    const isListedStockOrCrypto = isQuoteBackedBalanceCategory(selectedCategory?.name);

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
        if(session?.user.id){
            form.setValue("userId", session.user.id);
        }
    }, [form, session?.user.id])

    useEffect(() => {
        if(holdingDBIsUpdated || categoryId){
            const getHoldings = async () => {
                let holdingData;
                if(categoryId){
                    holdingData = await fetchHoldingsWithHoldingId(Number(categoryId));
                }else{
                    holdingData = await fetchHoldings();
                }
                if(holdingData && selectedType){
                    holdingData = holdingData.filter((holding) => holding.typeId === selectedType.id);
                }
                holdingData && setHoldingList(holdingData);
                setHoldingDBIsUpdated(false)
            }
            getHoldings();
        }
    },[holdingDBIsUpdated, categoryId, selectedType])

    useEffect(() => {
        form.setValue('value', price*quantity)
    }, [price, quantity, form])

    const fetchAndUpdatePrice = async (holding: Holding) => {
        const pricePrefill = getBalancePricePrefill(holding);
        if(pricePrefill){
            try {
                if(pricePrefill.kind === 'cryptocurrency'){
                    const price = await fetchCryptoPriceFromAPI(pricePrefill.sourceId)
                    form.setValue('price', price);
                    form.setValue('currency', pricePrefill.currency);
                }else if(pricePrefill.kind === 'listed-security'){
                    const price = await fetchListedStockPriceFromAPI(pricePrefill.sourceId)
                    if(typeof price === "number"){
                        form.setValue('price', price);
                        form.setValue('currency', pricePrefill.currency);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch quote for holding', error);
            }
        }
    }

    async function onSubmit(values: BalanceCreateType){
        setSubmitMessage(null);
        try {
            const result = await createBalance(values);
            if (result?.message) {
                setSubmitMessage(result.message);
            }
        } catch (error) {
            console.error("create balance submit failed", error);
            setSubmitMessage("Balance could not be saved. Check required fields and try again.");
        }
    }

    return(
        <div className="flex flex-col justify-start items-start">
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit, (errors) => {
                        console.log('create balance form validation Errors:', errors)})
                    }
                    className="w-full space-y-2"
                >
                    <FormField
                        control={form.control}
                        name="holding.category.id"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel> Category </FormLabel>
                                <Select
                                    onValueChange={(value) => {
                                        field.onChange(value);
                                        const category = categoryList.find((category) => category.id.toString() === value);
                                        setSelectedCategory(category);
                                        form.setValue("holdingId", 0);
                                        form.setValue("holding.name", "");
                                    }}
                                >
                                    <FormControl>
                                        <SelectTrigger className="w-full sm:w-80">
                                            <SelectValue/>
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="w-[var(--radix-select-trigger-width)] sm:w-80">
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
                        name="holding.type"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel> Type </FormLabel>
                                    <Select
                                        onValueChange={(value) => {
                                            field.onChange(value);
                                            setSelectedType(typeList.find((type) => value === type.id?.toString()));
                                            form.setValue("holdingId", 0);
                                            form.setValue("holding.name", "");
                                        }}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="w-full sm:w-80">
                                                <SelectValue/>
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="w-[var(--radix-select-trigger-width)] sm:w-80">
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
                        name="holding.name"
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
                                                    "w-full justify-between sm:w-80",
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
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 sm:w-80">
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
                                                                form.setValue("holding.name", holding.name);
                                                                form.setValue("holdingId", holding.id);
                                                                fetchAndUpdatePrice(holding);
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
                                    <Input
                                        {...field}
                                        type="number"
                                        className="w-full sm:w-80"
                                        placeholder="Category"
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
                                        {...field}
                                        type="number"
                                        className="w-full sm:w-80"
                                        placeholder="Price"
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
                                        {...field}
                                        type="number"
                                        className="w-full sm:w-80"
                                        placeholder="Value"
                                        readOnly={true}
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
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="w-full sm:w-80">
                                                <SelectValue/>
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="w-[var(--radix-select-trigger-width)] sm:w-80">
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
                            <FormItem {...field} className="flex flex-col">
                                <FormLabel className="py-1"> Date </FormLabel>
                                <FormControl>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal sm:w-80", !initialDate && "text-muted-foreground")}>
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
                                        className="w-full sm:w-80"
                                        placeholder="add some note"
                                        />
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />

                    {form.formState.isSubmitting && (
                        <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
                            Saving balance...
                        </p>
                    )}
                    {submitMessage && (
                        <p className="text-sm text-destructive" role="alert">
                            {submitMessage}
                        </p>
                    )}
                    <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? "Saving..." : "Submit"}
                    </Button>
                </form>
            </Form>
        </div>
    )
}
