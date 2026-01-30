export type MeetingType = "apresentacao" | "negociacao" | "alinhamento" | "kickoff" | "revisao" | "outro";
export type MeetingStatus = "agendada" | "realizada" | "cancelada" | "reagendada";

export interface MeetingMinutes {
  id: string;
  leadId?: string;
  negociacaoId?: string;
  empresa: string;
  cnpj: string;
  tipoReuniao: MeetingType;
  dataReuniao: Date;
  horaInicio: string;
  horaFim?: string;
  consultorId: string;
  consultorNome: string;
  participantes: string[];
  objetivos: string;
  pauta: string;
  discussao: string;
  decisoes: string;
  proximosPassos: string;
  observacoes?: string;
  status: MeetingStatus;
  dataArmazenamento: Date;
  arquivada: boolean;
  historico: MeetingHistory[];
}

export interface MeetingHistory {
  id: string;
  ataId: string;
  campo: string;
  valorAnterior: string;
  valorNovo: string;
  usuarioId: string;
  usuarioNome: string;
  dataAlteracao: Date;
}

export interface MeetingRepository {
  id: string;
  empresa: string;
  cnpj: string;
  tipoReuniao: MeetingType;
  dataReuniao: Date;
  consultorResponsavel: string;
  status: MeetingStatus;
  ataId: string;
  dataArmazenamento: Date;
}

export const meetingTypeLabels: Record<MeetingType, string> = {
  apresentacao: "Apresentação",
  negociacao: "Negociação",
  alinhamento: "Alinhamento",
  kickoff: "Kick-off",
  revisao: "Revisão",
  outro: "Outro",
};

export const meetingStatusLabels: Record<MeetingStatus, string> = {
  agendada: "Agendada",
  realizada: "Realizada",
  cancelada: "Cancelada",
  reagendada: "Reagendada",
};
