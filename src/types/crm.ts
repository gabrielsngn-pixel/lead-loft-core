export type LeadStatus = "novo" | "qualificado" | "proposta" | "ganho" | "perdido";
export type LeadSource = "site" | "indicacao" | "evento" | "parceiro" | "outbound" | "outro";
export type UserRole = "sdr" | "consultor" | "gestor";
export type Priority = "alta" | "media" | "baixa";
export type CompanyType = "incorporadora" | "banco" | "fundo" | "canal" | "outro";
export type ActivityCategory = "loft" | "tech" | "interna";

export interface Lead {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  nomeContato?: string;
  email: string;
  telefone: string;
  cidade: string;
  estado: string;
  origem: LeadSource;
  status: LeadStatus;
  prioridade: Priority;
  tipoEmpresa: CompanyType;
  responsavelId?: string;
  responsavelNome?: string;
  valorEstimado?: number;
  observacoes?: string;
  dataCriacao: Date;
  dataUltimaInteracao: Date;
  proximaAtividade?: Date;
  proximaReuniao?: Date;
  viabilidade?: {
    status: "sim" | "nao" | "pendente";
    margem?: number;
    recomendacao?: "simples" | "media" | "nao";
    dataAnalise?: Date;
  };
}

export interface Negotiation {
  id: string;
  leadId: string;
  lead: Lead;
  titulo: string;
  valor: number;
  etapa: "qualificacao" | "proposta" | "negociacao" | "fechamento";
  probabilidade: number;
  dataPrevisaoFechamento?: Date;
  dataCriacao: Date;
  dataAtualizacao: Date;
}

export interface Activity {
  id: string;
  leadId?: string;
  negociacaoId?: string;
  tipo: "ligacao" | "email" | "reuniao" | "visita" | "tarefa";
  categoria: ActivityCategory;
  titulo: string;
  descricao?: string;
  dataAgendada: Date;
  dataConclusao?: Date;
  concluida: boolean;
  responsavelId: string;
  responsavelNome?: string;
  comentario?: string;
}

export interface User {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface DashboardStats {
  totalLeads: number;
  leadsNovos: number;
  negociacoesAtivas: number;
  valorPipeline: number;
  taxaConversao: number;
  atividadesHoje: number;
  contatosAtivos: number;
  reunioesProximos7Dias: number;
  leadsSemAtividade: number;
  receitaPotencial: number;
}
