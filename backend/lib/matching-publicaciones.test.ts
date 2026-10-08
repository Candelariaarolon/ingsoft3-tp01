import { describe, expect, it, vi } from "vitest";
import type { AnalisisModa } from "./moda-taxonomia";
import {
  esMatch,
  matchContraAnalisis,
  UMBRAL_MATCH,
  type Candidato,
} from "./matching-publicaciones";

// La foto que sube quien busca, ya analizada: un jean recto, liso, azul.
const jeanBuscado: AnalisisModa = {
  tipo_prenda: "jean",
  silueta_corte: "recto",
  patron: "liso",
  familia_color: "azul",
  textura_tela: "denim",
  formalidad_estilo: "casual",
};

// Una publicación de otra usuaria, idéntica al jean buscado salvo lo que se
// cambie en `cambios`.
function candidato(id: string, cambios: Partial<Candidato> = {}): Candidato {
  return {
    id,
    userId: "otra-usuaria",
    nombre: `prenda ${id}`,
    precio: 1000,
    foto: "data:image/png;base64,",
    estado: "disponible",
    createdAt: new Date(0),
    updatedAt: new Date(0),
    tipoPrenda: "jean",
    siluetaCorte: "recto",
    patron: "liso",
    familiaColor: "azul",
    texturaTela: "denim",
    formalidadEstilo: "casual",
    user: { telefono: "541122334455" },
    ...cambios,
  };
}

describe("esMatch", () => {
  it.each([
    [UMBRAL_MATCH - 0.01, false],
    [UMBRAL_MATCH, true],
    [100, true],
  ])("con un puntaje de %s devuelve %s", (puntaje, esperado) => {
    expect(esMatch(puntaje)).toBe(esperado);
  });
});

describe("matchContraAnalisis", () => {
  it("le pide a la base solo prendas disponibles, de tipos compatibles y que no sean de quien busca", async () => {
    // Arrange: el doble en lugar de la base real
    const buscarCandidatos = vi.fn().mockResolvedValue([]);

    // Act
    await matchContraAnalisis(jeanBuscado, { excludeUserId: "ana" }, buscarCandidatos);

    // Assert: no mira el resultado, mira QUÉ le pidió a la base
    expect(buscarCandidatos).toHaveBeenCalledTimes(1);
    expect(buscarCandidatos).toHaveBeenCalledWith({
      estado: "disponible",
      tiposPrenda: ["jean", "pantalon", "pantalon cargo", "pantalon palazzo"],
      excludeUserId: "ana",
    });
  });

  it("si el tipo de prenda no tiene compatibles, le pide a la base solo ese tipo", async () => {
    // Arrange: "blazer" no está en ningún grupo de GRUPOS_COMPATIBLES
    const buscarCandidatos = vi.fn().mockResolvedValue([]);
    const blazerBuscado: AnalisisModa = { ...jeanBuscado, tipo_prenda: "blazer" };

    // Act
    await matchContraAnalisis(blazerBuscado, {}, buscarCandidatos);

    // Assert
    expect(buscarCandidatos).toHaveBeenCalledWith(
      expect.objectContaining({ tiposPrenda: ["blazer"] })
    );
  });

  it("devuelve solo las prendas que llegan al umbral, de la más parecida a la menos", async () => {
    const buscarCandidatos = vi.fn().mockResolvedValue([
      candidato("distinta", { siluetaCorte: "oversize", patron: "rayas", familiaColor: "negro", texturaTela: "lino" }),
      candidato("parecida", { siluetaCorte: "oversize" }),
      candidato("igual"),
    ]);

    const resultado = await matchContraAnalisis(jeanBuscado, {}, buscarCandidatos);

    expect(resultado.matches.map((p) => p.id)).toEqual(["igual", "parecida"]);
  });

  it("nunca muestra una prenda deportiva a quien busca una de calle, aunque coincida en todo lo demás", async () => {
    const buscarCandidatos = vi.fn().mockResolvedValue([
      candidato("jean-deportivo", { formalidadEstilo: "deportivo" }),
    ]);

    const resultado = await matchContraAnalisis(jeanBuscado, {}, buscarCandidatos);

    expect(resultado.matches).toEqual([]);
  });

  it("si ninguna prenda llega al umbral, avisa con un mensaje en vez de devolver una lista vacía muda", async () => {
    const buscarCandidatos = vi.fn().mockResolvedValue([
      candidato("distinta", { siluetaCorte: "oversize", patron: "rayas", familiaColor: "negro", texturaTela: "lino" }),
    ]);

    const resultado = await matchContraAnalisis(jeanBuscado, {}, buscarCandidatos);

    expect(resultado.matches).toEqual([]);
    expect(resultado.mensaje).toBe("No encontramos prendas parecidas entre las publicaciones disponibles");
  });
});
