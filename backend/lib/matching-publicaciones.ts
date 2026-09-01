import type { Publicacion } from "@prisma/client";
import { prisma } from "./prisma";
import { analyzeImageModaFromDataUrl, type AnalisisModa } from "./moda-taxonomia";

// textura_tela y formalidad_estilo pesan más que corte/patrón/color: son los
// atributos que más definen si dos prendas realmente "son lo mismo" en la
// práctica (ej. una musculosa deportiva de jersey vs. un top de fiesta con
// lentejuelas pueden compartir corte/patrón/color y aun así no parecerse en
// nada).
const PESOS = {
  silueta_corte: 2,
  patron: 2,
  familia_color: 2,
  textura_tela: 3,
  formalidad_estilo: 3,
} as const;

const PESO_TOTAL = Object.values(PESOS).reduce((a, b) => a + b, 0); // 12

// tipo_prenda es el filtro duro, pero el vocabulario cerrado tiene categorías
// solapadas que el modelo etiqueta de forma inconsistente para la misma
// prenda real (ej. un jean de tela denim clasificado como "pantalon" en vez
// de "jean").
const GRUPOS_COMPATIBLES: string[][] = [
  ["jean", "pantalon", "pantalon cargo", "pantalon palazzo"],
  ["top", "camisa"],
  ["vestido", "vestido camisero", "vestido cruzado"],
];

const GRUPO_POR_TIPO = new Map<string, string[]>();
for (const grupo of GRUPOS_COMPATIBLES) {
  for (const tipo of grupo) {
    GRUPO_POR_TIPO.set(tipo, grupo);
  }
}

function tiposCompatibles(tipoPrenda: string): string[] {
  return GRUPO_POR_TIPO.get(tipoPrenda) ?? [tipoPrenda];
}

// Regla de negocio: un score no alcanza para ser "match" salvo que supere
// este umbral. A diferencia del recomendador anterior (que relajaba el
// umbral en escalones para no dejar una página vacía), acá es una regla
// fija y determinística: se puede testear con un score justo debajo/encima.
export const UMBRAL_MATCH = 60;

export function esMatch(score: number): boolean {
  return score >= UMBRAL_MATCH;
}

type PublicacionAnalizada = Publicacion & {
  tipoPrenda: string;
  siluetaCorte: string;
  patron: string;
  familiaColor: string;
  texturaTela: string;
  formalidadEstilo: string;
  user: { telefono: string };
};

function tieneAnalisis(p: Publicacion & { user: { telefono: string } }): p is PublicacionAnalizada {
  return (
    !!p.tipoPrenda &&
    !!p.siluetaCorte &&
    !!p.patron &&
    !!p.familiaColor &&
    !!p.texturaTela &&
    !!p.formalidadEstilo
  );
}

// "deportivo" es una categoría de uso, no un grado más de formalidad: una
// prenda deportiva nunca debería competir con prendas de calle ni viceversa,
// aunque compartan corte/patrón/color (confirmado con el catálogo anterior:
// un top deportivo colándose en resultados de tops de calle).
function compatiblesPorFormalidad(a: string, b: string): boolean {
  return (a === "deportivo") === (b === "deportivo");
}

function scoreContra(publicacion: PublicacionAnalizada, referencia: AnalisisModa): number {
  if (!compatiblesPorFormalidad(publicacion.formalidadEstilo, referencia.formalidad_estilo)) {
    return 0;
  }
  let acumulado = 0;
  if (publicacion.siluetaCorte === referencia.silueta_corte) acumulado += PESOS.silueta_corte;
  if (publicacion.patron === referencia.patron) acumulado += PESOS.patron;
  if (publicacion.familiaColor === referencia.familia_color) acumulado += PESOS.familia_color;
  if (publicacion.texturaTela === referencia.textura_tela) acumulado += PESOS.textura_tela;
  if (publicacion.formalidadEstilo === referencia.formalidad_estilo) acumulado += PESOS.formalidad_estilo;
  return (acumulado / PESO_TOTAL) * 100;
}

export type PublicacionConScore = Publicacion & {
  score: number;
  user: { telefono: string };
};

export type MatchResult = {
  analisis: AnalisisModa;
  matches: PublicacionConScore[];
  mensaje?: string;
};

// Separado de matchContraPublicaciones para poder testear el scoring con un
// AnalisisModa fijo, sin depender de una llamada real a Azure OpenAI.
export async function matchContraAnalisis(
  analisis: AnalisisModa,
  opts: { excludeUserId?: string } = {}
): Promise<MatchResult> {
  const candidatos = await prisma.publicacion.findMany({
    where: {
      estado: "disponible",
      tipoPrenda: { in: tiposCompatibles(analisis.tipo_prenda) },
      ...(opts.excludeUserId ? { userId: { not: opts.excludeUserId } } : {}),
    },
    include: { user: { select: { telefono: true } } },
  });

  const scored = candidatos
    .filter(tieneAnalisis)
    .map((p) => ({ ...p, score: scoreContra(p, analisis) }));

  const matches = scored.filter((p) => esMatch(p.score)).sort((a, b) => b.score - a.score);

  if (matches.length === 0) {
    return {
      analisis,
      matches: [],
      mensaje: "No encontramos prendas parecidas entre las publicaciones disponibles",
    };
  }

  return { analisis, matches };
}

// Compara una foto subida por un usuario contra las publicaciones
// disponibles de otros usuarios. `excludeUserId` saca las publicaciones del
// propio usuario que busca (no tiene sentido matchear contra tu propia
// ropa en venta).
export async function matchContraPublicaciones(
  fotoDataUrl: string,
  opts: { excludeUserId?: string } = {}
): Promise<MatchResult> {
  const analisis = await analyzeImageModaFromDataUrl(fotoDataUrl);
  return matchContraAnalisis(analisis, opts);
}
