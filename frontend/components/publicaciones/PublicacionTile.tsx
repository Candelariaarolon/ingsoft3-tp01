"use client";

import { useState } from "react";
import { formatARS } from "@/lib/format";

export type Publicacion = {
  id: string;
  nombre: string;
  precio: number;
  foto: string;
  estado: "disponible" | "vendida";
  createdAt: string;
};

async function patchPublicacion(id: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/publicaciones/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as { publicacion?: Publicacion; error?: string };
  if (!res.ok) throw new Error(data.error ?? "No pudimos guardar los cambios");
  return data.publicacion!;
}

export default function PublicacionTile({
  publicacion,
  onUpdated,
  onDeleted,
}: {
  publicacion: Publicacion;
  onUpdated: (p: Publicacion) => void;
  onDeleted: (id: string) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(publicacion.nombre);
  const [precio, setPrecio] = useState(String(publicacion.precio));
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vendida = publicacion.estado === "vendida";

  const guardar = async () => {
    setError(null);
    const nombreLimpio = nombre.trim();
    const precioNum = Number(precio);
    if (!nombreLimpio) return setError("El nombre no puede estar vacío");
    if (!Number.isFinite(precioNum) || precioNum <= 0) return setError("El precio debe ser mayor a 0");

    setProcesando(true);
    try {
      const actualizada = await patchPublicacion(publicacion.id, {
        nombre: nombreLimpio,
        precio: precioNum,
      });
      onUpdated(actualizada);
      setEditando(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos guardar los cambios");
    } finally {
      setProcesando(false);
    }
  };

  const marcarVendida = async () => {
    setProcesando(true);
    setError(null);
    try {
      const actualizada = await patchPublicacion(publicacion.id, { estado: "vendida" });
      onUpdated(actualizada);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos marcar la publicación como vendida");
    } finally {
      setProcesando(false);
    }
  };

  const eliminar = async () => {
    setProcesando(true);
    setError(null);
    try {
      const res = await fetch(`/api/publicaciones/${publicacion.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "No pudimos eliminar la publicación");
      }
      onDeleted(publicacion.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos eliminar la publicación");
      setProcesando(false);
    }
  };

  return (
    <article className="overflow-hidden rounded bg-crema shadow-[0_10px_24px_rgba(23,19,15,0.08)]">
      <div className="relative aspect-[3/4] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={publicacion.foto}
          alt={publicacion.nombre}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        {vendida && (
          <span className="absolute right-2 top-2 rounded-full bg-negro px-3 py-1 text-[10px] uppercase tracking-[0.15em] text-crema">
            Vendida
          </span>
        )}
      </div>

      <div className="px-4 pb-[18px] pt-3.5">
        {editando ? (
          <div className="space-y-2">
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full rounded-sm border border-negro/20 bg-blanco px-2.5 py-1.5 text-[13px]"
            />
            <input
              type="number"
              min={1}
              step={1}
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              className="w-full rounded-sm border border-negro/20 bg-blanco px-2.5 py-1.5 text-[13px]"
            />
          </div>
        ) : (
          <>
            <h4 className="mb-1.5 text-[13.5px] text-negro">{publicacion.nombre}</h4>
            <p className="mb-2 font-serif text-[15px] font-semibold text-negro">
              {formatARS(publicacion.precio)}
            </p>
          </>
        )}

        {error && <p className="mb-2 text-[11px] text-red-700">{error}</p>}

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.15em]">
          {vendida ? (
            <button
              type="button"
              onClick={eliminar}
              disabled={procesando}
              className="text-negro/45 underline underline-offset-4 hover:text-negro disabled:opacity-50"
            >
              Eliminar
            </button>
          ) : editando ? (
            <>
              <button
                type="button"
                onClick={guardar}
                disabled={procesando}
                className="text-negro underline underline-offset-4 disabled:opacity-50"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditando(false);
                  setNombre(publicacion.nombre);
                  setPrecio(String(publicacion.precio));
                  setError(null);
                }}
                disabled={procesando}
                className="text-negro/45 underline underline-offset-4 hover:text-negro disabled:opacity-50"
              >
                Cancelar
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setEditando(true)}
                disabled={procesando}
                className="text-negro/45 underline underline-offset-4 hover:text-negro disabled:opacity-50"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={marcarVendida}
                disabled={procesando}
                className="text-negro/45 underline underline-offset-4 hover:text-negro disabled:opacity-50"
              >
                Marcar vendida
              </button>
              <button
                type="button"
                onClick={eliminar}
                disabled={procesando}
                className="text-negro/45 underline underline-offset-4 hover:text-negro disabled:opacity-50"
              >
                Eliminar
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
