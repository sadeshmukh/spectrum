import { defineConfig } from "auth-astro";
import GitHub from "@auth/core/providers/github";
import { db, Users, eq } from "astro:db";

export default defineConfig({
  providers: [
    GitHub({
      clientId: import.meta.env.GITHUB_CLIENT_ID,
      clientSecret: import.meta.env.GITHUB_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false;

      let dbUser = await db
        .select()
        .from(Users)
        .where(eq(Users.email, user.email))
        .get();

      if (!dbUser) {
        // create user if they don't exist
        dbUser = await db
          .insert(Users)
          .values({
            email: user.email,
            name: user.name,
            image: user.image,
            isAdmin: import.meta.env.ADMIN_EMAIL === user.email,
          })
          .returning()
          .get();
        if (dbUser.isAdmin) {
          console.log(`${user.email} is admin`);
        }
      }

      user.id = dbUser.id;
      return true;
    },
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id,
          email: token.email,
          name: token.name,
          image: token.picture,
          isAdmin: import.meta.env.ADMIN_EMAIL === token.email,
        };
      }
      return session;
    },
  },
});
