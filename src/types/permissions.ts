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
export const leadFieldPermissions: FieldPermission[] = [
  // Contact fields - editable by all
  { field: "nomeContato", label: "Nome do Contato", editableBy: ["sdr", "consultor", "gestor"] },
  { field: "email", label: "Email", editableBy: ["sdr", "consultor", "gestor"] },
  { field: "telefone", label: "Telefone", editableBy: ["sdr", "consultor", "gestor"] },
  { field: "cidade", label: "Cidade", editableBy: ["sdr", "consultor", "gestor"] },
  { field: "estado", label: "Estado", editableBy: ["sdr", "consultor", "gestor"] },
  
  // Business fields - consultors and gestors only
  { field: "nomeFantasia", label: "Nome Fantasia", editableBy: ["consultor", "gestor"] },
  { field: "razaoSocial", label: "Razão Social", editableBy: ["consultor", "gestor"] },
  { field: "tipoEmpresa", label: "Tipo de Empresa", editableBy: ["consultor", "gestor"] },
  { field: "origem", label: "Origem", editableBy: ["consultor", "gestor"] },
  
  // Status and priority - consultors and gestors
  { field: "status", label: "Status", editableBy: ["consultor", "gestor"] },
  { field: "prioridade", label: "Prioridade", editableBy: ["consultor", "gestor"] },
  { field: "observacoes", label: "Observações", editableBy: ["sdr", "consultor", "gestor"] },
  
  // Dates - consultors and gestors
  { field: "proximaAtividade", label: "Próxima Atividade", editableBy: ["consultor", "gestor"] },
  { field: "proximaReuniao", label: "Próxima Reunião", editableBy: ["consultor", "gestor"] },
  
  // Values - gestors only for consolidated
  { field: "valorEstimado", label: "Valor Estimado", editableBy: ["consultor", "gestor"] },
  
  // Protected fields - gestor only
  { field: "cnpj", label: "CNPJ", editableBy: ["gestor"], isProtected: true },
  
  // Read-only fields
  { field: "id", label: "ID do Contato", editableBy: [], isProtected: true },
  { field: "dataCriacao", label: "Data de Criação", editableBy: [], isProtected: true },
  { field: "viabilidade", label: "Viabilidade Aprovada", editableBy: [], isProtected: true },
];

export const actionPermissions = {
  deleteContact: ["gestor"] as UserRole[],
  editCnpj: ["gestor"] as UserRole[],
  archiveMeeting: ["consultor", "gestor"] as UserRole[],
  createMeeting: ["consultor", "gestor"] as UserRole[],
  viewAllContacts: ["gestor"] as UserRole[],
  exportData: ["consultor", "gestor"] as UserRole[],
  importData: ["gestor"] as UserRole[],
};

export const roleLabels: Record<UserRole, string> = {
  sdr: "SDR",
  consultor: "Consultor",
  gestor: "Gestor",
};
