import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { analyzeImageModaFromDataUrl } from "@/lib/moda-taxonomia";
import { normalizarNombre, validarFotoPublicacion, validarPrecio } from "@/lib/validaciones";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const publicaciones = await prisma.publicacion.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ publicaciones });
}

type Body = { nombre?: unknown; precio?: unknown; foto?: unknown };

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as Body | null;

  const nombre = normalizarNombre(body?.nombre);
  if (!nombre) {
    return NextResponse.json({ error: "Falta el nombre de la prenda" }, { status: 400 });
  }
  const precioValidado = validarPrecio(body?.precio);
  if (!precioValidado.ok) {
    return NextResponse.json({ error: precioValidado.error }, { status: 400 });
  }
  const fotoValidada = validarFotoPublicacion(body?.foto);
  if (!fotoValidada.ok) {
    return NextResponse.json({ error: fotoValidada.error }, { status: 400 });
  }
  const precio = precioValidado.valor;
  const foto = fotoValidada.valor;

  // Best-effort: si el análisis falla (Azure caído, sin credenciales, etc.)
  // la publicación se crea igual — solo queda afuera del matching por foto
  // hasta que se pueda re-analizar.
  let analisis: Awaited<ReturnType<typeof analyzeImageModaFromDataUrl>> | null = null;
  try {
    analisis = await analyzeImageModaFromDataUrl(foto);
  } catch (err) {
    console.error("[publicaciones] no se pudo analizar la foto:", err);
  }

  const publicacion = await prisma.publicacion.create({
    data: {
      userId: session.user.id,
      nombre,
      precio,
      foto,
      tipoPrenda: analisis?.tipo_prenda,
      siluetaCorte: analisis?.silueta_corte,
      patron: analisis?.patron,
      familiaColor: analisis?.familia_color,
      texturaTela: analisis?.textura_tela,
      formalidadEstilo: analisis?.formalidad_estilo,
    },
  });

  return NextResponse.json({ publicacion });
}
