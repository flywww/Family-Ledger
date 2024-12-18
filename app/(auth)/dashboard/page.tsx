import { getCalculatedMonth } from "@/lib/utils";
import Search from "@/components/search";
import CategorySelector from "@/components/dashboard/category-selector";
import SummarySection from "@/components/dashboard/summary-section";
import ChartSection from "@/components/dashboard/chart-section";
import { fetchCategories, fetchLastDateOfBalance, fetchSetting, fetchValueData } from "@/lib/actions";
import { auth } from "@/auth";

export default async function Page({
  searchParams
}:{
  searchParams?: {
    date?: string
    categories?: string
  }
}) {
  //TODO: remember selected category
 //BUG: Can not fetch data when user get in the page for the first time!!!
    const queryDate = searchParams?.date ? new Date(searchParams.date) : await fetchLastDateOfBalance() || getCalculatedMonth(new Date(), -1)
    const categoryData = await fetchCategories();
    const session = await auth();   
    let categoryNames;

    if(searchParams?.categories){
      categoryNames = searchParams.categories.split(',');
    }else if(session && !searchParams?.categories){
      const setting = await fetchSetting(session.user.id);
      categoryNames = setting ? setting.displayCategories.split(',') : categoryData?.map( category => category.name) || [];  
    }else{
      categoryNames = categoryData?.map( category => category.name) || [];
    }

    const queryCategories = categoryData?.filter( category => categoryNames.includes(category.name)) || [];
    const valueDataArray = await fetchValueData();
    const filteredValueData = valueDataArray ? valueDataArray.filter(valueData => categoryNames.includes(valueData.category.name)) : [];

    return (
      <div className="flex flex-col gap-3 justify-start">
        <div className="flex flex-row gap-3">
          <Search queryDate={queryDate}/>
          <CategorySelector 
            queryCategories={queryCategories} 
            categories={categoryData || []}
          />
        </div>
        <SummarySection 
          queryDate={queryDate} 
          valueData={filteredValueData}
        />
        <ChartSection
          queryDate={queryDate} 
          categories={categoryNames}
          valueData={filteredValueData}
        />
      </div>
    );
  }