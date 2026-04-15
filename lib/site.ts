export const siteConfig = {
  name: "DocFleet",
  description:
    "Plataforma administrativa do DocFleet organizada para crescer com clareza, build previsível e componentes reutilizáveis.",
  url: "https://docfleet.local",
  keywords: [
    "DocFleet",
    "Next.js",
    "gestão documental",
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
      title: "Identidade institucional aplicada",
      description:
        "A aplicação já usa uma linguagem visual própria, com identidade do produto pensada para navegação pública e área autenticada.",
    },
    {
      title: "Build previsível em qualquer ambiente",
      description:
        "A base foi preparada para rodar sem dependência de recursos frágeis, reduzindo atrito em CI, ambientes offline e redes corporativas.",
    },
    {
      title: "Home institucional desacoplada",
      description:
        "A página inicial está organizada em componentes menores, facilitando manutenção, refinamento visual e expansão do conteúdo institucional.",
    },
    {
      title: "Arquitetura por domínio",
      description:
        "Autenticação, dashboard, documentos e associados já seguem uma separação clara por contexto, com contratos definidos e pontos consistentes de integração.",
    },
    {
      title: "Persistência e acesso reais",
      description:
        "O sistema já opera com Auth.js e SQLite reais, sem abandonar a arquitetura por features nem sacrificar previsibilidade de evolução.",
    },
  ],
  reviewActions: [
    {
      label: "Estrutura",
      title: "Componentes com responsabilidade clara",
      description:
        "A home deixou de concentrar tudo em um único arquivo e passou a usar blocos de apresentação mais previsíveis e fáceis de manter.",
    },
    {
      label: "Código",
      title: "Configuração institucional centralizada",
      description:
        "Informações institucionais e conteúdo recorrente vivem em `lib/site.ts`, o que reduz repetição e facilita ajustes de produto em escala.",
    },
    {
      label: "Qualidade",
      title: "Validação automatizada",
      description:
        "A base já conta com lint, typecheck e build como verificação padrão para dar segurança à evolução local e em CI.",
    },
    {
      label: "Produto",
      title: "Experiência alinhada ao domínio",
      description:
        "O conteúdo genérico do scaffold foi substituído por uma narrativa coerente com gestão documental, governança e operação de frota.",
    },
    {
      label: "Domínio",
      title: "Fluxos reais por módulo",
      description:
        "Rotas como `/login`, `/dashboard`, `/documentos` e `/associados` já consomem serviços reais conectados ao núcleo do sistema.",
    },
    {
      label: "Infra",
      title: "Banco e sessão conectados",
      description:
        "Persistência local e autenticação com sessão já funcionam sobre um banco SQLite real, prontas para evoluir para SQL gerenciado ou API externa.",
    },
  ],
} as const;
