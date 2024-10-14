import NavBar from "@/components/nav-bar";

export default function Layout({children}: { children: React.ReactNode}){
    return(
        <div className="flex flex-col h-screen">
            <div className="w-full h-20">
                <NavBar/>
            </div>
            <div className="flex-grow p-6">
                {children}
            </div>
        </div>
    )
}