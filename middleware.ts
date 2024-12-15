    import NextAuth from "next-auth";
    import { authConfig  } from "./auth.config"; 
    import { NextRequest } from "next/server";


    // Use only one of the two middleware options below
    // 1. Use middleware directly
    export const { auth: middleware } = NextAuth(authConfig)

    // 2. Wrapped middleware option
    // const { auth } = NextAuth(authConfig)
    // export default auth(async function middleware(req: NextRequest) {
    //     console.log(`[AUTH:middleware-auth] req: ${JSON.stringify(req)}`);
    //     if (!req.auth && req.nextUrl.pathname !== "/login") {
    //         console.log(`[AUTH:middleware-auth] req: ${JSON.stringify(req)}`);
    //         const newUrl = new URL("/login", req.nextUrl.origin)
    //         console.log(`[AUTH:middleware-auth]  newURL     ${JSON.stringify(newUrl)}`);
    //         return Response.redirect(newUrl)
    //     }
    // })

    export const config = {
        matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)']
    }  