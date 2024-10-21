export type Balance = {
    id: number
    date: Date
    holdingName: string
    holdingSymbol: string
    quantity: number
    price: number
    value: number
    currency: 'TWD' | 'USD'
    note?: string
    userName: string
    updateAt: Date
}