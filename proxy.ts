import NextAuth from "next-auth";
import authConfig from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth(() => {
  return;
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/documentos/:path*",
    "/associados/:path*",
    "/taxistas/:path*",
    "/transportes-escolares/:path*",
    "/caminhoes/:path*",
    "/empresas/:path*",
    "/login",
    "/cadastro",
    "/recuperar-senha",
    "/redefinir-senha",
  ],
};
