// ─────────────────────────────────────────────────────────────────────────────
// Feature flags simples, resolvidas no browser.
//
// A UI nova de agendamento entra atrás de flag porque a página pública é o
// funil de receita: dá para comparar conversão e voltar atrás sem code change.
//
// Precedência:
//   1. ?ui=nova / ?ui=antiga na URL — override por sessão, para testar sem
//      mexer em configuração;
//   2. NEXT_PUBLIC_AGENDAR_UI_NOVA=1 — liga para todo mundo;
//   3. desligada.
//
// Reverter em produção é trocar a env var e redeployar — sem reverter commit.
// A tela interna não passa por aqui: ela usa a UI nova direto.
// ─────────────────────────────────────────────────────────────────────────────

export function usarUiNovaAgendamento(): boolean {
  if (typeof window !== 'undefined') {
    const ui = new URLSearchParams(window.location.search).get('ui')
    if (ui === 'nova')   return true
    if (ui === 'antiga') return false
  }
  return process.env.NEXT_PUBLIC_AGENDAR_UI_NOVA === '1'
}
