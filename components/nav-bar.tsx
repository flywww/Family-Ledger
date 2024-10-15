import NavLinks from "./nav-links"
import NavMenu from "./nav-menu"

export default function NavBar(){
    return(
        <div className="flex flex-row gap-8 items-center justify-start w-full h-20 px-8 bg-background">
            <h1 className="text-2xl font-bold text-blue-50">Family Ledger</h1>
            <NavLinks/>
            <NavMenu/>
        </div>
    )
}