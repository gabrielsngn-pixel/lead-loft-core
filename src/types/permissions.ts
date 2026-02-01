import { UserRole } from "./crm";

export interface ChangeLogEntry {
  id: string;
  entityType: "lead" | "contact" | "negotiation" | "activity" | "meeting";
  entityId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  fieldName: string;
  fieldLabel: string;
  oldValue: string | null;
  newValue: string | null;
  timestamp: Date;
}

export interface FieldPermission {
  field: string;
  label: string;
  editableBy: UserRole[];
  isProtected?: boolean;
  requiresApproval?: boolean;
}

// Define which fields can be edited by which roles
// Master tem acesso total a todos os campos
export const leadFieldPermissions: FieldPermission[] = [
  // Contact fields - editable by all
  { field: "nomeContato", label: "Nome do Contato", editableBy: ["sdr", "consultor", "gestor", "master"] },
  { field: "email", label: "Email", editableBy: ["sdr", "consultor", "gestor", "master"] },
  { field: "telefone", label: "Telefone", editableBy: ["sdr", "consultor", "gestor", "master"] },
  { field: "cidade", label: "Cidade", editableBy: ["sdr", "consultor", "gestor", "master"] },
  { field: "estado", label: "Estado", editableBy: ["sdr", "consultor", "gestor", "master"] },
  
  // Business fields - consultors, gestors and masters
  { field: "nomeFantasia", label: "Nome Fantasia", editableBy: ["consultor", "gestor", "master"] },
  { field: "razaoSocial", label: "Razão Social", editableBy: ["consultor", "gestor", "master"] },
  { field: "tipoEmpresa", label: "Tipo de Empresa", editableBy: ["consultor", "gestor", "master"] },
  { field: "origem", label: "Origem", editableBy: ["consultor", "gestor", "master"] },
  
  // Status and priority - consultors, gestors and masters
  { field: "status", label: "Status", editableBy: ["consultor", "gestor", "master"] },
  { field: "prioridade", label: "Prioridade", editableBy: ["consultor", "gestor", "master"] },
  { field: "observacoes", label: "Observações", editableBy: ["sdr", "consultor", "gestor", "master"] },
  
  // Dates - consultors, gestors and masters
  { field: "proximaAtividade", label: "Próxima Atividade", editableBy: ["consultor", "gestor", "master"] },
  { field: "proximaReuniao", label: "Próxima Reunião", editableBy: ["consultor", "gestor", "master"] },
  
  // Values - gestors and masters
  { field: "valorEstimado", label: "Valor Estimado", editableBy: ["consultor", "gestor", "master"] },
  
  // Protected fields - gestor and master
  { field: "cnpj", label: "CNPJ", editableBy: ["gestor", "master"], isProtected: true },
  
  // Read-only fields (except for master who can edit everything)
  { field: "id", label: "ID do Contato", editableBy: ["master"], isProtected: true },
  { field: "dataCriacao", label: "Data de Criação", editableBy: ["master"], isProtected: true },
  { field: "viabilidade", label: "Viabilidade Aprovada", editableBy: ["master"], isProtected: true },
];

// Master tem todas as permissões
export const actionPermissions = {
  deleteContact: ["gestor", "master"] as UserRole[],
  deleteLead: ["master"] as UserRole[], // Apenas master pode deletar leads
  editCnpj: ["gestor", "master"] as UserRole[],
  archiveMeeting: ["consultor", "gestor", "master"] as UserRole[],
  createMeeting: ["consultor", "gestor", "master"] as UserRole[],
  viewAllContacts: ["gestor", "master"] as UserRole[],
  exportData: ["consultor", "gestor", "master"] as UserRole[],
  importData: ["gestor", "master"] as UserRole[],
  manageUsers: ["gestor", "master"] as UserRole[],
  promoteMaster: ["master"] as UserRole[], // Apenas master pode promover outros masters
  deleteDocuments: ["master"] as UserRole[],
  deleteViabilidade: ["master"] as UserRole[],
  overrideRules: ["master"] as UserRole[],
};

export const roleLabels: Record<UserRole, string> = {
  sdr: "SDR",
  consultor: "Consultor",
  gestor: "Gestor",
  master: "Master",
};

export const roleDescriptions: Record<UserRole, string> = {
  sdr: "Prospecção e qualificação de leads",
  consultor: "Gestão de negociações e relacionamento",
  gestor: "Administração da equipe e relatórios",
  master: "Acesso total ao sistema sem restrições",
};
