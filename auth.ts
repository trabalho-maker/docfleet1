import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import authConfig from "@/auth.config";
import {
  AuthRateLimitError,
  validateUserCredentials,
} from "@/features/auth/server/auth-service";
import { logger, maskEmail } from "@/lib/logger";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString() ?? "";
        const password = credentials?.password?.toString() ?? "";

        logger.info("auth.authorize.attempt", {
          email: maskEmail(email),
        });

        try {
          const user = await validateUserCredentials({ email, password });

          if (!user) {
            logger.warn("auth.authorize.denied", {
              email: maskEmail(email),
            });
            return null;
          }

          logger.info("auth.authorize.success", {
            userId: user.id,
            email: maskEmail(user.email),
            role: user.role,
          });

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          };
        } catch (error) {
          if (error instanceof AuthRateLimitError) {
            logger.warn("auth.authorize.rate_limited", {
              email: maskEmail(email),
              retryAfterSeconds: error.retryAfterSeconds,
            });
            throw error;
          }

          logger.error("auth.authorize.error", {
            email: maskEmail(email),
            error,
          });
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    jwt({ token, user }) {
      if (user && "role" in user && typeof user.role === "string") {
        token.role = user.role;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = typeof token.role === "string" ? token.role : "";
      }

      return session;
    },
  },
});
