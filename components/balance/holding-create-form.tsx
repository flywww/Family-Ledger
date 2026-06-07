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
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons"
import { Category, HoldingCreateType, HoldingCreateSchema, Type } from "@/lib/definitions"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { fetchCryptosFromAPI, fetchListedStocksFromAPI, createHolding } from "@/lib/actions"
import { cn } from "@/lib/utils"
import { useDebouncedCallback} from 'use-debounce';
import { DialogClose } from "@radix-ui/react-dialog"
import { useSession } from "next-auth/react"

type HoldingSearchResult = Pick<HoldingCreateType, "name" | "symbol" | "sourceId" | "sourceURL">;

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
    const [queriedHoldingList, setQueriedHoldingList] = useState<HoldingSearchResult[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false)
    const [submitMessage, setSubmitMessage] = useState<string | null>(null);
    const [submitSucceeded, setSubmitSucceeded] = useState(false);
    const [isSearchingHoldings, setIsSearchingHoldings] = useState(false);
    const searchRequestId = useRef(0);
    const { data: session } = useSession();

    const form = useForm<HoldingCreateType>({
        resolver: zodResolver(HoldingCreateSchema),
        defaultValues:{
            name: "",
            userId: session?.user.id,
            symbol: "",
        }
    })

    useEffect(() => {
        if(session?.user.id){
            form.setValue("userId", session.user.id);
        }
    }, [form, session?.user.id])

    const handleSearch = useDebouncedCallback(async (query: string) => {
        const requestId = searchRequestId.current + 1;
        searchRequestId.current = requestId;

        if(!query.trim() || !isListedStockOrCrypto){
            setQueriedHoldingList([]);
            setIsSearchingHoldings(false);
            return;
        }

        setIsSearchingHoldings(true);
        try {
            let data: HoldingSearchResult[];
            if(selectedCategory?.name === "Cryptocurrency"){
                data = await fetchCryptosFromAPI(query);
            }else if(selectedCategory?.name === "Listed stock"){
                data = await fetchListedStocksFromAPI(query)
            }else{
                data = [];
            }
            if(searchRequestId.current === requestId){
                setQueriedHoldingList(data);
            }
        } catch (error) {
            console.error("Failed to search holdings", error);
            if(searchRequestId.current === requestId){
                setQueriedHoldingList([]);
            }
        } finally {
            if(searchRequestId.current === requestId){
                setIsSearchingHoldings(false);
            }
        }
    },300)

    const handleFormSubmit = async (data: HoldingCreateType) => {
        setSubmitMessage(null);
        setSubmitSucceeded(false);
        try {
            const result = await createHolding(data);
            if (result?.message) {
                setSubmitMessage(result.message);
                return;
            }
            setHoldingDBIsUpdated(true);
            setSubmitSucceeded(true);
            setSubmitMessage("Holding saved. It is available in the holding list.");
            window.setTimeout(() => setDialogOpen(false), 700);
        } catch (error) {
            console.error("holding submit failed", error);
            setSubmitMessage("Holding could not be saved. Check required fields and try again.");
        }
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
                        className="w-full space-y-1"
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
                                                        "w-full justify-between sm:w-80",
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
                                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 sm:w-80">
                                            <Command>
                                                <CommandInput
                                                    placeholder="Search holdings"
                                                    className="h-9"
                                                    isLoading={isSearchingHoldings}
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
                                                                    form.setValue("sourceId", holding.sourceId);
                                                                    form.setValue("sourceURL", holding.sourceURL);
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
                                            className="w-full sm:w-80"
                                            placeholder="Input name of assets/liability"
                                            readOnly={isListedStockOrCrypto}
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
                                            className="w-full sm:w-80"
                                            placeholder="Input symbol of assets/liability"
                                            readOnly={isListedStockOrCrypto}
                                            {...field}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        {form.formState.isSubmitting && (
                            <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
                                Saving holding...
                            </p>
                        )}
                        {submitMessage && (
                            <p
                                className={cn("text-sm", submitSucceeded ? "text-emerald-600" : "text-destructive")}
                                role={submitSucceeded ? "status" : "alert"}
                                aria-live={submitSucceeded ? "polite" : undefined}
                            >
                                {submitMessage}
                            </p>
                        )}
                        <DialogFooter className="pt-4">
                            <DialogClose asChild>
                                <Button variant="secondary">Cancel</Button>
                            </DialogClose>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? "Saving..." : "Add"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
