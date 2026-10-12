import { describe, expect, it } from "vitest";
import { destinoEnElBackend, encabezadosDeLaRespuesta, encabezadosDelPedido } from "./proxy";

describe("destinoEnElBackend", () => {
  it("arma la URL del backend con la ruta y la query del pedido", () => {
    expect(destinoEnElBackend("https://curatta-api-qa.onrender.com", "/api/publicaciones", "?estado=vendida")).toBe(
      "https://curatta-api-qa.onrender.com/api/publicaciones?estado=vendida"
    );
  });

  it.each([
    ["con una barra final", "http://backend:4000/"],
    ["con varias barras finales", "http://backend:4000//"],
  ])("no duplica la barra si BACKEND_URL viene %s", (_caso, backendUrl) => {
    expect(destinoEnElBackend(backendUrl, "/api/auth/me", "")).toBe("http://backend:4000/api/auth/me");
  });

  it("falla con un mensaje claro si el entorno no definió BACKEND_URL", () => {
    expect(() => destinoEnElBackend(undefined, "/api/auth/me", "")).toThrow("Falta BACKEND_URL");
  });
});

describe("encabezados", () => {
  it("reenvía la cookie de sesión y saca los de la conexión con el navegador", () => {
    const pedido = new Headers({ cookie: "session=abc", host: "curatta-front-qa.onrender.com", "content-length": "12" });

    const reenviados = encabezadosDelPedido(pedido);

    expect(reenviados.get("cookie")).toBe("session=abc");
    expect(reenviados.has("host")).toBe(false);
    expect(reenviados.has("content-length")).toBe(false);
  });

  it("devuelve la cookie que pone el backend y saca el content-encoding ya resuelto", () => {
    const respuesta = new Headers({ "set-cookie": "session=xyz; HttpOnly", "content-encoding": "gzip" });

    const devueltos = encabezadosDeLaRespuesta(respuesta);

    expect(devueltos.get("set-cookie")).toBe("session=xyz; HttpOnly");
    expect(devueltos.has("content-encoding")).toBe(false);
  });

  it("no modifica los encabezados originales", () => {
    const pedido = new Headers({ host: "front" });

    encabezadosDelPedido(pedido);

    expect(pedido.get("host")).toBe("front");
  });
});
