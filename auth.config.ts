import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";

const privateRoutePrefixes = ["/dashboard", "/documentos"];
const publicAuthRoutes = [
  "/login",
  "/cadastro",
  "/recuperar-senha",
  "/redefinir-senha",
];

const authConfig = {
  providers: [],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = Boolean(auth?.user);
      const isPrivateRoute = privateRoutePrefixes.some((prefix) =>
        nextUrl.pathname.startsWith(prefix),
      );
      const isAuthRoute = publicAuthRoutes.includes(nextUrl.pathname);

      if (isPrivateRoute && !isLoggedIn) {
        const loginUrl = new URL("/login", nextUrl.origin);
        loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
      }

      if (isAuthRoute && isLoggedIn) {
        return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
