import type { EnviarJson } from "@/lib/publicaciones";

// El cliente HTTP real, en un solo lugar: es lo único que sale a la red. La
// lógica de lib/ lo recibe por parámetro, y en los tests se reemplaza por un
// doble para no depender de la API levantada.
export const enviarJson: EnviarJson = async (url, { method, body }) => {
  const res = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data: unknown = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
};
