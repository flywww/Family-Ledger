import { getCalculatedMonth } from "@/lib/utils";
import Search from "@/components/search";
import CategorySelector from "@/components/dashboard/category-selector";
import SummarySection from "@/components/dashboard/summary-section";
import ChartSection from "@/components/dashboard/chart-section";

export default async function Page({
  searchParams
}:{
  searchParams?: {
    date?: string
    excludedCategory?: string
  }
}) {
  //TODO: remember selected category
  //TODO: get currency from setting
    const displayCurrency = 'USD'
    const queryDate = searchParams?.date ? new Date(searchParams.date) : getCalculatedMonth(new Date(), -1)
    const excludedCategory = searchParams?.excludedCategory ? searchParams.excludedCategory.split(',') : []    

    return (
      <div className="flex flex-col gap-3 justify-start">
        <div className="flex flex-row gap-3">
          <Search queryDate={queryDate}/>
          <CategorySelector/>
        </div>
        <SummarySection 
          queryDate={queryDate} 
          excludedCategory={excludedCategory}
        />
        <ChartSection
          excludedCategory={excludedCategory}
        />
      </div>
    );
  }