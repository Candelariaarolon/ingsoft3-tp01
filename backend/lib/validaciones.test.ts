import { describe, expect, it } from "vitest";
import {
  esEstadoValido,
  LARGO_MINIMO_PASSWORD,
  MAX_FOTO_CHARS,
  normalizarNombre,
  puedeModificarse,
  validarEmail,
  validarFotoPublicacion,
  validarPassword,
  validarPrecio,
} from "./validaciones";

describe("validarEmail", () => {
  it("guarda el email sin espacios y en minúsculas, para que no se dupliquen cuentas", () => {
    expect(validarEmail("  Ana@Curatta.Test ")).toEqual({ ok: true, valor: "ana@curatta.test" });
  });

  it.each([
    ["sin arroba", "ana.curatta.test"],
    ["sin dominio", "ana@curatta"],
    ["vacío", ""],
    ["que no es texto", 123],
  ])("rechaza un email %s", (_caso, email) => {
    expect(validarEmail(email)).toEqual({ ok: false, error: "Email inválido" });
  });
});

describe("validarPassword", () => {
  it.each([
    ["rechaza una contraseña con un caracter menos que el mínimo", "a".repeat(LARGO_MINIMO_PASSWORD - 1), false],
    ["acepta una contraseña con justo el mínimo de caracteres", "a".repeat(LARGO_MINIMO_PASSWORD), true],
  ])("%s", (_caso, password, esperado) => {
    expect(validarPassword(password).ok).toBe(esperado);
  });

  it("si es corta, el mensaje dice cuántos caracteres hacen falta", () => {
    const resultado = validarPassword("corta");

    expect(resultado).toEqual({
      ok: false,
      error: `La contraseña debe tener al menos ${LARGO_MINIMO_PASSWORD} caracteres`,
    });
  });
});

describe("normalizarNombre", () => {
  it("saca los espacios de alrededor del nombre de la prenda", () => {
    expect(normalizarNombre("  Jean recto azul  ")).toBe("Jean recto azul");
  });

  it.each([
    ["vacío", ""],
    ["con sólo espacios", "   "],
    ["sin ningún valor", undefined],
  ])("considera que no hay nombre si viene %s", (_caso, nombre) => {
    expect(normalizarNombre(nombre)).toBeNull();
  });
});

describe("validarPrecio", () => {
  it.each([
    ["cero", 0],
    ["negativo", -100],
    ["escrito como texto", "1500"],
    ["infinito", Infinity],
    ["que no es un número", NaN],
  ])("rechaza un precio %s", (_caso, precio) => {
    expect(validarPrecio(precio)).toEqual({ ok: false, error: "El precio debe ser mayor a 0" });
  });

  it("acepta el precio más chico posible por encima de cero", () => {
    expect(validarPrecio(1)).toEqual({ ok: true, valor: 1 });
  });
});

describe("validarFotoPublicacion", () => {
  it("rechaza algo que no es una imagen en data URL", () => {
    expect(validarFotoPublicacion("https://ejemplo.com/foto.jpg")).toEqual({
      ok: false,
      error: "Falta la foto de la prenda",
    });
  });

  it.each([
    ["acepta una foto con justo el tamaño máximo", MAX_FOTO_CHARS, true],
    ["rechaza una foto con un caracter más que el máximo", MAX_FOTO_CHARS + 1, false],
  ])("%s", (_caso, largo, esperado) => {
    const prefijo = "data:image/png;base64,";
    const foto = prefijo + "a".repeat(largo - prefijo.length);

    expect(validarFotoPublicacion(foto).ok).toBe(esperado);
  });
});

describe("esEstadoValido", () => {
  it.each([
    ["disponible", true],
    ["vendida", true],
    ["reservada", false],
    ["Vendida", false],
    [undefined, false],
  ])("con el estado %s devuelve %s", (estado, esperado) => {
    expect(esEstadoValido(estado)).toBe(esperado);
  });
});

describe("puedeModificarse", () => {
  it("una publicación vendida ya no se puede tocar", () => {
    expect(puedeModificarse("vendida")).toBe(false);
  });

  it("una publicación disponible se puede editar", () => {
    expect(puedeModificarse("disponible")).toBe(true);
  });
});
