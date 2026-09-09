// Endereço do negócio em uma linha. Vivia só dentro de app/agendar/[slug];
// foi extraído porque a mensagem de confirmação também precisa dele, e duas
// cópias divergiriam.

export type Endereco = {
  cep?: string
  rua?: string
  numero?: string
  bairro?: string
  cidade?: string
  estado?: string
}

/** 'Rua das Flores, 120 — Centro — São Paulo'. null quando não há nada. */
export function formatarEndereco(e: Endereco | null | undefined): string | null {
  if (!e) return null
  const partes = [
    e.rua && e.numero ? `${e.rua}, ${e.numero}` : e.rua,
    e.bairro,
    e.cidade,
  ].filter(Boolean)
  return partes.length > 0 ? partes.join(' — ') : null
}
