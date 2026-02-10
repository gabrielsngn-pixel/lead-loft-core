export type EmpreendimentoStatus =
  | "mapeado"
  | "em_contato"
  | "em_negociacao"
  | "viabilidade_aprovada"
  | "contrato_em_assinatura"
  | "contrato_assinado"
  | "perdido";

export type TipoEmpreendimento = "residencial" | "mcmv" | "medio_padrao" | "alto_padrao";
export type ModeloRepasse = "repasse" | "piloto" | "individual";
export type FonteImportacao = "orulo" | "geofusion" | "manual";
export type StatusRelacionamento =
  | "nao_contatado"
  | "contato_iniciado"
  | "reuniao_agendada"
  | "reuniao_realizada"
  | "em_negociacao";

export interface Empreendimento {
  id: string;
  nome_empreendimento: string;
  construtora: string;
  cidade: string;
  estado: string;
  data_habitese: string | null;
  mes_ano_habitese: string | null;
  ano_habitese: number | null;
  tipo_empreendimento: TipoEmpreendimento;
  status: EmpreendimentoStatus;
  gestor_responsavel_id: string | null;
  gestor_responsavel_nome: string | null;
  consultor_responsavel_id: string | null;
  consultor_responsavel_nome: string | null;
  observacoes: string | null;
  unidades_estimadas: number | null;
  ticket_medio: number | null;
  vgv_estimado: number | null;
  banco_financiador: string | null;
  modelo_repasse: string | null;
  chave_unica: string;
  fonte_importacao: string;
  data_importacao: string;
  importado_por: string | null;
  importado_por_nome: string | null;
  status_importacao: string;
  created_at: string;
  updated_at: string;
}

export interface EmpreendimentoDecisor {
  id: string;
  empreendimento_id: string;
  prospect_id: string | null;
  lead_id: string | null;
  nome: string;
  cargo: string | null;
  empresa: string | null;
  tipo_vinculo: string;
  origem: string | null;
  email: string | null;
  telefone: string | null;
  linkedin: string | null;
  consultor_responsavel_id: string | null;
  consultor_responsavel_nome: string | null;
  status_relacionamento: StatusRelacionamento;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmpreendimentoImportLog {
  id: string;
  data_importacao: string;
  fonte: string;
  total_registros: number;
  quantidade_importada: number;
  quantidade_ignorada: number;
  user_id: string;
  user_nome: string;
  log_erros: any;
  created_at: string;
}

export const statusEmpreendimentoLabels: Record<EmpreendimentoStatus, string> = {
  mapeado: "Mapeado",
  em_contato: "Em Contato",
  em_negociacao: "Em Negociação",
  viabilidade_aprovada: "Viabilidade Aprovada",
  contrato_em_assinatura: "Contrato em Assinatura",
  contrato_assinado: "Contrato Assinado",
  perdido: "Perdido",
};

export const statusEmpreendimentoColors: Record<EmpreendimentoStatus, string> = {
  mapeado: "bg-blue-100 text-blue-800",
  em_contato: "bg-yellow-100 text-yellow-800",
  em_negociacao: "bg-orange-100 text-orange-800",
  viabilidade_aprovada: "bg-green-100 text-green-800",
  contrato_em_assinatura: "bg-purple-100 text-purple-800",
  contrato_assinado: "bg-emerald-100 text-emerald-800",
  perdido: "bg-red-100 text-red-800",
};

export const tipoEmpreendimentoLabels: Record<TipoEmpreendimento, string> = {
  residencial: "Residencial",
  mcmv: "MCMV",
  medio_padrao: "Médio Padrão",
  alto_padrao: "Alto Padrão",
};
