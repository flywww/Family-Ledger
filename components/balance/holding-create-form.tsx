'use client'

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons"

import { CategoryForm, HoldingForm, HoldingFormSchema, TypeForm } from "@/lib/definitions"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { symbol } from "zod"
import { fetchCryptosFromAPI, fetchListedStocksFromAPI } from "@/lib/actions"
import { cn } from "@/lib/utils"
import { useDebouncedCallback} from 'use-debounce';



export default function CreateHoldingForm({
    holdingDBIsUpdated,
    setHoldingDBIsUpdated,
    selectedCategory,
    selectedType, 
}: {
    holdingDBIsUpdated: boolean, 
    setHoldingDBIsUpdated: (updated: boolean) => void,
    selectedCategory: CategoryForm | undefined,
    selectedType: TypeForm | undefined,
}){
    const [queriedHoldingList, setQueriedHoldingList] = useState<HoldingForm[]>([]);
    const isListedStockOrCrypto = selectedCategory?.name === "Cryptocurrency" || selectedCategory?.name === "Listed stock";
    
    console.log(`type and category id: ${selectedType?.id}, ${selectedCategory?.id}`);
    console.log(`id numbering: ${Number(selectedType?.id)}`);
    console.log(`id numbering: ${Number(selectedCategory?.id)}`);
    
    const form = useForm<HoldingForm>({
        resolver: zodResolver(HoldingFormSchema),
        defaultValues:{
            name: "",
            userId: 3, //TODO: should load user id
            symbol: "",
        }
    })

    const handleSearch = useDebouncedCallback(async (query: string) => {

        let data;
        if(selectedCategory?.name === "Cryptocurrency"){
            data = await fetchCryptosFromAPI(query);
        }else if(selectedCategory?.name === "Listed stock"){
            data = await fetchListedStocksFromAPI(query)
        }else{
            data = [];
        }
        setQueriedHoldingList(data);
        console.log(`query "${query}" and get result: ${data}`);   
    },300)
    
    const handleFormSubmit = (data: any) => {
        console.log('Form data:', data);
        setHoldingDBIsUpdated(true);
        console.log(`submitted`);
        
        //TODO: create a new holding
    }

    return(
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline">Add</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Holding</DialogTitle>
                    <DialogDescription>
                        Create or search a new holding.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form 
                        className="space-y-1"
                        onSubmit={(event) => {
                            event.stopPropagation(); // Prevent submit balance form
                            form.handleSubmit((data) => {                
                                handleFormSubmit(data)
                            }, (errors) => {
                                console.log('holding validation errors: ', errors);
                            })(event);
                        }}
                    >
                        <FormField
                            control={form.control}
                            name="name"
                            render={({field}) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Search</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant='outline'
                                                    role="combobox"
                                                    className={cn(
                                                        "w-80 justify-between",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                    disabled={!isListedStockOrCrypto}
                                                >
                                                    {field.value
                                                        ? queriedHoldingList.find( (holding) => holding.name === field.value)?.name
                                                        : "Search holdings..."}
                                                    <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80 p-0">
                                            <Command>
                                                <CommandInput
                                                    placeholder="Search holdings"
                                                    className="h-9"
                                                    onValueChange={handleSearch}
                                                />
                                                <CommandList>
                                                    <CommandEmpty>No holding found</CommandEmpty>
                                                    <CommandGroup>
                                                        {queriedHoldingList.map((holding) => (
                                                            <CommandItem
                                                                value={`${holding.name}(${holding.symbol})`}
                                                                key={`${holding.name}(${holding.symbol})`}
                                                                onSelect={() => {
                                                                    form.setValue("name", holding.name);
                                                                    form.setValue("symbol", holding.symbol);
                                                                    form.setValue("categoryId", selectedCategory?.id || 0);
                                                                    form.setValue("typeId", selectedType?.id || 0);
                                                                    console.log(`form value: ${JSON.stringify(form.getValues())}`); 
                                                                }}
                                                            >
                                                                {`${holding.name}(${holding.symbol})`}
                                                                <CheckIcon
                                                                    className={cn(
                                                                        "ml-auto h-4 w-4",
                                                                        `${holding.name}(${holding.symbol})` === field.value ? "opacity-100" : "opacity-0"
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
                            name="name"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="text" 
                                            className="w-80" 
                                            placeholder="Input name of assets/liability"
                                            disabled={isListedStockOrCrypto} 
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="symbol"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Symbol</FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="text"
                                            className="w-80"
                                            placeholder="Input symbol of assets/liability"
                                            disabled={isListedStockOrCrypto}     
                                            {...field}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <DialogFooter className="pt-4">
                            <Button type="submit">Add</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}