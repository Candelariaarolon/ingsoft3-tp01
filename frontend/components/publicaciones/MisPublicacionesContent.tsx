"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PublicacionTile, { type Publicacion } from "./PublicacionTile";

export default function MisPublicacionesContent() {
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch("/api/publicaciones")
      .then((res) => res.json())
      .then((data: { publicaciones?: Publicacion[] }) => {
        setPublicaciones(data.publicaciones ?? []);
      })
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-11 md:px-12">
      <div className="mb-10 flex items-center justify-between">
        <h1 className="font-serif text-2xl text-negro">Mis publicaciones</h1>
        <Link
          href="/publicaciones/nueva"
          className="rounded-sm border border-negro bg-negro px-6 py-2.5 text-[13px] text-crema transition-opacity duration-300 ease-in-out hover:opacity-80"
        >
          + Nueva publicación
        </Link>
      </div>

      {publicaciones.length === 0 ? (
        <p className="py-16 text-center text-[13px] italic text-negro/45">
          Todavía no publicaste ninguna prenda.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
          {publicaciones.map((p) => (
            <PublicacionTile
              key={p.id}
              publicacion={p}
              onUpdated={(actualizada) =>
                setPublicaciones((prev) =>
                  prev.map((item) => (item.id === actualizada.id ? actualizada : item))
                )
              }
              onDeleted={(id) =>
                setPublicaciones((prev) => prev.filter((item) => item.id !== id))
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}
