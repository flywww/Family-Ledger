import NavBar from "@/components/layouts/nav-bar";

export default function Layout({children}: { children: React.ReactNode}){
    return(
        <div className="flex flex-col h-screen">
            <div className="w-full h-20">
                <NavBar/>
            </div>
            <div className="flex-grow p-4 sm:p-8">
                {children}
            </div>
        </div>
    )
}