// Destino seguro para "?redirect=" e "?next=".
//
// Sem essa checagem, um link como marcai.net.br/login?redirect=https://site-falso.com
// mandava a pessoa, já logada, para fora do Marcaí (golpe de phishing com o nosso
// domínio na frente). Só aceitamos caminhos internos: começam com "/" e não
// apontam para outro site ("//site.com", "/\site.com").

export function destinoSeguro(valor: string | null | undefined, padrao: string): string {
  if (!valor) return padrao
  const v = valor.trim()
  if (!v.startsWith('/')) return padrao
  if (v.startsWith('//') || v.startsWith('/\\')) return padrao
  // Caracteres de controle (ex.: "/\t/site.com") o navegador ignora e vira "//".
  if (/[\u0000-\u001f\u007f\\]/.test(v)) return padrao
  return v
}
