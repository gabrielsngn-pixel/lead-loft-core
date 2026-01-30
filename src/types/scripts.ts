export interface ScriptSection {
  id: string;
  title: string;
  icon: string;
  content: ScriptContent[];
  keyPhrases?: string[];
}

export interface ScriptContent {
  type: "text" | "bullets" | "question" | "highlight" | "stat";
  content: string;
  subItems?: string[];
  answered?: boolean;
}

export interface ScriptUsage {
  id: string;
  scriptId: string;
  consultorId: string;
  consultorNome: string;
  leadId?: string;
  negociacaoId?: string;
  reuniaoId?: string;
  dataUso: Date;
  secoesMarcadas: string[];
  perguntasRespondidas: string[];
  notas?: string;
}

export const scriptSections: ScriptSection[] = [
  {
    id: "abordagem",
    title: "Abordagem",
    icon: "MessageCircle",
    keyPhrases: [
      "A Loft é a maior originadora de crédito imobiliário do Brasil",
      "+8.4 BI em contratos emitidos por ano",
      "+9 Mil parceiros ativos"
    ],
    content: [
      {
        type: "text",
        content: "Olá! Meu nome é [Nome], sou consultor da Loft. A Loft é a maior originadora de crédito imobiliário do Brasil, com mais de R$ 8,4 bilhões em contratos emitidos por ano."
      },
      {
        type: "highlight",
        content: "Nosso objetivo: transformar crédito em previsibilidade para incorporações."
      },
      {
        type: "stat",
        content: "+9 Mil parceiros ativos | +2 MM de pessoas impactadas | +174 BI em propostas"
      }
    ]
  },
  {
    id: "conexao",
    title: "Conexão",
    icon: "Users",
    keyPhrases: [
      "Entendemos a dor central da incorporação",
      "O risco integral entre venda e financiamento",
      "36 meses de vulnerabilidade"
    ],
    content: [
      {
        type: "text",
        content: "Entendemos que na incorporação imobiliária, o maior risco não está na execução da obra em si. O verdadeiro desafio está no intervalo crítico entre vender hoje e financiar daqui a 36 meses."
      },
      {
        type: "highlight",
        content: "A dor central: O incorporador assume todo o risco financeiro e operacional do projeto."
      },
      {
        type: "bullets",
        content: "Três fatores que criam alto risco:",
        subItems: [
          "Crédito ausente: O financiamento ainda não existe e depende de aprovação futura",
          "Caixa incerto: A previsibilidade de entrada de recursos é baixa e volátil",
          "Risco integral: Bancos só avaliam o comprador no momento final"
        ]
      }
    ]
  },
  {
    id: "perguntas",
    title: "Perguntas-Chave",
    icon: "HelpCircle",
    keyPhrases: [
      "Descobrir dores específicas",
      "Qualificar a oportunidade",
      "Entender momento do cliente"
    ],
    content: [
      {
        type: "question",
        content: "Qual é o volume médio de vendas na planta por mês nos seus empreendimentos?"
      },
      {
        type: "question",
        content: "Vocês já enfrentaram problemas com distrato estrutural? Qual a taxa atual?"
      },
      {
        type: "question",
        content: "Como é feita hoje a análise de crédito dos compradores antes da venda?"
      },
      {
        type: "question",
        content: "Existe acompanhamento do perfil de crédito durante o período de obra?"
      },
      {
        type: "question",
        content: "Qual tem sido a taxa de reprovação no momento do repasse?"
      },
      {
        type: "question",
        content: "Vocês trabalham com CCA ou assessoria de crédito atualmente? Como está a experiência?"
      },
      {
        type: "question",
        content: "Qual o maior desafio hoje: vender mais ou garantir que a venda se converta em caixa?"
      },
      {
        type: "question",
        content: "Quanto de estoque involuntário vocês têm em unidades prontas?"
      }
    ]
  },
  {
    id: "proposta",
    title: "Proposta de Valor",
    icon: "Target",
    keyPhrases: [
      "Transformamos risco em previsibilidade",
      "Crédito deixa de ser surpresa",
      "Caixa previsível, risco controlado"
    ],
    content: [
      {
        type: "highlight",
        content: "A Loft atua como uma infraestrutura de crédito integrada à jornada completa da incorporação."
      },
      {
        type: "bullets",
        content: "Nossos pilares de sucesso:",
        subItems: [
          "Atendimento especializado: Esteira até 35% mais ágil em comparação ao mercado",
          "Tecnologia com IA: Ferramentas automatizadas no WhatsApp e PDP",
          "Operação de Excelência: Portfólio multibancos e especialistas em reversão de crédito negado"
        ]
      },
      {
        type: "text",
        content: "Atuamos desde a venda na planta, não apenas no repasse. Monitoramos o comprador durante todo o ciclo da obra, gerando dados e probabilidades para decisões informadas."
      },
      {
        type: "stat",
        content: "15-25% taxa de distrato típica sem gestão | 30-40% reprovação no repasse | R$5-15M em estoque involuntário"
      }
    ]
  },
  {
    id: "solucao",
    title: "Solução Loft",
    icon: "Lightbulb",
    keyPhrases: [
      "Plataforma Multibanco inteligente",
      "Matching por perfil de cliente",
      "Entrada antecipada no ciclo"
    ],
    content: [
      {
        type: "highlight",
        content: "Multibanco não é quantidade, é direcionamento inteligente."
      },
      {
        type: "bullets",
        content: "O que entregamos na prática:",
        subItems: [
          "Integração via API: Conexão direta com sistemas da incorporadora",
          "Pré-qualificação multibanco: Análise prévia em múltiplas instituições antes da venda",
          "Matching inteligente: Direcionamos cada cliente ao banco com maior chance de aprovação",
          "Monitoramento contínuo: Alertas automáticos de mudanças críticas de risco",
          "Redução SLA: 35% menos tempo de aprovação de crédito"
        ]
      },
      {
        type: "bullets",
        content: "Bancos conectados:",
        subItems: ["Itaú", "Bradesco", "Santander", "Caixa", "Inter"]
      },
      {
        type: "text",
        content: "Operações Loft especializados operam todo o processo de crédito, assumindo a burocracia e reduzindo o risco de primarização pela incorporadora."
      }
    ]
  },
  {
    id: "fechamento",
    title: "Fechamento",
    icon: "CheckCircle",
    keyPhrases: [
      "Transforme incerteza em previsibilidade",
      "Transforme risco em gestão",
      "Vender melhor e receber no tempo certo"
    ],
    content: [
      {
        type: "highlight",
        content: "Crédito deixa de ser surpresa e passa a ser variável controlável."
      },
      {
        type: "bullets",
        content: "Impacto direto mensurável:",
        subItems: [
          "Redução de distratos: Diminuição estrutural através de pré-qualificação",
          "Menor volatilidade: Fluxo de caixa mais estável e previsível",
          "Previsibilidade de repasse: Maior certeza sobre quando e quanto será recebido",
          "Narrativa sólida: Dados concretos para bancos, fundos e investidores"
        ]
      },
      {
        type: "text",
        content: "A Loft Incorporações transforma a gestão de crédito de um ponto cego em uma vantagem competitiva. Ajudamos incorporadoras a vender melhor e receber no tempo certo."
      },
      {
        type: "highlight",
        content: "Próximo passo: Agendar uma análise gratuita do seu pipeline atual e identificar oportunidades de melhoria."
      }
    ]
  }
];
