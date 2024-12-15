import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
    pages: {
        signIn: '/login',
        signOut: '/login',
        error: '/login',
        //verifyRequest,
        //newUser
        //forgotPassword
        //resetPassword
    },
    session:{
        strategy: 'jwt',
        maxAge: 20 * 24 * 60 * 60, //seconds
    },
    events:{
        signOut: async (message) => {
            console.log('User has logged out:', message);
        },
        signIn: async (message) => {
            console.log('User has logged in:', message.user);
        },
        createUser: async (message) => {
            console.log('New user created:', message.user);
        },
        linkAccount: async (message) => {
            console.log('Account connected:', message.user);
        },
    },
    callbacks:{
        async jwt({ token, user }){
            console.log(`[AUTH:jst] token: ${JSON.stringify(token)}, user: ${JSON.stringify(user)}`);
            if(user){
                token.id = user.id;
                token.account = user.account;
            }
            console.log(`[AUTH:jst] token(user update?): ${JSON.stringify(token)}, user: ${JSON.stringify(user)}`);
            return token
        },
        async session({ session, token}: {session: any, token: any}){
            console.log(`[AUTH:session] session: ${JSON.stringify(session)}, token: ${JSON.stringify(token)}`);
            if(token){
                session.user.id = token.id;
                session.user.account = token.account;
            }
            console.log(`[AUTH:session] session(token update?): ${JSON.stringify(session)}, token: ${JSON.stringify(token)}`);
            return session;
        },
        authorized({ auth, request: { nextUrl} }){
            console.log(`[AUTH:Authorized] function: auth: ${JSON.stringify(auth)}, request: ${JSON.stringify(nextUrl)}`);
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
            const isOnBalance = nextUrl.pathname.startsWith('/balance');
            const isOnSetting = nextUrl.pathname.startsWith('/setting');
            const isOnRoot = nextUrl.pathname.startsWith('/');
            console.log(`[AUTH:Authorized] isLoggedIn:${isLoggedIn}, isOnDashboard:${isOnDashboard}, isOnBalance:${isOnBalance}, isOnSetting:${isOnSetting}`);
            if(isOnDashboard || isOnBalance || isOnSetting){
                if(isLoggedIn) return true;
                return false;
            }
            else if(isLoggedIn && isOnRoot){
                return Response.redirect(new URL('/dashboard', nextUrl));
            }
            return true;
        },
    },
    providers: [] //list different login option
} satisfies NextAuthConfig;

/*
    callbacks:{
        authorized({ auth, request: { nextUrl} }){
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
            const isOnBalance = nextUrl.pathname.startsWith('/balance');
            if(isOnDashboard){
                if(isLoggedIn) return true;
                return false;
            }if(isOnBalance){
                if(isLoggedIn) return true;
                return false;
            }
            else if(isLoggedIn){
                return Response.redirect(new URL('/dashboard', nextUrl));
            }
            return true;
        },
    },
*/