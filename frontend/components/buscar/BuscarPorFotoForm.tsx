"use client";

import { useState } from "react";
import { formatARS } from "@/lib/format";

type PublicacionMatch = {
  id: string;
  nombre: string;
  precio: number;
  foto: string;
  score: number;
};

type BuscarResponse = {
  matches?: PublicacionMatch[];
  mensaje?: string;
  error?: string;
};

export default function BuscarPorFotoForm() {
  const [foto, setFoto] = useState<string | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [resultados, setResultados] = useState<PublicacionMatch[] | null>(null);

  const onFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setFoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const buscar = async () => {
    if (!foto) {
      setError("Subí una foto para buscar");
      return;
    }
    setError(null);
    setMensaje(null);
    setBuscando(true);
    try {
      const res = await fetch("/api/publicaciones/buscar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foto }),
      });
      const data = (await res.json()) as BuscarResponse;
      if (!res.ok) {
        setError(data.error ?? "No pudimos completar la búsqueda");
        setResultados([]);
        return;
      }
      setResultados(data.matches ?? []);
      if (!data.matches || data.matches.length === 0) {
        setMensaje(data.mensaje ?? "No encontramos prendas parecidas");
      }
    } catch {
      setError("Ocurrió un error buscando prendas parecidas");
      setResultados([]);
    } finally {
      setBuscando(false);
    }
  };

  return (
    <div>
      <div className="mb-10 flex flex-wrap items-center gap-4">
        {foto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={foto} alt="Vista previa" className="h-28 w-24 rounded object-cover" />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={onFotoChange}
          className="block text-sm text-negro/70"
        />
        <button
          type="button"
          onClick={buscar}
          disabled={buscando || !foto}
          className="rounded-sm border border-negro bg-negro px-6 py-2.5 text-[13px] text-crema transition-opacity duration-300 ease-in-out disabled:cursor-not-allowed disabled:opacity-50"
        >
          {buscando ? "Buscando…" : "Buscar"}
        </button>
      </div>

      {error && <p className="mb-6 text-[13px] text-red-700">{error}</p>}
      {mensaje && (
        <p className="py-16 text-center text-[13px] italic text-negro/45">{mensaje}</p>
      )}

      {resultados && resultados.length > 0 && (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
          {resultados.map((p) => (
            <article
              key={p.id}
              className="overflow-hidden rounded bg-crema shadow-[0_10px_24px_rgba(23,19,15,0.08)]"
            >
              <div className="aspect-[3/4] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.foto}
                  alt={p.nombre}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="px-4 pb-[18px] pt-3.5">
                <p className="mb-1 text-[10px] uppercase tracking-[0.6px] text-tierra">
                  {Math.round(p.score)}% de coincidencia
                </p>
                <h4 className="mb-1.5 text-[13.5px] text-negro">{p.nombre}</h4>
                <p className="font-serif text-[15px] font-semibold text-negro">
                  {formatARS(p.precio)}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
