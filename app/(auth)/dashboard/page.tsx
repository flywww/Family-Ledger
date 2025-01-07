import { getCalculatedMonth } from "@/lib/utils";
import Search from "@/components/search";
import CategorySelector from "@/components/dashboard/category-selector";
import SummarySection from "@/components/dashboard/summary-section";
import ChartSection from "@/components/dashboard/chart-section";
import { fetchCategories, fetchLastDateOfBalance, fetchSetting, fetchValueData, getConvertedCurrency } from "@/lib/actions";
import { auth } from "@/auth";
import { currencyType } from "@/lib/definitions";
import DashboardSkeleton from "@/components/dashboard/skeleton/dashboard-skeleton";
import { Suspense } from "react";

export default async function Page({
  searchParams
}:{
  searchParams?: {
    date?: string
    categories?: string,
    currency?: string,
  }
}) {
    const queryDate = searchParams?.date ? new Date(searchParams.date) : await fetchLastDateOfBalance() || getCalculatedMonth(new Date(), -1)
    const categoryData = await fetchCategories();
    const session = await auth();
    const setting = session && await fetchSetting(session.user.id);
    let categoryNames;
    if(searchParams?.categories){
      categoryNames = searchParams.categories.split(',');
    }else if(setting && !searchParams?.categories){
      categoryNames = setting ? setting.displayCategories.split(',') : categoryData?.map( category => category.name) || [];  
    }else{
      categoryNames = categoryData?.map( category => category.name) || [];
    }

    const queryCategories = categoryData?.filter( category => categoryNames.includes(category.name)) || [];
    const valueDataArray = await fetchValueData();
    const currency = (searchParams?.currency ? searchParams.currency : setting?.displayCurrency || 'USD') as currencyType;
    const filteredValueData = valueDataArray 
                              ? await Promise.all(
                                  valueDataArray
                                    .filter(valueData => categoryNames.includes(valueData.category.name))
                                    .map(async valueData => ({...valueData, value: await getConvertedCurrency('USD',currency,valueData.value,valueData.date) || 0}))
                                )
                              : [];
                              
    return (
      <div className="flex flex-col gap-3 justify-stretch">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Suspense>
            <Search queryDate={queryDate}/>
          </Suspense>
          <Suspense>
            <CategorySelector 
              queryCategories={queryCategories} 
              categories={categoryData || []}
            />
          </Suspense>
          
        </div>
        <div className="flex flex-col gap-3 justify-center items-center w-full">
          <SummarySection 
              queryDate={queryDate} 
              valueData={filteredValueData}
              currency={currency}
          />
          <ChartSection
            queryDate={queryDate} 
            categories={categoryNames}
            valueData={filteredValueData}
          />
        </div>
      </div>
    );
  }