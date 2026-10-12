// El navegador sólo le habla al front (/api/...) y el front reenvía al backend
// de SU entorno. La dirección del backend se lee de BACKEND_URL en cada pedido,
// no en el build: así la misma imagen sirve en QA y en PROD, cada una con su
// api (el equivalente Next de la plantilla de nginx del TP6).

export function destinoEnElBackend(
  backendUrl: string | undefined,
  pathname: string,
  search: string
): string {
  if (!backendUrl) {
    throw new Error("Falta BACKEND_URL: el front no sabe a qué backend reenviar");
  }
  // Sin barra final: con "https://api/" + "/api/..." quedaría "//api/..." y el
  // backend contestaría 404.
  return `${backendUrl.replace(/\/+$/, "")}${pathname}${search}`;
}

// Encabezados que no se reenvían tal cual: los de la conexión entre el
// navegador y el front no valen para la conexión entre el front y el backend.
const DE_LA_CONEXION = ["host", "connection", "keep-alive", "transfer-encoding", "upgrade", "expect", "content-length"];

// De la respuesta, además, el content-encoding: fetch ya descomprimió el
// cuerpo, y si se reenvía el navegador intentaría descomprimirlo otra vez.
const DE_LA_RESPUESTA = ["content-encoding", ...DE_LA_CONEXION];

function sin(headers: Headers, nombres: string[]): Headers {
  const copia = new Headers(headers);
  for (const nombre of nombres) copia.delete(nombre);
  return copia;
}

export const encabezadosDelPedido = (headers: Headers) => sin(headers, DE_LA_CONEXION);
export const encabezadosDeLaRespuesta = (headers: Headers) => sin(headers, DE_LA_RESPUESTA);
