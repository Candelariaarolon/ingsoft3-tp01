"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NuevaPublicacionForm() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [foto, setFoto] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setFoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const nombreLimpio = nombre.trim();
    const precioNum = Number(precio);

    if (!nombreLimpio) {
      setError("Ingresá un nombre para la prenda");
      return;
    }
    if (!Number.isFinite(precioNum) || precioNum <= 0) {
      setError("El precio debe ser mayor a 0");
      return;
    }
    if (!foto) {
      setError("Subí una foto de la prenda");
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch("/api/publicaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombreLimpio, precio: precioNum, foto }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "No pudimos crear la publicación");
        return;
      }
      router.push("/mis-publicaciones");
      router.refresh();
    } catch {
      setError("Ocurrió un error creando la publicación");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label className="mb-2 block text-[12px] uppercase tracking-[0.2em] text-negro/60">
          Foto
        </label>
        {foto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={foto}
            alt="Vista previa"
            className="mb-3 aspect-[3/4] w-40 rounded object-cover"
          />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={onFotoChange}
          className="block w-full text-sm text-negro/70"
        />
      </div>

      <div>
        <label className="mb-2 block text-[12px] uppercase tracking-[0.2em] text-negro/60">
          Nombre
        </label>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Campera de jean talle M"
          className="w-full rounded-sm border border-negro/20 bg-crema px-4 py-2.5 text-sm"
        />
      </div>

      <div>
        <label className="mb-2 block text-[12px] uppercase tracking-[0.2em] text-negro/60">
          Precio
        </label>
        <input
          type="number"
          min={1}
          step={1}
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          placeholder="0"
          className="w-full rounded-sm border border-negro/20 bg-crema px-4 py-2.5 text-sm"
        />
      </div>

      {error && <p className="text-[13px] text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-sm border border-negro bg-negro px-6 py-3 text-sm text-crema transition-opacity duration-300 ease-in-out disabled:cursor-not-allowed disabled:opacity-50"
      >
        {enviando ? "Publicando…" : "Publicar"}
      </button>
    </form>
  );
}
