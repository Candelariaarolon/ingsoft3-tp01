import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  esEstadoValido,
  normalizarNombre,
  puedeModificarse,
  validarPrecio,
  type EstadoPublicacion,
} from "@/lib/validaciones";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const publicacion = await prisma.publicacion.findUnique({ where: { id: params.id } });
  if (!publicacion) {
    return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 });
  }

  return NextResponse.json({ publicacion });
}

type Body = { nombre?: unknown; precio?: unknown; estado?: unknown };

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const publicacion = await prisma.publicacion.findUnique({ where: { id: params.id } });
  if (!publicacion || publicacion.userId !== session.user.id) {
    return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 });
  }

  if (!puedeModificarse(publicacion.estado)) {
    return NextResponse.json(
      { error: "Una publicación vendida no se puede modificar" },
      { status: 409 }
    );
  }

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const data: { nombre?: string; precio?: number; estado?: EstadoPublicacion } = {};

  if (body.nombre !== undefined) {
    const nombre = normalizarNombre(body.nombre);
    if (!nombre) {
      return NextResponse.json({ error: "El nombre no puede estar vacío" }, { status: 400 });
    }
    data.nombre = nombre;
  }

  if (body.precio !== undefined) {
    const precio = validarPrecio(body.precio);
    if (!precio.ok) {
      return NextResponse.json({ error: precio.error }, { status: 400 });
    }
    data.precio = precio.valor;
  }

  if (body.estado !== undefined) {
    if (!esEstadoValido(body.estado)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }
    data.estado = body.estado;
  }

  const actualizada = await prisma.publicacion.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json({ publicacion: actualizada });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const publicacion = await prisma.publicacion.findUnique({ where: { id: params.id } });
  if (!publicacion || publicacion.userId !== session.user.id) {
    return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 });
  }

  await prisma.publicacion.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}
