'use client'

import { 
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import { ChevronDownIcon } from "lucide-react";
import { useSearchParams, usePathname, useRouter } from "next/navigation"
import { useContext, useEffect, useState } from "react";
import { Category } from "@/lib/definitions";
import { SettingContext } from "@/context/settingContext";

export default function CategorySelector ({
    categories,
    queryCategories
}:{
    categories: Category[],
    queryCategories: Category[]
}){

    const [categoryList, setCategoryList] = useState<Category[]>(categories);
    const [selectedCategories, setSelectedCategories] = useState<Category[]>(queryCategories) 
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();
    const settingContext = useContext(SettingContext);
    if(!settingContext){
        throw Error ("Setting must be used within a setting provider")
    }
    const { updateDisplayCategories } = settingContext;

    useEffect(() => {
        const params = new URLSearchParams(searchParams);
        const categoryNames = selectedCategories.map(category => category.name).toString();
        params.set('categories', categoryNames);
        updateDisplayCategories(categoryNames);
        replace(`${pathname}?${params.toString()}`); 
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
                                        !checked && selectedCategories.length > 1 && setSelectedCategories(selectedCategories.filter( selectedCategory => selectedCategory.id !== category.id ))
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