# Gestão do Terreiro

Painel para cadastrar consulentes, cobrar mensalidade por WhatsApp, registrar doações e despesas, e gerar a planilha de prestação de contas com um clique.

## Stack

- **Next.js 16** (App Router) + Tailwind — frontend e API em um único projeto, hospedado na **Vercel**.
- **Postgres** (recomendado: Supabase ou Neon, ambos com plano gratuito) + **Drizzle ORM** — não usa Prisma de propósito: os binários do Prisma são baixados de uma CDN própria que fica bloqueada em alguns ambientes de rede restrita; o Drizzle é 100% JavaScript e evita esse problema.
- **Z-API** para envio das mensagens de WhatsApp.
- **Vercel Cron Jobs** para disparo automático diário da cobrança (`vercel.json`).
- **ExcelJS** para gerar a planilha de prestação de contas sob demanda, a partir dos dados reais do banco.

## Como funciona, por cima

1. Você cadastra os consulentes com valor de mensalidade e dia de vencimento.
2. Todo dia, uma rotina (`/api/cron/cobranca`) confere quem vence naquele dia, cria a cobrança do mês e manda o lembrete de WhatsApp. Quem passa do vencimento sem pagar é marcado como "atrasado" e recebe um aviso único.
3. Você marca os pagamentos como "pago" conforme forem caindo no PIX (não há conciliação bancária automática nesta primeira versão — ver "Limitações" abaixo).
4. Doações avulsas e despesas são lançadas manualmente nas telas correspondentes.
5. A qualquer momento, a tela "Relatórios" gera a planilha `.xlsx` de prestação de contas do mês escolhido, com os dados reais já lançados.

## Rodando localmente

Pré-requisitos: Node.js 20.9+ e um Postgres (local ou de um provedor na nuvem).

```bash
npm install
cp .env.example .env.local
# edite .env.local com sua string de conexão do Postgres e as demais variáveis
npm run db:generate   # gera as migrations a partir do schema (já vem gerado em /drizzle)
npm run db:migrate    # aplica as migrations no banco
npm run db:seed       # opcional: cria 3 consulentes de exemplo
npm run dev
```

Acesse `http://localhost:3000`, entre com a senha definida em `ADMIN_PASSWORD`.

## Publicando na Vercel

### 1. Suba o projeto para um repositório Git

```bash
git init   # se ainda não for um repositório
git add .
git commit -m "Primeira versão do painel"
```

Crie um repositório no GitHub/GitLab/Bitbucket e faça o push.

### 2. Crie o banco de dados (Supabase ou Neon)

Qualquer um dos dois funciona bem no plano gratuito para o volume de um terreiro pequeno/médio:

- **Supabase** (supabase.com): crie um projeto, vá em Project Settings → Database → Connection string (modo "Transaction" ou "Session", copie a URI).
- **Neon** (neon.tech): crie um projeto, a connection string já aparece na tela inicial do banco.

Guarde a string — ela vai na variável `DATABASE_URL`.

### 3. Importe o projeto na Vercel

1. Em vercel.com, "Add New" → "Project" → selecione o repositório.
2. Em "Environment Variables", configure todas as variáveis do `.env.example`:
   - `DATABASE_URL` — a connection string do passo 2.
   - `ADMIN_PASSWORD` — a senha que você vai usar para entrar no painel.
   - `SESSION_SECRET` — gere uma com `openssl rand -base64 32`.
   - `ZAPI_INSTANCE_ID`, `ZAPI_TOKEN`, `ZAPI_CLIENT_TOKEN` — veja o passo 4.
   - `CRON_SECRET` — qualquer string aleatória (protege a rota de cron).
   - `PIX_KEY` — a chave PIX que aparece nas mensagens de cobrança.
   - `TERREIRO_NAME` — nome exibido no painel e nas mensagens.
3. Clique em "Deploy".

### 4. Configure a Z-API

