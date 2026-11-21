# Marcaí

SaaS de agendamento via WhatsApp para pequenos negócios: o dono cria um link, o cliente agenda
pelo celular sem app e sem cadastro, e a confirmação chega no WhatsApp dos dois.
No ar em [marcai.net.br](https://marcai.net.br).

| Documento | Para quê |
| --- | --- |
| `CLAUDE.md` | Regras do projeto (comece por aqui) |
| `DECISOES.md` | O porquê de cada decisão de produto e arquitetura |
| `GUIA-DEPLOY.md` | Como publicar, rodar SQL e resolver problemas conhecidos |
| `ROADMAP.md` | Fases do produto |
| `marketing/BRAND-GUIDE.md` | Guia da marca: cores, letra, posts, Reels (design Grafite) |

```bash
npm install
npm run dev          # http://localhost:3000 (sempre com webpack; o script já cuida disso)
npm test             # testes
npm run test:fusos   # testes em UTC, São Paulo e Tóquio
```
