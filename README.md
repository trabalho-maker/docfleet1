# DocFleet

Base inicial do projeto `DocFleet` com `Next.js` App Router, organizada para crescer com mais clareza e menos resquicios de scaffold.

## Setup local

```bash
Copy-Item .env.example .env
npm install
npm run db:setup
npm run dev
```

Credenciais iniciais da seed:

```text
SEED_USER_EMAIL e SEED_USER_PASSWORD no arquivo .env
```

Em desenvolvimento, o formulario de login pode exibir e preencher automaticamente as credenciais configuradas em:

```text
NEXT_PUBLIC_DEV_SEED_USER_EMAIL
NEXT_PUBLIC_DEV_SEED_USER_PASSWORD
```

Fluxos de autenticacao disponiveis:

```text
/login     acesso com credenciais
/cadastro  criacao de novo usuario com validacao
/recuperar-senha  solicitacao de token de recuperacao
/redefinir-senha  redefinicao com token seguro
```

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm run check
npm run test
npm run test:e2e
```

## Email e recuperacao de senha

O fluxo de recuperacao usa token seguro com hash persistido no SQLite e entrega do link por email.

Para envio real, configure um provedor SMTP no `.env`:

```text
SMTP_HOST
SMTP_PORT
SMTP_SECURE
SMTP_USER
SMTP_PASSWORD
SMTP_FROM
EMAIL_TRANSPORT=smtp
```

Em desenvolvimento e nos testes E2E, voce pode usar:

```text
EMAIL_TRANSPORT=file
```

Nesse modo, os emails enviados ficam registrados em arquivo local para inspecao e automacao.
Em runtime normal o outbox fica em `data/email-outbox.json`, e no E2E em `.e2e/email-outbox.json`.

## Estrutura inicial

```text
app/                rotas, layout e entrypoints do App Router
components/home/    componentes visuais da pagina inicial
features/           modulos de dominio e regras por contexto
lib/                configuracoes e dados compartilhados
data/               arquivos locais do banco SQLite
scripts/            seed e utilitarios operacionais
public/             assets estaticos
```

## Diretrizes adotadas

- metadata e identidade do projeto centralizadas
- pagina inicial quebrada em componentes menores
- build sem dependencia de fonte remota
- features separadas para auth, dashboard e data layer
- Auth.js com credenciais reais e sessao ativa
- persistencia local em SQLite para ambiente inicial
- runtime SQLite atual opera em modo single-process com snapshot local; para concorrencia real, use um adapter de banco gerenciado
- cadastro de usuario com validacao server-side
- recuperacao de senha com token seguro e entrega via SMTP
- CRUD de documentos, logica de vencimento e alertas incrementais
- testes unitarios, de integracao e E2E com Jest e Playwright
- scripts de validacao prontos para uso local ou CI

## Proximos passos sugeridos

- trocar SQLite local por banco gerenciado ou API externa se necessario
- adicionar autorizacao por papel nas rotas e mutacoes sensiveis
- expandir testes de componentes e fluxos de permissao