1. Crie uma conta em [z-api.io](https://www.z-api.io) e uma instância conectada ao WhatsApp do terreiro (é necessário escanear o QR Code com o celular, como no WhatsApp Web).
2. No painel da instância, copie o **Instance ID** e o **Token** → variáveis `ZAPI_INSTANCE_ID` e `ZAPI_TOKEN`.
3. Copie o **Client-Token** da conta (em Segurança/Security da conta Z-API) → variável `ZAPI_CLIENT_TOKEN`.
4. **Confirme os valores atuais de plano/preço direto no site da Z-API antes de contratar** — não há garantia de que os preços não mudaram desde a criação deste projeto.

### 5. Rode as migrations no banco de produção

Depois do primeiro deploy, rode a migration apontando para o banco de produção (uma única vez, da sua máquina):

```bash
DATABASE_URL="a-mesma-url-de-producao" npm run db:migrate
```

### 6. Confirme o Cron Job

O arquivo `vercel.json` já registra a rotina diária:

```json
{
  "crons": [{ "path": "/api/cron/cobranca", "schedule": "0 12 * * *" }]
}
```

Isso roda todo dia às 12:00 UTC (09:00 horário de Brasília). Cron Jobs na Vercel exigem, no mínimo, o plano **Hobby** com o projeto vinculado a uma conta (funciona no plano gratuito, mas com limite de execuções — mais que suficiente para 1x por dia). Você pode conferir/editar o horário em Project Settings → Cron Jobs no painel da Vercel.

## Estrutura do projeto

```
src/
  app/
    login/                   página de login
    (app)/                   páginas do painel (protegidas)
      dashboard/
      consulentes/
      pagamentos/
      doacoes/
      despesas/
      relatorios/
    api/
      auth/                  login/logout
      consulentes/           CRUD de consulentes
      pagamentos/            cobranças do mês, marcar pago
      doacoes/ despesas/     lançamentos
      whatsapp/              disparo manual e em lote
      cron/cobranca/         rotina diária (Vercel Cron)
      relatorios/export/     gera a planilha .xlsx
  db/
    schema.ts                modelo de dados (Drizzle)
    seed.ts                  dados de exemplo para dev
  lib/
    auth.ts                  sessão do admin (cookie assinado)
    zapi.ts                  integração com a Z-API
    format.ts                formatação de moeda/datas
  proxy.ts                   protege as rotas (exige login)
```

## Segurança e dados sensíveis

- O painel tem **um único usuário administrador** (a senha em `ADMIN_PASSWORD`). Não há cadastro de múltiplos usuários nesta versão.
- Nome, WhatsApp e vínculo com o terreiro são dados sensíveis pela LGPD (convicção religiosa). Evite expor a URL do painel publicamente e troque a senha padrão antes de cadastrar qualquer consulente de verdade.
- `SESSION_SECRET` e `ADMIN_PASSWORD` nunca devem ser commitados no Git — o `.gitignore` já bloqueia arquivos `.env*`.

## Limitações desta primeira versão (e o que fazer depois)

- **Sem conciliação automática de PIX**: marcar "pago" ainda é manual. Uma evolução natural é integrar com a API de PIX de algum banco/gateway para automatizar isso.
- **Sem múltiplos usuários/permissões**: só existe a senha única de administrador.
- **Sem confirmação do consulente pelo WhatsApp**: o consulente não consegue responder e ter isso refletido automaticamente no sistema (exigiria configurar um webhook de recebimento na Z-API).
- **Cron roda 1x por dia**: suficiente para o volume atual, mas se o terreiro crescer muito, pode valer revisar a lógica de horários/fusos.

## Comandos úteis

```bash
npm run dev          # ambiente de desenvolvimento
npm run build        # build de produção (mesma etapa que a Vercel roda)
npm run lint         # checagem de lint
npm run db:generate  # gera uma nova migration após mudar src/db/schema.ts
npm run db:migrate   # aplica as migrations pendentes
npm run db:seed      # popula o banco com consulentes de exemplo
```
