// ─────────────────────────────────────────────────────────────────────────────
// Núcleo de agenda — fonte única de verdade para grade de horários,
// configuração de dia e duração de serviço.
//
// Antes desta extração, a mesma lógica vivia duplicada em
// app/agendar/[slug]/page.tsx, app/agendar-interno/page.tsx e
// app/api/agendar/ocupados/route.ts, com a grade 08:00–20:00 hardcoded
// em três lugares.
//
// CONVENÇÃO DE FUSO — "naive UTC":
// Os horários são gravados de forma que os dígitos armazenados JÁ SÃO a hora
// local pretendida (ex.: 14:00 no Brasil vira "...T14:00:00.000Z").
// Portanto SEMPRE leia com acessores UTC (getUTCHours), nunca getHours(),
// ou tudo desloca 3h.
// ─────────────────────────────────────────────────────────────────────────────

export type Intervalo = { inicio: string; fim: string }

export type HorarioDia = {
  abertura?: string
  fechamento?: string
  fechado?: boolean
  ativo?: boolean
  aberto24h?: boolean
  /** Pausas dentro do expediente (almoço, café). Bloqueiam [inicio, fim). */
  intervalos?: Intervalo[]
}

/**
 * Conteúdo de negocios.horarios (JSONB).
 *
 * Guarda as chaves de dia ('segunda'|'seg'|...) lado a lado com a configuração
 * global do negócio (buffer_min, folgas). Ficam no mesmo objeto de propósito:
 * evita migração de schema. Sempre leia via getConfDia/getBuffer/getFolgas,
 * que fazem a distinção com segurança.
 */
export type HorariosMap = {
  buffer_min?: number
  folgas?: string[]
} & {
  [chave: string]: HorarioDia | number | string[] | undefined
}

/** Grade padrão do app: 08:00 às 20:00, de 30 em 30 minutos. */
export const GRADE_INICIO_MIN = 8 * 60
export const GRADE_FIM_MIN    = 20 * 60
export const GRADE_PASSO_MIN  = 30

/** Faixa usada quando o dia não tem configuração explícita. */
const FALLBACK_ABERTURA   = '08:00'
const FALLBACK_FECHAMENTO = '18:00'

export function minutosParaHHMM(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
}

export function hhmmParaMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/** Gera a grade de horários. Sem argumentos, reproduz a grade legada 08:00–20:00/30min. */
export function gerarGrade(
  inicioMin = GRADE_INICIO_MIN,
  fimMin    = GRADE_FIM_MIN,
  passoMin  = GRADE_PASSO_MIN,
): string[] {
  const slots: string[] = []
  for (let t = inicioMin; t <= fimMin; t += passoMin) slots.push(minutosParaHHMM(t))
  return slots
}

/** Grade padrão pré-computada — equivalente à const HORARIOS que existia nas páginas. */
export const HORARIOS = gerarGrade()

// ── Configuração por dia da semana ───────────────────────────────────────────

const CHAVE_LONGA = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']
const CHAVE_CURTA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab']

