export const monthList = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
export const minYear = 2020;
export const maxYear = new Date().getFullYear();

export const getYearList = () => {
    const yearList: string[] = [];
    
    for(let i = minYear; i <= maxYear; i++){    
        yearList.push(i.toString());
    }
    return yearList;
}

