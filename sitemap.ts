import { MetadataRoute } from "next"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    return [
        {
            url: "https://family-ledger/stan004.com",
            lastModified: new Date(),
            changeFrequency: "yearly",
            priority: 0.2
        },
        {
            url: "https://family-ledger/stan004.com/dashboard",
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 1
        },
        {
            url: "https://family-ledger/stan004.com/balance",
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.8
        },
        {
            url: "https://family-ledger/stan004.com/setting",
            lastModified: new Date(),
            changeFrequency: "yearly",
            priority: 0.5
        },
    ]
}