import type { NextAuthConfig } from 'next-auth'
import { getAuthorizedRouteDecision } from './lib/auth-route-policy';

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
            if(user){
                token.id = user.id;
                token.account = user.account;
            }
            return token
        },
        async session({ session, token}: {session: any, token: any}){ //BUG: session can't load when user log in at the first time
            if(token){
                session.user.id = token.id;
                session.user.account = token.account;
            }
            return session;
        },
        authorized({ auth, request: { nextUrl} }){
            const isLoggedIn = !!auth?.user;
            return getAuthorizedRouteDecision({ isLoggedIn, nextUrl });
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
