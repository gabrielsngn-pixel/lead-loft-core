export type ProspectStatus = 
  | "novo" 
  | "em_contato" 
  | "reuniao_agendada" 
  | "reuniao_realizada" 
  | "qualificado" 
  | "descartado" 
  | "convertido";

export type ProspectActivityType = 
  | "ligacao" 
  | "email" 
  | "whatsapp" 
  | "reuniao" 
  | "upload_ata";

export interface Prospect {
  id: string;
  nomeCompleto: string;
  cargo: string;
  empresa: string;
  email: string;
  telefone?: string;
  linkedinUrl: string;
  origem: string;
  status: ProspectStatus;
  dataImportacao: Date;
  consultorResponsavelId?: string;
  consultorResponsavelNome?: string;
  convertidoEm?: Date;
  contatoAtivoId?: string;
  observacoes?: string;
  criadoPor: string;
  criadoPorNome: string;
  atualizadoPor?: string;
  atualizadoPorNome?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProspectActivity {
  id: string;
  prospectId: string;
  tipo: ProspectActivityType;
  titulo: string;
  descricao?: string;
  dataAtividade: Date;
  arquivoUrl?: string;
  arquivoNome?: string;
  responsavelId: string;
  responsavelNome: string;
  createdAt: Date;
}

export interface ProspectImportLog {
  id: string;
  userId: string;
  userNome: string;
  quantidade: number;
  registrosImportados: number;
  registrosIgnorados: number;
  motivosIgnorados?: Record<string, string>;
  createdAt: Date;
}

export interface ProspectCSVRow {
  nome_completo: string;
  cargo: string;
  empresa: string;
  email: string;
  telefone?: string;
  linkedin_url: string;
}

export const PROSPECT_STATUS_CONFIG: Record<ProspectStatus, { label: string; color: string }> = {
  novo: { label: "Novo", color: "bg-blue-500" },
  em_contato: { label: "Em Contato", color: "bg-yellow-500" },
  reuniao_agendada: { label: "Reunião Agendada", color: "bg-purple-500" },
  reuniao_realizada: { label: "Reunião Realizada", color: "bg-indigo-500" },
  qualificado: { label: "Qualificado", color: "bg-green-500" },
  descartado: { label: "Descartado", color: "bg-gray-500" },
  convertido: { label: "Convertido em Contato", color: "bg-emerald-600" },
};

export const PROSPECT_ACTIVITY_TYPE_CONFIG: Record<ProspectActivityType, { label: string; icon: string }> = {
  ligacao: { label: "Ligação", icon: "Phone" },
  email: { label: "Email", icon: "Mail" },
  whatsapp: { label: "WhatsApp", icon: "MessageCircle" },
  reuniao: { label: "Reunião", icon: "Calendar" },
  upload_ata: { label: "Upload de Ata", icon: "FileText" },
};
