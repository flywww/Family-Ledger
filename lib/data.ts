export const monthList = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

export const getYearList = () => {
    const minYear = 2020;
    const maxYear = new Date().getFullYear();
    const yearList: string[] = [];
    
    for(let i = minYear; i <= maxYear; i++){    
        yearList.push(i.toString());
    }
    return yearList;
}