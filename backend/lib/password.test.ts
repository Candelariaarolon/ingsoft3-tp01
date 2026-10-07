import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("hashPassword", () => {
  it("no guarda la contraseña en texto plano", async () => {
    const hash = await hashPassword("curatta123");

    expect(hash).not.toContain("curatta123");
  });
});

describe("verifyPassword", () => {
  it("acepta la misma contraseña con la que se creó el hash", async () => {
    const hash = await hashPassword("curatta123");

    expect(await verifyPassword("curatta123", hash)).toBe(true);
  });

  it("rechaza una contraseña distinta", async () => {
    const hash = await hashPassword("curatta123");

    expect(await verifyPassword("curatta124", hash)).toBe(false);
  });
});
