import { describe, expect, it } from "vitest";
import { linkWhatsapp } from "./whatsapp";

describe("linkWhatsapp", () => {
  it("arma el link de wa.me al teléfono de la vendedora", () => {
    const link = linkWhatsapp("541122334455", "Jean recto");

    expect(link.startsWith("https://wa.me/541122334455?text=")).toBe(true);
  });

  it("el mensaje nombra la prenda, para que la vendedora sepa cuál le interesa", () => {
    const link = linkWhatsapp("541122334455", "Jean recto");

    const mensaje = new URL(link).searchParams.get("text");
    expect(mensaje).toBe('Hola! Me interesa la prenda "Jean recto" que vi en Curatta.');
  });

  it("codifica los caracteres especiales del nombre para no romper el link", () => {
    const link = linkWhatsapp("541122334455", "Top & falda #2");

    expect(link).not.toContain(" ");
    expect(link).not.toContain("&falda");
    expect(new URL(link).searchParams.get("text")).toContain('"Top & falda #2"');
  });
});
