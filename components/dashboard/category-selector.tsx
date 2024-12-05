'use client'

import { 
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuSubTrigger,
    DropdownMenuPortal,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import { ChevronDownIcon } from "lucide-react";
import { useSearchParams, usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react";
import { fetchCategories } from "@/lib/actions";
import { Category } from "@/lib/definitions";

export default function CategorySelector (){

    const [categoryList, setCategoryList] = useState<Category[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<Category[]>([]) 
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    useEffect(() => {
        const getCategoryList = async () => {
            const categoryData = await fetchCategories();
            if(categoryData){
                setCategoryList(categoryData)

                const categoriesString = searchParams.get('categories');
                if(categoriesString){
                    const categoryNames = categoriesString.split(",");
                    const initialSelectedCategories = categoryData.filter( category => categoryNames.some( name => name === category.name) )                    
                    setSelectedCategories(initialSelectedCategories);
                }
            }
        }
        getCategoryList();
    } ,[])

    //TODO: remove after finish the code
    useEffect(() => {
        const params = new URLSearchParams(searchParams);
        const categoryNames = selectedCategories.map(category => category.name).toString();
        params.set('categories', categoryNames);
        replace(`${pathname}?${params.toString()}`); 
        console.log(`effect watch: ${JSON.stringify(selectedCategories)}`);
        
    }, [selectedCategories])

    return (
        <div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="ml-auto">
                        Category <ChevronDownIcon className="ml-2 h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    {categoryList.map( category => {
                        return (
                            <DropdownMenuCheckboxItem
                                key={category.id}
                                className="capitalize"
                                checked={selectedCategories.some( selectedCategory => selectedCategory.id === category.id) }
                                onCheckedChange={ checked => {
                                        checked && setSelectedCategories([...selectedCategories, category])
                                        !checked && setSelectedCategories(selectedCategories.filter( selectedCategory => selectedCategory.id !== category.id ))
                                }}  
                            >
                                {category.name}
                            </DropdownMenuCheckboxItem>
                        )
                    })}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}