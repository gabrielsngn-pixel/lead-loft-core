export type LeadStatus = "novo" | "qualificado" | "proposta" | "ganho" | "perdido";
export type LeadSource = "site" | "indicacao" | "evento" | "parceiro" | "outbound" | "outro";
export type UserRole = "sdr" | "consultor" | "gestor" | "master";
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

// Viabilidade types (integração Viability Compass)
export type ViabilidadeStatus = "pendente" | "em_analise" | "aprovado" | "reprovado" | "revisao";
export type ViabilidadeResultado = "viavel" | "inviavel" | "condicional";
export type ViabilidadeRecomendacao = "simples" | "media" | "nao";

export interface Viabilidade {
  id: string;
  lead_id?: string;
  contato_id?: string;
  negocio_id?: string;
  nome_empreendimento: string;
  cnpj?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  viability_compass_id?: string;
  status: ViabilidadeStatus;
  resultado?: ViabilidadeResultado;
  margem_estimada?: number;
  vgv_estimado?: number;
  custo_terreno?: number;
  custo_obra?: number;
  tir_estimada?: number;
  payback_meses?: number;
  recomendacao?: ViabilidadeRecomendacao;
  observacoes?: string;
  documento_id?: string;
  solicitado_por: string;
  solicitado_por_nome: string;
  analisado_por?: string;
  analisado_por_nome?: string;
  data_solicitacao: Date;
  data_analise?: Date;
  created_at: Date;
  updated_at: Date;
}

// Repository Document types
export type DocumentType = "viabilidade" | "contrato" | "ata" | "proposta" | "documento";
export type DocumentStatus = "ativo" | "arquivado" | "rascunho";

export interface RepositoryDocument {
  id: string;
  tipo: DocumentType;
  titulo: string;
  descricao?: string;
  lead_id?: string;
  contato_id?: string;
  negocio_id?: string;
  arquivo_url?: string;
  arquivo_nome?: string;
  arquivo_tamanho?: number;
  versao: string;
  versao_anterior_id?: string;
  status: DocumentStatus;
  tags?: string[];
  criado_por: string;
  criado_por_nome: string;
  atualizado_por?: string;
  atualizado_por_nome?: string;
  created_at: Date;
  updated_at: Date;
}
