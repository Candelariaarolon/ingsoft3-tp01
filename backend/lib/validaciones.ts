// Reglas de entrada de la API, sacadas de los route handlers para poder
// testearlas sin levantar Next ni la base. Las rutas solo piden, delegan en
// estas funciones y responden; los mensajes son los mismos que ve el usuario.

export type Validacion<T> = { ok: true; valor: T } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LARGO_MINIMO_PASSWORD = 8;

// Data URL base64 — ~7M caracteres cubre una foto de varios MB sin dejar
// subir blobs arbitrariamente grandes a la base.
export const MAX_FOTO_CHARS = 7 * 1024 * 1024;

export function validarEmail(input: unknown): Validacion<string> {
  const email = typeof input === "string" ? input.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Email inválido" };
  }
  return { ok: true, valor: email };
}

export function validarPassword(input: unknown): Validacion<string> {
  const password = typeof input === "string" ? input : "";
  if (password.length < LARGO_MINIMO_PASSWORD) {
    return {
      ok: false,
      error: `La contraseña debe tener al menos ${LARGO_MINIMO_PASSWORD} caracteres`,
    };
  }
  return { ok: true, valor: password };
}

// Devuelve el nombre sin espacios alrededor, o null si no queda nada. Cada
// ruta decide qué mensaje mostrar (crear y editar usan textos distintos).
export function normalizarNombre(input: unknown): string | null {
  const nombre = typeof input === "string" ? input.trim() : "";
  return nombre || null;
}

export function validarPrecio(input: unknown): Validacion<number> {
  const precio = typeof input === "number" ? input : NaN;
  if (!Number.isFinite(precio) || precio <= 0) {
    return { ok: false, error: "El precio debe ser mayor a 0" };
  }
  return { ok: true, valor: precio };
}

export function esFotoDataUrl(input: unknown): input is string {
  return typeof input === "string" && input.startsWith("data:image/");
}

export function validarFotoPublicacion(input: unknown): Validacion<string> {
  if (!esFotoDataUrl(input)) {
    return { ok: false, error: "Falta la foto de la prenda" };
  }
  if (input.length > MAX_FOTO_CHARS) {
    return { ok: false, error: "La foto es demasiado pesada" };
  }
  return { ok: true, valor: input };
}

export type EstadoPublicacion = "disponible" | "vendida";

export function esEstadoValido(input: unknown): input is EstadoPublicacion {
  return input === "disponible" || input === "vendida";
}

// Una publicación vendida es definitiva: ni sus datos ni su estado se pueden
// volver a tocar (esto también bloquea el único camino por el que podría
// volver a "disponible").
export function puedeModificarse(estado: EstadoPublicacion): boolean {
  return estado !== "vendida";
}
