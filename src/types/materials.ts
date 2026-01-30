export type MaterialCategory = "treinamento" | "prospeccao" | "reuniao";
export type MaterialType = "pdf" | "ppt" | "video" | "imagem" | "link" | "documento";
export type MaterialStatus = "ativo" | "arquivado";
export type MaterialAudience = "sdr" | "consultor" | "gestor" | "todos";
export type NegotiationStage = "qualificacao" | "proposta" | "negociacao" | "fechamento";

export interface MaterialUsage {
  id: string;
  materialId: string;
  userId: string;
  userName: string;
  leadId?: string;
  leadName?: string;
  negociacaoId?: string;
  dataUso: Date;
  contexto?: string;
}

export interface Material {
  id: string;
  titulo: string;
  descricao: string;
  categoria: MaterialCategory;
  tipo: MaterialType;
  status: MaterialStatus;
  publicoAlvo: MaterialAudience;
  
  // File or link
  url?: string;
  arquivoNome?: string;
  arquivoTamanho?: number;
  
  // Version control
  versao: string;
  historicoVersoes: {
    versao: string;
    data: Date;
    autor: string;
    descricao?: string;
  }[];
  
  // Metadata
  recomendado: boolean;
  etapaSugerida?: NegotiationStage[];
  tags: string[];
  
  // Tracking
  visualizacoes: number;
  usos: number;
  
  // Dates
  dataCriacao: Date;
  dataAtualizacao: Date;
  criadoPor: string;
  atualizadoPor: string;
}

export interface MaterialFilter {
  categoria?: MaterialCategory;
  tipo?: MaterialType;
  status?: MaterialStatus;
  publicoAlvo?: MaterialAudience;
  busca?: string;
  etapa?: NegotiationStage;
}
