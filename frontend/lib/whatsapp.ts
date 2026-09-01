// Link "click to chat" de WhatsApp: no requiere API ni cuenta Business, es
// solo una URL. El teléfono ya se guarda normalizado (solo dígitos, código
// de país incluido, sin "+") desde el registro — ver backend/lib/telefono.ts.
export function linkWhatsapp(telefono: string, nombrePrenda: string): string {
  const mensaje = `Hola! Me interesa la prenda "${nombrePrenda}" que vi en Curatta.`;
  return `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
}
