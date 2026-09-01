// Crea (o resetea la contraseña de) un par de cuentas fijas, útiles para
// probar rápido sin pasar por el formulario de registro dos veces.
// Uso: npx tsx scripts/seed-demo-user.ts
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/password";

const CUENTAS = [
  { email: "demo@curatta.test", password: "curatta123", telefono: "541122334455" },
  { email: "demo2@curatta.test", password: "curatta123", telefono: "541122334456" },
];

async function main() {
  for (const { email, password, telefono } of CUENTAS) {
    const passwordHash = await hashPassword(password);
    await prisma.user.upsert({
      where: { email },
      update: { passwordHash, telefono },
      create: { email, passwordHash, telefono },
    });
    console.log(`Usuario listo -> email: ${email}  password: ${password}`);
  }
}

main().finally(() => prisma.$disconnect());
