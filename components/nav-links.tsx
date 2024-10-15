'use client'

import clsx from "clsx"
import Link from "next/link"
import { usePathname } from "next/navigation"

const links = [
    { name: 'Dashboard' , href: '/dashboard' },
    { name: 'Balance' , href: '/balance' },
]

export default function NavLinks(){
    const pathname = usePathname();
    return (
        <div className="flex flex-row justify-start items-center gap-8">
            { links.map( (link) => {
                return(
                    <Link
                        key={link.name}
                        href={link.href}
                        className={clsx(
                            "flex items-center justify-start h-8 px-8 rounded-full hover:text-white hover:text-opacity-80",
                            {
                                'bg-slate-200 dark:bg-slate-900': pathname === link.href,
                            },
                        )}
                    >
                        <p>{link.name}</p>
                    </Link>
                )
            }) }
        </div>
    )
}