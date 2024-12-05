import { getCalculatedMonth } from "@/lib/utils";
import Search from "@/components/search";
import CategorySelector from "@/components/dashboard/category-selector";
import SummarySection from "@/components/dashboard/summary-section";
import ChartSection from "@/components/dashboard/chart-section";
import { fetchCategories, fetchValueData } from "@/lib/actions";

export default async function Page({
  searchParams
}:{
  searchParams?: {
    date?: string
    categories?: string
  }
}) {
  //TODO: remember selected category
  //TODO: get currency from setting, and display different currency
    const displayCurrency = 'USD'
    const queryDate = searchParams?.date ? new Date(searchParams.date) : getCalculatedMonth(new Date(), -1)
    const categoryData = await fetchCategories();
    const categories = searchParams?.categories ? searchParams.categories.split(',') : categoryData?.map( category => category.name) || []    
    const queryCategories = categoryData?.filter( category => categories.includes(category.name)) || [];
    const valueDataArray = await fetchValueData();
    const filteredValueData = valueDataArray ? valueDataArray.filter(valueData => categories.includes(valueData.category.name)) : [];

    console.log(`filteredValueData: ${JSON.stringify(filteredValueData)}`);
    

    return (
      <div className="flex flex-col gap-3 justify-start">
        <div className="flex flex-row gap-3">
          <Search queryDate={queryDate}/>
          <CategorySelector queryCategories={queryCategories} categories={categoryData}/>
        </div>
        <SummarySection 
          queryDate={queryDate} 
          categories={categories}
          valueData={filteredValueData}
        />
        <ChartSection
          queryDate={queryDate} 
          categories={categories}
          valueData={filteredValueData}
        />
      </div>
    );
  }