import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

// Sesiones propias (no NextAuth): JWT firmado con jose, guardado en una
// cookie httpOnly. El payload lleva id/email directo — evita un round-trip
// a la base en cada request que solo necesita saber quién está logueado.

export const SESSION_COOKIE = "curatta_session";
const SESSION_DURATION = "7d";
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

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

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(getSecret());
}

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

// Lo que la sesión necesita de las cookies, dicho con nuestras palabras. Es la
// frontera que los tests reemplazan por un doble; en la app la da Next.
export type OpcionesCookie = {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  maxAge: number;
  path: string;
};

export type AlmacenDeCookies = {
  leer(nombre: string): string | undefined;
  guardar(nombre: string, valor: string, opciones: OpcionesCookie): void;
  borrar(nombre: string): void;
};

// Las cookies reales del pedido: lo único de este archivo que depende de Next.
export async function cookiesDeNext(): Promise<AlmacenDeCookies> {
  const store = await cookies();
  return {
    leer: (nombre) => store.get(nombre)?.value,
    guardar: (nombre, valor, opciones) => store.set(nombre, valor, opciones),
    borrar: (nombre) => store.delete(nombre),
  };
}

// La cookie de sesión no se puede leer desde JavaScript (httpOnly), sólo viaja
// por HTTPS en producción, no se manda en pedidos de otros sitios (lax) y dura
// lo mismo que el token.
export function opcionesDeCookieDeSesion(entorno: string | undefined): OpcionesCookie {
  return {
    httpOnly: true,
    secure: entorno === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  };
}

// Firma compatible con next-auth's `auth()`: { user: { id, email } } | null.
// Las rutas siguen llamando `await auth()` sin argumentos (usa las cookies de
// Next); los tests le pasan un almacén propio.
export async function auth(
  obtenerCookies: () => Promise<AlmacenDeCookies> = cookiesDeNext
): Promise<Sesion | null> {
  const almacen = await obtenerCookies();
  return sesionDesdeToken(almacen.leer(SESSION_COOKIE));
}

export async function setSessionCookie(
  payload: SessionPayload,
  obtenerCookies: () => Promise<AlmacenDeCookies> = cookiesDeNext
): Promise<void> {
  const token = await createSessionToken(payload);
  const almacen = await obtenerCookies();
  almacen.guardar(SESSION_COOKIE, token, opcionesDeCookieDeSesion(process.env.NODE_ENV));
}

export async function clearSessionCookie(
  obtenerCookies: () => Promise<AlmacenDeCookies> = cookiesDeNext
): Promise<void> {
  const almacen = await obtenerCookies();
  almacen.borrar(SESSION_COOKIE);
}
