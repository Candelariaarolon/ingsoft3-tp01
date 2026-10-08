import { SignJWT } from "jose";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  auth,
  clearSessionCookie,
  createSessionToken,
  opcionesDeCookieDeSesion,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  sesionDesdeToken,
  setSessionCookie,
  type AlmacenDeCookies,
} from "./session";

const SECRETO = "secreto-de-prueba-que-solo-existe-en-los-tests";

// Un almacén de cookies de mentira, en lugar de las cookies de Next.
function almacenFalso(token?: string) {
  const almacen = {
    leer: vi.fn().mockReturnValue(token),
    guardar: vi.fn(),
    borrar: vi.fn(),
  } satisfies AlmacenDeCookies;
  return { almacen, obtenerCookies: async () => almacen };
}

beforeEach(() => {
  vi.stubEnv("JWT_SECRET", SECRETO);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("createSessionToken + sesionDesdeToken", () => {
  it("un token recién creado identifica a la usuaria", async () => {
    const token = await createSessionToken({ userId: "u1", email: "ana@curatta.test" });

    expect(await sesionDesdeToken(token)).toEqual({
      user: { id: "u1", userId: "u1", email: "ana@curatta.test" },
    });
  });
});

describe("sesionDesdeToken", () => {
  it.each([
    ["no hay token", undefined],
    ["el token no es un JWT", "esto-no-es-un-jwt"],
  ])("no hay sesión si %s", async (_caso, token) => {
    expect(await sesionDesdeToken(token)).toBeNull();
  });

  it("rechaza un token firmado con otro secreto (alguien lo falsificó)", async () => {
    const falso = await new SignJWT({ userId: "u1", email: "ana@curatta.test" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(new TextEncoder().encode("otro-secreto-que-no-es-el-nuestro"));

    expect(await sesionDesdeToken(falso)).toBeNull();
  });

  it("rechaza un token vencido", async () => {
    const haceUnaHora = Math.floor(Date.now() / 1000) - 3600;
    const vencido = await new SignJWT({ userId: "u1", email: "ana@curatta.test" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(haceUnaHora)
      .sign(new TextEncoder().encode(SECRETO));

    expect(await sesionDesdeToken(vencido)).toBeNull();
  });

  it("rechaza un token bien firmado al que le falta el email", async () => {
    const sinEmail = await new SignJWT({ userId: "u1" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(new TextEncoder().encode(SECRETO));

    expect(await sesionDesdeToken(sinEmail)).toBeNull();
  });
});

describe("opcionesDeCookieDeSesion", () => {
  it("la cookie no se puede leer desde JavaScript y dura lo mismo que el token", () => {
    const opciones = opcionesDeCookieDeSesion("development");

    expect(opciones).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/" });
    expect(opciones.maxAge).toBe(SESSION_MAX_AGE_SECONDS);
  });

  it.each([
    ["production", true],
    ["development", false],
    [undefined, false],
  ])("en el entorno %s, secure es %s (sólo HTTPS en producción)", (entorno, esperado) => {
    expect(opcionesDeCookieDeSesion(entorno).secure).toBe(esperado);
  });
});

describe("setSessionCookie", () => {
  it("guarda la cookie de sesión con un token válido para esa usuaria", async () => {
    // Arrange: el doble en lugar de las cookies de Next
    const { almacen, obtenerCookies } = almacenFalso();

    // Act
    await setSessionCookie({ userId: "u1", email: "ana@curatta.test" }, obtenerCookies);

    // Assert: mira QUÉ se guardó, no un valor devuelto
    expect(almacen.guardar).toHaveBeenCalledTimes(1);
    const [nombre, token, opciones] = almacen.guardar.mock.calls[0];
    expect(nombre).toBe(SESSION_COOKIE);
    expect(opciones.httpOnly).toBe(true);
    expect((await sesionDesdeToken(token))?.user.email).toBe("ana@curatta.test");
  });
});

describe("clearSessionCookie", () => {
  it("borra la cookie de sesión", async () => {
    const { almacen, obtenerCookies } = almacenFalso();

    await clearSessionCookie(obtenerCookies);

    expect(almacen.borrar).toHaveBeenCalledWith(SESSION_COOKIE);
  });
});

describe("auth", () => {
  it("lee la cookie de sesión y devuelve quién está logueado", async () => {
    const token = await createSessionToken({ userId: "u1", email: "ana@curatta.test" });
    const { almacen, obtenerCookies } = almacenFalso(token);

    const sesion = await auth(obtenerCookies);

    expect(almacen.leer).toHaveBeenCalledWith(SESSION_COOKIE);
    expect(sesion?.user.id).toBe("u1");
  });

  it("sin cookie de sesión no hay nadie logueado", async () => {
    const { obtenerCookies } = almacenFalso(undefined);

    expect(await auth(obtenerCookies)).toBeNull();
  });
});