function ehHorarioDia(v: unknown): v is HorarioDia {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Aceita as duas convenções de chave já presentes no banco ('segunda' e 'seg'). */
export function getConfDia(horarios: HorariosMap, dow: number): HorarioDia | null {
  const v = horarios[CHAVE_LONGA[dow]] ?? horarios[CHAVE_CURTA[dow]]
  return ehHorarioDia(v) ? v : null
}

/** Minutos de folga entre atendimentos. 0 quando não configurado. */
export function getBuffer(horarios?: HorariosMap | null): number {
  const b = horarios?.buffer_min
  return typeof b === 'number' && b > 0 ? b : 0
}

/** Datas 'YYYY-MM-DD' em que o negócio inteiro não atende. */
export function getFolgas(horarios?: HorariosMap | null): string[] {
  const f = horarios?.folgas
  return Array.isArray(f) ? f.filter((d): d is string => typeof d === 'string') : []
}

/** Um horário cai dentro de alguma pausa? Intervalo é [inicio, fim). */
export function emIntervalo(hhmm: string, intervalos?: Intervalo[]): boolean {
  if (!intervalos?.length) return false
  const t = hhmmParaMinutos(hhmm)
  return intervalos.some(iv =>
    t >= hhmmParaMinutos(iv.inicio) && t < hhmmParaMinutos(iv.fim)
  )
}

/** Dia da semana (0=domingo) de uma data 'YYYY-MM-DD', sem passar por UTC. */
export function diaDaSemana(dataStr: string): number {
  const [ano, mes, dia] = dataStr.split('-').map(Number)
  return new Date(ano, mes - 1, dia).getDay()
}

/**
 * Horários em que o negócio está aberto na data informada.
 * Retorna [] se o dia está fechado. Não desconta ocupados nem passado.
 */
export function horariosDoDia(
  horarios: HorariosMap | null | undefined,
  dataStr: string,
  grade: string[] = HORARIOS,
): string[] {
  if (!horarios) return grade
  // Folga do negócio: dia inteiro indisponível, independente do expediente.
  if (getFolgas(horarios).includes(dataStr)) return []
  const conf = getConfDia(horarios, diaDaSemana(dataStr))
  if (!conf) return grade.filter(h => h >= FALLBACK_ABERTURA && h <= FALLBACK_FECHAMENTO)
  if (conf.fechado || conf.ativo === false) return []
  return grade
    .filter(h => h >= conf.abertura! && h <= conf.fechamento!)
    .filter(h => !emIntervalo(h, conf.intervalos))
}

/**
 * Remove os horários ocupados e, se a data for hoje, os que já passaram.
 * Espelha exatamente o memo `horariosLivres` que existia nas duas páginas.
 */
export function horariosLivres(
  disponiveis: string[],
  ocupados: string[],
  dataStr: string,
): string[] {
  const agoraMin = dataStr === localDateStr() ? hhmmParaMinutos(horaAtualHHMM()) : -1
  return disponiveis.filter(h => {
    if (ocupados.includes(h)) return false
    if (agoraMin >= 0 && hhmmParaMinutos(h) <= agoraMin) return false
    return true
  })
}

// ── Duração de serviço ───────────────────────────────────────────────────────

/** Converte '30 min', '1h', '1h 30min' em minutos. Default 30. */
export function parseDuracao(dur: string): number {
  const h = dur.match(/(\d+)\s*h/)
  const m = dur.match(/(\d+)\s*min/)
  return (h ? parseInt(h[1]) * 60 : 0) + (m ? parseInt(m[1]) : 0) || 30
}

/**
 * Extrai a duração de um texto de serviço já concatenado — 'Corte (30 min)'.
 * Só considera os parênteses FINAIS, então nomes com parênteses no meio
 * ('Corte (masculino) (30 min)') continuam funcionando.
 */
export function parseDuracaoDoServico(servicoTexto: string): number {
  const match = servicoTexto.match(/\(([^)]+)\)\s*$/)
  if (!match) return 30
  return parseDuracao(match[1])
}

/** Todos os slots de 30min cobertos por um agendamento que começa em startMin. */
export function slotsOcupadosPor(startMin: number, duracaoMin: number, passo = GRADE_PASSO_MIN): string[] {
  const out: string[] = []
  for (let t = startMin; t < startMin + duracaoMin; t += passo) out.push(minutosParaHHMM(t))
  return out
}

// ── Helpers de data no formato "naive UTC" ───────────────────────────────────

/** 'YYYY-MM-DD' da data local (não UTC). */
export function localDateStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 'HH:MM' da hora local atual. */
export function horaAtualHHMM(d: Date = new Date()): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** "Agora" no formato naive UTC, para comparar com data_hora do banco. */
export function naiveNowISO(): string {
  const n = new Date()
  return `${localDateStr(n)}T${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}:${String(n.getSeconds()).padStart(2, '0')}.000Z`
}

/** Monta o data_hora naive UTC a partir de 'YYYY-MM-DD' + 'HH:MM'. */
export function montarDataHora(dataStr: string, horario: string): string {
  return `${dataStr}T${horario}:00.000Z`
}

/** 'YYYY-MM-DD' de um data_hora naive UTC. */
export function dataDe(iso: string): string {
  return iso.slice(0, 10)
}

/** 'HH:MM' de um data_hora naive UTC — usa acessores UTC de propósito. */
export function horaDe(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
}
