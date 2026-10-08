import { cookies } from "next/headers";
import { jwtVerify } from "jose";

// Sesiones propias (no NextAuth): JWT firmado con jose, guardado en una
// cookie httpOnly. El payload lleva id/email directo — evita un round-trip
// a la base en cada request que solo necesita saber quién está logueado.
// El front solo LEE la sesión: crearla y borrarla es trabajo del backend
// (backend/lib/session.ts).

export const SESSION_COOKIE = "curatta_session";

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Falta la variable de entorno JWT_SECRET");
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  userId: string;
  email: string;
};

export type Sesion = { user: SessionPayload & { id: string } };

// Regla de la sesión, separada de dónde viene el token: un token sólo vale si
// está firmado con nuestro JWT_SECRET, no venció y trae userId y email. Ante
// cualquier duda (incluso si falta el secreto) devuelve null: mejor tratar a
// alguien como no logueado que dejar pasar un token que no pudimos verificar.
export async function sesionDesdeToken(token: string | undefined): Promise<Sesion | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.userId !== "string" || typeof payload.email !== "string") return null;
    return { user: { id: payload.userId, userId: payload.userId, email: payload.email } };
  } catch {
    return null;
  }
}

export type LeerToken = () => Promise<string | undefined>;

// La lectura real de la cookie: lo único de este archivo que depende de Next.
export const leerTokenDeCookie: LeerToken = async () => {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value;
};

// Firma compatible con next-auth's `auth()`: { user: { id, email } } | null.
// Las páginas siguen llamando `await auth()` sin argumentos (usa la cookie
// real); los tests le pasan un `leerToken` propio para no depender de Next.
export async function auth(leerToken: LeerToken = leerTokenDeCookie): Promise<Sesion | null> {
  return sesionDesdeToken(await leerToken());
}
