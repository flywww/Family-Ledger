import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import CredentialsProviders from 'next-auth/providers/credentials';
import { User, UserSchema } from "./lib/definitions";
import { fetchUserWithAccount } from "./lib/actions";
import bcrypt from 'bcryptjs'

export const { auth, handlers, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        CredentialsProviders({
            credentials: {
                account: {label: "Account", type: "text"},
                password: {label: "Password", type: "password"},
            },
            async authorize(credentials){
                //console.log(`[AUTH:authorize] credentials: ${JSON.stringify(credentials)}`);
                const parsedCredentials = UserSchema.safeParse(credentials);
                if(parsedCredentials.success){
                    const { account, password } = parsedCredentials.data;
                    const user = await fetchUserWithAccount(account);
                    //console.log(`[AUTH:authorize] fetch user with account: ${JSON.stringify(user)}`);
                    
                    if(!user) return null;
                    const passwordsMatch = await bcrypt.compare(password, user.password)
                    if(passwordsMatch) return {id: user.id, account: user.account};
                }
                //console.log(`[AUTH:authorize] Invalid credentials`);
                return null;
            },
        }),
    ],
});