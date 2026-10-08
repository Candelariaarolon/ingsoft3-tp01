import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { setSessionCookie } from "@/lib/session";
import { normalizarTelefono, telefonoValido } from "@/lib/telefono";
import { validarEmail, validarPassword } from "@/lib/validaciones";

export const runtime = "nodejs";

type Body = { email?: unknown; password?: unknown; telefono?: unknown };

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Body | null;
  const telefono = normalizarTelefono(typeof body?.telefono === "string" ? body.telefono : "");

  const email = validarEmail(body?.email);
  if (!email.ok) {
    return NextResponse.json({ error: email.error }, { status: 400 });
  }
  const password = validarPassword(body?.password);
  if (!password.ok) {
    return NextResponse.json({ error: password.error }, { status: 400 });
  }
  if (!telefonoValido(telefono)) {
    return NextResponse.json(
      { error: "Teléfono inválido: código de país + código de área + número, sin 0 ni 15" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email: email.valor } });
  if (existing) {
    return NextResponse.json({ error: "Ya existe una cuenta con ese email" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password.valor);
  const user = await prisma.user.create({
    data: { email: email.valor, passwordHash, telefono },
  });

  await setSessionCookie({ userId: user.id, email: user.email });

  return NextResponse.json({ ok: true, user: { id: user.id, email: user.email } }, { status: 201 });
}
