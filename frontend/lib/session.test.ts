import { SignJWT } from "jose";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { auth, sesionDesdeToken } from "./session";

const SECRETO = "secreto-de-prueba-que-solo-existe-en-los-tests";

// Firma un token igual que lo hace el backend al iniciar sesión.
function tokenFirmado(
  payload: Record<string, unknown>,
  { secreto = SECRETO, vence = "7d" }: { secreto?: string; vence?: string | number } = {}
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(vence)
    .sign(new TextEncoder().encode(secreto));
}

beforeEach(() => {
  vi.stubEnv("JWT_SECRET", SECRETO);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("sesionDesdeToken", () => {
  it("con un token válido devuelve quién está logueado", async () => {
    const token = await tokenFirmado({ userId: "u1", email: "ana@curatta.test" });

    expect(await sesionDesdeToken(token)).toEqual({
      user: { id: "u1", userId: "u1", email: "ana@curatta.test" },
    });
  });

  it.each([
    ["no hay token", undefined],
    ["el token está vacío", ""],
    ["el token no es un JWT", "esto-no-es-un-jwt"],
  ])("no hay sesión si %s", async (_caso, token) => {
    expect(await sesionDesdeToken(token)).toBeNull();
  });

  it("rechaza un token firmado con otro secreto (alguien lo falsificó)", async () => {
    const token = await tokenFirmado(
      { userId: "u1", email: "ana@curatta.test" },
      { secreto: "otro-secreto-que-no-es-el-nuestro" }
    );

    expect(await sesionDesdeToken(token)).toBeNull();
  });

  it("rechaza un token vencido", async () => {
    const haceUnaHora = Math.floor(Date.now() / 1000) - 3600;
    const token = await tokenFirmado(
      { userId: "u1", email: "ana@curatta.test" },
      { vence: haceUnaHora }
    );

    expect(await sesionDesdeToken(token)).toBeNull();
  });

  it("rechaza un token bien firmado al que le falta el email", async () => {
    const token = await tokenFirmado({ userId: "u1" });

    expect(await sesionDesdeToken(token)).toBeNull();
  });

  it("si falta JWT_SECRET trata a todos como no logueados en vez de romper", async () => {
    const token = await tokenFirmado({ userId: "u1", email: "ana@curatta.test" });
    vi.stubEnv("JWT_SECRET", "");

    expect(await sesionDesdeToken(token)).toBeNull();
  });
});

describe("auth", () => {
  it("lee el token con el lector que recibe y devuelve la sesión", async () => {
    // Arrange: el doble en lugar de la cookie real de Next
    const token = await tokenFirmado({ userId: "u1", email: "ana@curatta.test" });
    const leerToken = vi.fn().mockResolvedValue(token);

    // Act
    const sesion = await auth(leerToken);

    // Assert
    expect(leerToken).toHaveBeenCalledTimes(1);
    expect(sesion?.user.email).toBe("ana@curatta.test");
  });

  it("sin cookie de sesión no hay nadie logueado", async () => {
    const leerToken = vi.fn().mockResolvedValue(undefined);

    expect(await auth(leerToken)).toBeNull();
  });
});
