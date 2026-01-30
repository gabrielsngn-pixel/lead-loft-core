export type LeadStatus = "novo" | "qualificado" | "proposta" | "ganho" | "perdido";
export type LeadSource = "site" | "indicacao" | "evento" | "parceiro" | "outbound" | "outro";
export type UserRole = "sdr" | "consultor" | "gestor";

export interface Lead {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  email: string;
  telefone: string;
  cidade: string;
  estado: string;
  origem: LeadSource;
  status: LeadStatus;
  responsavelId?: string;
  responsavelNome?: string;
  valorEstimado?: number;
  observacoes?: string;
  dataCriacao: Date;
  dataUltimaInteracao: Date;
  proximaAtividade?: Date;
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
  titulo: string;
  descricao?: string;
  dataAgendada: Date;
  dataConclusao?: Date;
  concluida: boolean;
  responsavelId: string;
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
}