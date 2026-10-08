import { describe, expect, it, vi } from "vitest";
import { actualizarPublicacion, validarEdicion, type Publicacion } from "./publicaciones";

const jean: Publicacion = {
  id: "pub-1",
  nombre: "Jean recto",
  precio: 1500,
  foto: "data:image/png;base64,",
  estado: "vendida",
  createdAt: "2026-10-01T00:00:00.000Z",
};

describe("validarEdicion", () => {
  it("devuelve el nombre sin espacios alrededor y el precio como número", () => {
    expect(validarEdicion("  Jean recto  ", "1500")).toEqual({
      ok: true,
      valor: { nombre: "Jean recto", precio: 1500 },
    });
  });

  it.each([
    ["cero", "0"],
    ["negativo", "-5"],
    ["vacío", ""],
    ["que no es un número", "mil"],
  ])("rechaza un precio %s", (_caso, precio) => {
    expect(validarEdicion("Jean recto", precio)).toEqual({
      ok: false,
      error: "El precio debe ser mayor a 0",
    });
  });

  it("rechaza un nombre que sólo tiene espacios", () => {
    expect(validarEdicion("   ", "1500")).toEqual({
      ok: false,
      error: "El nombre no puede estar vacío",
    });
  });
});

describe("actualizarPublicacion", () => {
  it("le pide a la API un PATCH sobre la publicación, con sólo los cambios", async () => {
    // Arrange: el doble en lugar del cliente HTTP real
    const enviar = vi.fn().mockResolvedValue({ ok: true, data: { publicacion: jean } });

    // Act
    await actualizarPublicacion("pub-1", { estado: "vendida" }, enviar);

    // Assert: no mira el resultado, mira QUÉ le pidió a la API
    expect(enviar).toHaveBeenCalledTimes(1);
    expect(enviar).toHaveBeenCalledWith("/api/publicaciones/pub-1", {
      method: "PATCH",
      body: { estado: "vendida" },
    });
  });

  it("devuelve la publicación actualizada que contestó la API", async () => {
    const enviar = vi.fn().mockResolvedValue({ ok: true, data: { publicacion: jean } });

    const actualizada = await actualizarPublicacion("pub-1", { estado: "vendida" }, enviar);

    expect(actualizada).toEqual(jean);
  });

  it("si la API rechaza el cambio, muestra el motivo que dio el backend", async () => {
    const enviar = vi.fn().mockResolvedValue({
      ok: false,
      data: { error: "Una publicación vendida no se puede modificar" },
    });

    await expect(actualizarPublicacion("pub-1", { precio: 2000 }, enviar)).rejects.toThrow(
      "Una publicación vendida no se puede modificar"
    );
  });

  it("si la API falla sin explicar por qué, muestra un mensaje genérico", async () => {
    const enviar = vi.fn().mockResolvedValue({ ok: false, data: {} });

    await expect(actualizarPublicacion("pub-1", { precio: 2000 }, enviar)).rejects.toThrow(
      "No pudimos guardar los cambios"
    );
  });
});
