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
        setSelectedCategories(queryCategories);
    }, [queryCategories])

    const applySelectedCategories = (nextSelectedCategories: Category[]) => {
        const params = new URLSearchParams(searchParams);
        const categoryNames = nextSelectedCategories.map(category => category.name).toString();

        if (params.get('categories') !== categoryNames) {
            params.set('categories', categoryNames);
            replace(`${pathname}?${params.toString()}`);
        }

        updateDisplayCategories(categoryNames);
    }

    const handleCheckedChange = (category: Category, checked: boolean) => {
        if (!checked && selectedCategories.length <= 1) {
            return;
        }

        const nextSelectedCategories = checked
            ? [...selectedCategories, category]
            : selectedCategories.filter(selectedCategory => selectedCategory.id !== category.id);

        setSelectedCategories(nextSelectedCategories);
        applySelectedCategories(nextSelectedCategories);
    }

    return (
        <div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-32">
                        Category <ChevronDownIcon className="ml-2 h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    {categories.map( category => {
                        return (
                            <DropdownMenuCheckboxItem
                                key={category.id}
                                className="capitalize"
                                checked={selectedCategories.some( selectedCategory => selectedCategory.id === category.id) }
                                onCheckedChange={ checked => handleCheckedChange(category, checked)}
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
