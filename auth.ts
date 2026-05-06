import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import CredentialsProviders from 'next-auth/providers/credentials';
import { LoginSchema } from "./lib/definitions";
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
                try {
                    const parsedCredentials = LoginSchema.safeParse(credentials);
                    console.log(`[Auth] Credentials validation result:`, parsedCredentials);

                    if(!parsedCredentials.success){
                        console.error(`[Auth] Credentials validation failed:`, parsedCredentials.error);
                        return null;
                    }

                    const { account, password } = parsedCredentials.data;
                    console.log(`[Auth] Attempting login for account: ${account}`);

                    const user = await fetchUserWithAccount(account);
                    console.log(`[Auth] User lookup result:`, user ? `User found (id: ${user.id})` : `User not found`);

                    if(!user) {
                        console.error(`[Auth] User not found for account: ${account}`);
                        return null;
                    }

                    const passwordsMatch = await bcrypt.compare(password, user.password);
                    console.log(`[Auth] Password match result: ${passwordsMatch}`);

                    if(passwordsMatch) {
                        console.log(`[Auth] Login successful for account: ${account}`);
                        return {id: user.id, account: user.account};
                    }

                    console.error(`[Auth] Password mismatch for account: ${account}`);
                    return null;
                } catch (error) {
                    console.error(`[Auth] Unexpected error during authorization:`, error);
                    return null;
                }
            },
        }),
    ],
});
