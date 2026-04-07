export const siteConfig = {
  name: "DocFleet",
  description:
    "Base inicial do DocFleet organizada para crescer com clareza, build previsivel e componentes reutilizaveis.",
  url: "https://docfleet.local",
  keywords: [
    "DocFleet",
    "Next.js",
    "gestao documental",
    "frota",
    "app router",
  ],
  links: {
    documentation: "https://nextjs.org/docs",
    nextjs: "https://nextjs.org/docs/app",
    repository: "/",
  },
  foundationItems: [
    {
      title: "Layout com metadata real",
      description:
        "A aplicacao agora usa identidade do produto, idioma correto e configuracao pensada para SEO e compartilhamento.",
    },
    {
      title: "Build sem dependencia de fonte externa",
      description:
        "A fonte do template foi removida para evitar falhas em CI, ambientes offline ou redes corporativas restritas.",
    },
    {
      title: "Home separada por responsabilidade",
      description:
        "A pagina inicial deixou de concentrar tudo em um unico arquivo e passou a usar componentes pequenos para facilitar manutencao e expansao.",
    },
    {
      title: "Features por dominio",
      description:
        "A base agora separa autenticacao, dashboard e dados em modulos independentes, com contratos e pontos claros de integracao.",
    },
    {
      title: "Persistencia e auth reais",
      description:
        "O projeto agora usa Auth.js com credenciais reais e persistencia local em SQLite, sem precisar desmontar a arquitetura por features.",
    },
  ],
  reviewActions: [
    {
      label: "Estrutura",
      title: "Componentes desacoplados",
      description:
        "A pagina inicial deixou de concentrar tudo em um unico arquivo e passou a usar componentes de apresentacao com responsabilidade clara.",
    },
    {
      label: "Codigo",
      title: "Configuracao centralizada",
      description:
        "Dados institucionais e links recorrentes foram movidos para `lib/site.ts`, reduzindo repeticao e facilitando ajustes globais.",
    },
    {
      label: "Qualidade",
      title: "Scripts de validacao",
      description:
        "Foi preparado um fluxo basico de verificacao com lint, typecheck e build para uso em rotina local ou CI.",
    },
    {
      label: "Produto",
      title: "Template removido",
      description:
        "Conteudo padrao do scaffold foi substituido por uma base coerente com o objetivo do projeto e com texto em portugues.",
    },
    {
      label: "Dominio",
      title: "Esqueleto por features",
      description:
        "Rotas reais em `/login` e `/dashboard` agora consomem servicos das features `auth`, `dashboard` e `data`.",
    },
    {
      label: "Infra",
      title: "Banco e sessao reais",
      description:
        "Persistencia local e autenticacao com sessao agora estao conectadas a um banco SQLite real, prontas para evoluir para SQL gerenciado ou API externa.",
    },
  ],
} as const;
