import { describe, expect, it, vi } from "vitest";
import { analyzeImageModaFromDataUrl, interpretarRespuestaModa } from "./moda-taxonomia";

const JSON_VALIDO =
  '{ "tipo_prenda": "jean", "silueta_corte": "recto", "patron": "liso", ' +
  '"familia_color": "azul", "textura_tela": "denim", "formalidad_estilo": "casual" }';

const ANALISIS_ESPERADO = {
  tipo_prenda: "jean",
  silueta_corte: "recto",
  patron: "liso",
  familia_color: "azul",
  textura_tela: "denim",
  formalidad_estilo: "casual",
};

describe("interpretarRespuestaModa", () => {
  it("saca el JSON aunque el modelo escriba su razonamiento antes", () => {
    const respuesta = `Prenda: jean recto que lleva puesto. Ignorar: piel, fondo.\n${JSON_VALIDO}`;

    expect(interpretarRespuestaModa(respuesta)).toEqual(ANALISIS_ESPERADO);
  });

  it("normaliza mayúsculas y espacios, porque el matching compara por igualdad exacta", () => {
    const respuesta = JSON_VALIDO.replace('"jean"', '"  JEAN "').replace('"azul"', '"Azul"');

    const analisis = interpretarRespuestaModa(respuesta);

    expect(analisis.tipo_prenda).toBe("jean");
    expect(analisis.familia_color).toBe("azul");
  });

  it.each([
    "tipo_prenda",
    "silueta_corte",
    "patron",
    "familia_color",
    "textura_tela",
    "formalidad_estilo",
  ])("rechaza una respuesta a la que le falta %s", (campo) => {
    const incompleto = JSON.stringify({ ...ANALISIS_ESPERADO, [campo]: "" });

    expect(() => interpretarRespuestaModa(incompleto)).toThrow("Respuesta inválida del modelo");
  });

  it.each([
    ["vacía", ""],
    ["sin ningún JSON", "No puedo analizar esta imagen."],
    ["con un JSON cortado a la mitad", '{ "tipo_prenda": "jean", '],
    ["con llaves pero sin un JSON válido adentro", "{ esto no es json }"],
  ])("rechaza una respuesta %s", (_caso, respuesta) => {
    expect(() => interpretarRespuestaModa(respuesta)).toThrow("Respuesta inválida del modelo");
  });
});

describe("analyzeImageModaFromDataUrl", () => {
  it("le manda la foto al modelo e interpreta lo que contesta", async () => {
    // Arrange: el doble en lugar de Azure OpenAI
    const pedirAlModelo = vi.fn().mockResolvedValue(JSON_VALIDO);

    // Act
    const analisis = await analyzeImageModaFromDataUrl("data:image/png;base64,AAA", pedirAlModelo);

    // Assert
    expect(pedirAlModelo).toHaveBeenCalledWith("data:image/png;base64,AAA");
    expect(analisis).toEqual(ANALISIS_ESPERADO);
  });
});
