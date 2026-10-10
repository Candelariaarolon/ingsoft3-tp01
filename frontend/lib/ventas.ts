import { formatARS } from "./format";
import type { Publicacion } from "./publicaciones";

export type ResumenDeVentas = {
  disponibles: number;
  vendidas: number;
  totalVendido: number;
};

// Resumen para la vendedora, arriba de "Mis publicaciones": cuántas prendas
// tiene a la venta, cuántas vendió y cuánto juntó con las vendidas.
export function resumenDeVentas(publicaciones: Publicacion[]): ResumenDeVentas {
  let disponibles = 0;
  let vendidas = 0;
  let totalVendido = 0;
  for (const publicacion of publicaciones) {
    if (publicacion.estado === "vendida") {
      vendidas += 1;
      totalVendido += publicacion.precio;
    } else {
      disponibles += 1;
    }
  }
  return { disponibles, vendidas, totalVendido };
}

export function textoResumen({ disponibles, vendidas, totalVendido }: ResumenDeVentas): string {
  const partes = [
    `${disponibles} ${disponibles === 1 ? "disponible" : "disponibles"}`,
    `${vendidas} ${vendidas === 1 ? "vendida" : "vendidas"}`,
  ];
  if (totalVendido > 0) {
    partes.push(`${formatARS(totalVendido)} vendidos`);
  }
  return partes.join(" · ");
}
