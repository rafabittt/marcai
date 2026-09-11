# Marcaí — Guia de deploy e operação

Runbook das operações recorrentes e do troubleshooting do que já quebrou. Faça na ordem.

## Ambiente local

- Projeto vive em `~/marcai` (disco interno, **fora do iCloud** — Documents/Desktop
  corrompem `.next`/`node_modules`).
- Rodar: `npm run dev` (= `next dev --webpack`). Sobe em `localhost:3000`.
- `.env.local` fica na raiz e **nunca** vai pro git (`.gitignore` cobre `.env*`). Confira com
  `git ls-files | grep env` (não deve imprimir nada).
- Testes: `npm test` e `npm run test:fusos` (roda em três fusos). Mantenha verde.

## Deploy

**Push = deploy.** A Vercel está ligada ao GitHub e faz deploy automático a cada push pra
`main`. Não existe comando de deploy separado.

```bash
git push        # dispara o deploy na Vercel
```

Acompanhe em Vercel → Deployments; o commit novo fica **Ready** (verde) em ~1 min. Confirme
abrindo a URL de produção.

## Rodar SQL (migrações)

O Claude Code **não roda DDL** (`ALTER TABLE`, `CREATE VIEW`...) — ele prepara os arquivos em
`scripts/sql/NN_*.sql`. Você roda no **SQL editor do Supabase**. Backfill de dados o Claude
Code faz por script com preview e seu OK.

**Ordem importa quando o código depende do schema.** Regra geral:

1. Rode o SQL **aditivo** primeiro (adicionar coluna/tabela/view — não quebra nada).
2. **Push** (deploy do código que usa o schema novo).
3. Só então rode o SQL **restritivo** (revoke, drop) — o que derrubaria o código antigo.

Exemplo real (fechamento do vazamento de PII): rodar `01` (cria a view) → push → `02` (revoga
anon em `negocios`). Rodar o `02` antes do deploy derruba a página pública.

## Variáveis de ambiente na Vercel

Env `NEXT_PUBLIC_*` é embutida no **build** — mudar valor **exige um novo deploy/redeploy**
pra valer. Settings → Environment Variables. Marque **Production** (e Preview/Development se
quiser). Depois, Deployments → ⋯ → Redeploy.

- **Config (plain):** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `ZAPI_INSTANCE_ID`, `ASAAS_BASE_URL`, `OWNER_PHONE`.
- **Secret (sensitive):** `SUPABASE_SERVICE_ROLE_KEY`, `ZAPI_TOKEN`, `ZAPI_CLIENT_TOKEN`,
  `ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN`.
- Os `NEXT_PUBLIC_*` **têm que ser Config** (são expostos ao browser de qualquer jeito e
  precisam existir no build).
- **`ASAAS_API_KEY` vai SEM o `$` inicial** — o código prefixa o `$` (`lib/asaas.ts`). Com o
  `$`, vira `$$aact_...` e toda chamada dá 401.
- Regra de ouro: o valor na Vercel = o valor do `.env.local`, idêntico.

## Chaves e onde pegar

- **Supabase** (`supabase.com/dashboard` → Project Settings → API): URL, anon key, service
  role key.
- **Z-API** (`app.z-api.io`): instância (ID + token) e, em Segurança/Account Security, o
  Client-Token. `OWNER_PHONE` = seu WhatsApp, só dígitos com DDI (`5511...`).
- **Asaas** (`asaas.com` → Integrações/API): API key (cole **sem** o `$`), base URL
  (sandbox `https://api-sandbox.asaas.com/v3` ou produção `https://api.asaas.com/v3`, sem
  barra no fim), e o webhook token (você inventa e cola igual no cadastro do webhook).

## Webhook do Asaas

Painel do Asaas → Integrações → Webhooks. URL `https://marcai.net.br/api/webhooks/asaas`,
token de autenticação = `ASAAS_WEBHOOK_TOKEN` (mín. 32 chars). Eventos marcados: Cobranças
`PAYMENT_CONFIRMED/RECEIVED/OVERDUE/REFUNDED/DELETED` + Assinaturas `SUBSCRIPTION_CREATED/
UPDATED/INACTIVATED/DELETED`. Confira o resultado em "Logs de Webhooks" (quer ver **200**).

## Testar o WhatsApp isolado (Z-API)

Confirma se o Z-API envia, sem passar pelo site. No terminal (na pasta, com as env
carregadas: `set -a; source .env.local; set +a`):

```bash
curl -s -X POST \
  "https://api.z-api.io/instances/$ZAPI_INSTANCE_ID/token/$ZAPI_TOKEN/send-text" \
  -H "Client-Token: $ZAPI_CLIENT_TOKEN" -H "Content-Type: application/json" \
  -d '{"phone":"'"$OWNER_PHONE"'","message":"teste"}'
```

Chegou → credencial ok, problema é no app/env da Vercel. Não chegou → conexão/credencial do
Z-API (confira instância "Conectada" em `app.z-api.io` e as env na Vercel).

---

## Troubleshooting (já aconteceu)

**`npm install` diz "no such file... package.json"** → você está na pasta errada. O projeto
é `~/marcai` (entre nele antes).

**Vermelho no VS Code / centenas de "Problems" após clonar** → faltou `npm install`
(o clone não traz `node_modules`). Rode e recarregue a janela.

**"Unable to acquire lock at .next/dev/lock" / "Port 3000 in use"** → já tem um `next dev`
rodando. Mate o processo (`lsof -ti:3000 | xargs kill -9`) e suba de novo; se persistir,
`rm -f .next/dev/lock`.

**Arquivos `... 2.ts` duplicados quebrando o `tsc`** → sincronização do iCloud sobre o
projeto. Solução definitiva: manter o repo fora de Documents/Desktop (já está em `~/marcai`).

**WhatsApp não dispara em produção (mas o curl do Z-API funciona)** → env `ZAPI_*` faltando
ou desatualizada na Vercel (o `.env.local` é só local), ou o envio não está `await`-ado
(promise cortada quando a função serverless retorna). Atualize a env + redeploy; cheque o
`await`.

**Toda chamada ao Asaas dá 401** → `ASAAS_API_KEY` com `$` na frente (o código já adiciona),
ou `ASAAS_BASE_URL` errada (o Asaas mudou o domínio de sandbox).

**Página pública quebra depois de rodar SQL** → rodou o SQL restritivo (revoke/drop) antes do
deploy do código novo. Rode o aditivo → push → restritivo.

**"multiple lockfiles" no boot do Next** → `package-lock.json` órfão numa pasta acima. Apague
o de cima (`rm ../package-lock.json`, estando dentro de `~/marcai`).
