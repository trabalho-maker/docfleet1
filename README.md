# DocFleet

Base inicial do projeto `DocFleet` com `Next.js` App Router, organizada para crescer com mais clareza e menos resquicios de scaffold.

## Setup local

```bash
Copy-Item .env.example .env
npm install
npm run dev
```

O runtime cria o schema do SQLite automaticamente quando `data/app.db` nao existe, mas agora inicia com banco vazio por padrao.

## Banco limpo para dados reais

Para iniciar testes com dados reais:

```text
1. garanta backup do banco atual antes de qualquer limpeza manual
2. remova ou substitua manualmente data/app.db apenas se voce realmente quiser reiniciar a base
3. mantenha junto do banco os arquivos data/app.db-wal e data/app.db-shm quando eles existirem
4. inicie o app normalmente com npm run dev
```

Com isso, o DocFleet recria somente o schema. Nenhum associado, documento, alerta ou usuario demonstrativo e criado automaticamente em runtime.

## Seed de desenvolvimento

O seed demonstrativo agora e apenas manual e explicito:

```bash
npm run db:seed
```

Esse comando:

```text
- apaga a base local atual
- recria o schema
- replanta dados demonstrativos
```

Nao use esse comando em producao nem sobre uma base com dados reais.

Credenciais iniciais da seed:

```text
SEED_USER_EMAIL e SEED_USER_PASSWORD no arquivo .env
```

Em desenvolvimento, o formulario de login pode exibir e preencher automaticamente as credenciais configuradas em:

```text
NEXT_PUBLIC_DEV_SEED_USER_EMAIL
NEXT_PUBLIC_DEV_SEED_USER_PASSWORD
```

## Alerta importante sobre limpeza e backup

Antes de apagar, substituir ou mover o banco local:

```text
- faca backup de data/app.db
- preserve tambem data/app.db-wal e data/app.db-shm se eles existirem
- nunca execute limpeza sem confirmar que a base nao contem dados reais
```

## Fluxos de autenticacao disponiveis

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
npm run db:seed
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
- persistencia local em SQLite em arquivo real para ambiente inicial
- runtime SQLite atual usa banco local em `data/app.db`, com foreign keys ativas e journal WAL quando suportado
- banco vazio nao recebe seed automatica em runtime
- seed demonstrativo exige comando manual explicito
- cadastro de usuario com validacao server-side
- recuperacao de senha com token seguro e entrega via SMTP
- CRUD de documentos, logica de vencimento e alertas incrementais
- testes unitarios, de integracao e E2E com Jest e Playwright
- scripts de validacao prontos para uso local ou CI

## Proximos passos sugeridos

- trocar SQLite local por banco gerenciado ou API externa se necessario
- adicionar autorizacao por papel nas rotas e mutacoes sensiveis
- expandir testes de componentes e fluxos de permissao
