export type Publicacion = {
  id: string;
  nombre: string;
  precio: number;
  foto: string;
  estado: "disponible" | "vendida";
  createdAt: string;
};

export type Validacion<T> = { ok: true; valor: T } | { ok: false; error: string };

// Lo que el front le pide a la API, dicho con nuestras palabras y no con las
// de fetch. Es la frontera que los tests reemplazan por un doble; el cliente
// real vive en api/cliente.ts.
export type RespuestaApi = { ok: boolean; data: unknown };
export type EnviarJson = (
  url: string,
  init: { method: string; body?: unknown }
) => Promise<RespuestaApi>;

// Misma regla que valida el backend, chequeada antes de mandar el pedido para
// avisar sin esperar la vuelta de la API. El precio llega como texto porque
// sale de un <input>.
export function validarEdicion(
  nombre: string,
  precioTexto: string
): Validacion<{ nombre: string; precio: number }> {
  const nombreLimpio = nombre.trim();
  if (!nombreLimpio) {
    return { ok: false, error: "El nombre no puede estar vacío" };
  }
  const precio = Number(precioTexto);
  if (!Number.isFinite(precio) || precio <= 0) {
    return { ok: false, error: "El precio debe ser mayor a 0" };
  }
  return { ok: true, valor: { nombre: nombreLimpio, precio } };
}

export async function actualizarPublicacion(
  id: string,
  cambios: { nombre?: string; precio?: number; estado?: "vendida" },
  enviar: EnviarJson
): Promise<Publicacion> {
  const { ok, data } = await enviar(`/api/publicaciones/${id}`, {
    method: "PATCH",
    body: cambios,
  });
  const respuesta = data as { publicacion?: Publicacion; error?: string };
  if (!ok) {
    throw new Error(respuesta.error ?? "No pudimos guardar los cambios");
  }
  return respuesta.publicacion!;
}
