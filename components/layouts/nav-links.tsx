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
                            "flex h-8 items-center justify-start rounded-full px-8 text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                            {
                                'bg-accent text-accent-foreground': pathname === link.href,
                            },
                        )}
                        aria-current={pathname === link.href ? "page" : undefined}
                    >
                        <p>{link.name}</p>
                    </Link>
                )
            }) }
        </div>
    )
}
