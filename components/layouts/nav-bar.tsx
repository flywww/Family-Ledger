import NavLinks from "./nav-links"
import NavMenu from "./nav-menu"

export default function NavBar(){
    return(
        <div className="flex flex-row gap-8 items-center justify-between w-full h-20 px-4 sm:px-8 bg-background">
            <div className="flex flex-row gap-8 items-center justify-start">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Family Ledger</h1>
                <div className="hidden sm:flex">
                    <NavLinks/>
                </div>
            </div>
            <NavMenu/>
        </div>
    )
}