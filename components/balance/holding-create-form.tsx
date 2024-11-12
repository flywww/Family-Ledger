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

import { Category, HoldingCreateType, HoldingCreateSchema, Type } from "@/lib/definitions"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { symbol } from "zod"
import { fetchCryptosFromAPI, fetchListedStocksFromAPI, createHolding } from "@/lib/actions"
import { cn } from "@/lib/utils"
import { useDebouncedCallback} from 'use-debounce';
import { DialogClose } from "@radix-ui/react-dialog"



export default function CreateHoldingForm({
    holdingDBIsUpdated,
    setHoldingDBIsUpdated,
    selectedCategory,
    selectedType,
    isListedStockOrCrypto, 
}: {
    holdingDBIsUpdated: boolean, 
    setHoldingDBIsUpdated: (updated: boolean) => void,
    selectedCategory: Category | undefined,
    selectedType: Type | undefined,
    isListedStockOrCrypto: boolean,
}){
    const [queriedHoldingList, setQueriedHoldingList] = useState<HoldingCreateType[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false)
    
    const form = useForm<HoldingCreateType>({
        resolver: zodResolver(HoldingCreateSchema),
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
    
    const handleFormSubmit = (data: HoldingCreateType) => {
        console.log(`on holding form submit: ${data}`);
        
        createHolding(data);
        setHoldingDBIsUpdated(true);
        setDialogOpen(false);
    }

    return(
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" onClick={() => setDialogOpen(true)}>Add</Button>
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
                            form.setValue("categoryId", selectedCategory?.id || 0);
                            form.setValue("typeId", selectedType?.id || 0); 
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
                            <DialogClose asChild>
                                <Button variant="secondary">Cancel</Button>
                            </DialogClose>
                            <Button type="submit">Add</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}