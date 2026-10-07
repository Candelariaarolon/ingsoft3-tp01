import { describe, expect, it } from "vitest";
import { normalizarTelefono, telefonoValido } from "./telefono";

describe("telefonoValido", () => {
  it.each([
    ["con 8 dígitos (el mínimo)", "12345678"],
    ["con código de país, área y número", "541122334455"],
    ["con 15 dígitos (el máximo)", "123456789012345"],
  ])("acepta un teléfono %s", (_caso, telefono) => {
    expect(telefonoValido(telefono)).toBe(true);
  });

  it.each([
    ["con 7 dígitos (uno menos que el mínimo)", "1234567"],
    ["con 16 dígitos (uno más que el máximo)", "1234567890123456"],
    ["vacío", ""],
    ["con el + adelante", "+541122334455"],
  ])("rechaza un teléfono %s", (_caso, telefono) => {
    expect(telefonoValido(telefono)).toBe(false);
  });
});

describe("normalizarTelefono", () => {
  it("saca espacios, guiones, paréntesis y el +", () => {
    expect(normalizarTelefono("+54 (11) 2233-4455")).toBe("541122334455");
  });
});
