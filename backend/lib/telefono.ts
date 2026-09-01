// Formato esperado: código de país + código de área + número, solo dígitos
// (ej. 541122334455 para un celular de CABA/GBA). Sin "+", sin espacios,
// sin guiones. Para Argentina puntualmente: sin el "9" que se usa para
// discado local de celulares y sin el "15" — ninguno de los dos va en el
// link de WhatsApp (wa.me), aunque sí se usen para llamar desde el celular.
const TELEFONO_RE = /^\d{8,15}$/;

export function normalizarTelefono(input: string): string {
  return input.replace(/\D/g, "");
}

export function telefonoValido(telefono: string): boolean {
  return TELEFONO_RE.test(telefono);
}
