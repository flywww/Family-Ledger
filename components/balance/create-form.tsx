'use client'

import { BalanceFormSchema, BalanceRecord, CategoryForm, CategoryFormSchema, TypeForm } from "@/lib/definitions";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"

import { Button } from "../ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod"
import { cn, firstDateOfMonth } from "@/lib/utils";
import { Input } from "../ui/input";
import { useRouter } from "next/navigation";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { CalendarIcon } from "lucide-react";
import { MonthPicker } from "../ui/month-picker";
import { format } from "date-fns";
import { minYear } from "@/lib/data";
import { SelectContent, SelectTrigger, SelectValue, Select, SelectItem } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { useEffect, useState } from "react";
import { fetchCategories, fetchTypes } from "@/lib/actions";

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
            updateAt: new Date(),
            createdAt: new Date(),
        },
    });
    const [categoryList, setCategoryList] = useState<CategoryForm[]>([]);
    const [typeList, setTypeList] = useState<TypeForm[]>([]);
    const [holdingList, setHoldingList] = useState<{ name: string, symbol: string}[]>([]); 

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

    function onSubmit(values: BalanceRecord){
        
        console.log('!!!!');
        console.log(values);
        router.push(decodeURIComponent(backURL))        
    }
    
    return(
        <div>
            Create Balance Form
            <Form {...form}>
                <form 
                    onSubmit={form.handleSubmit(onSubmit, (errors) => { 
                        console.log('Validation Errors:', errors)})
                    } 
                    className="space-y-1"
                >
                    <FormField
                        control={form.control}
                        name="categoryName"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel> Category </FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="w-80">
                                            <SelectValue/>
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="w-80">
                                        { categoryList.map( (category) => (
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
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                            <FormItem>
                                <FormLabel> Name </FormLabel>
                                <FormControl>
                                    <Input className="w-80" placeholder="Name" {...field}/>
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="holdingSymbol"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel> Symbol </FormLabel>
                                <FormControl>
                                    <Input className="w-80" placeholder="Symbol" {...field}/>
                                </FormControl>
                                <FormMessage/>
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