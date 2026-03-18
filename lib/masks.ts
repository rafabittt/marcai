/** Remove tudo que não for dígito */
const digits = (v: string) => v.replace(/\D/g, '')

/**
 * (11) 99999-9999  ou  (11) 9999-9999
 * Detecta celular (9 dígitos) vs fixo (8 dígitos) automaticamente.
 */
export function maskPhone(value: string): string {
  const d = digits(value).slice(0, 11)
  if (d.length <= 2)  return d.length ? `(${d}` : ''
  if (d.length <= 6)  return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

/** 000.000.000-00 */
export function maskCPF(value: string): string {
  const d = digits(value).slice(0, 11)
  if (d.length <= 3)  return d
  if (d.length <= 6)  return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9)  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

/** 00000-000 */
export function maskCEP(value: string): string {
  const d = digits(value).slice(0, 8)
  if (d.length <= 5) return d
  return `${d.slice(0, 5)}-${d.slice(5)}`
}

/** Apenas letras (incluindo acentuadas), hífens e espaços */
export function maskName(value: string): string {
  return value.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, '')
}

/** Apenas dígitos — para campos numéricos como "Número do endereço" */
export function maskNumber(value: string): string {
  return digits(value)
}
