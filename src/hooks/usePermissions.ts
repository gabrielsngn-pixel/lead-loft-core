import { useMemo, useCallback } from "react";
import { UserRole } from "@/types/crm";
import { 
  leadFieldPermissions, 
  actionPermissions, 
  FieldPermission 
} from "@/types/permissions";

// Simulated current user - in production this would come from auth context
const CURRENT_USER = {
  id: "1",
  nome: "João Silva",
  email: "joao.silva@loft.com.br",
  role: "consultor" as UserRole,
};

export function usePermissions() {
  const currentUser = CURRENT_USER;

  const canEditField = useCallback((fieldName: string): boolean => {
    const permission = leadFieldPermissions.find(p => p.field === fieldName);
    if (!permission) return false;
    return permission.editableBy.includes(currentUser.role);
  }, [currentUser.role]);

  const getFieldPermission = useCallback((fieldName: string): FieldPermission | undefined => {
    return leadFieldPermissions.find(p => p.field === fieldName);
  }, []);

  const canPerformAction = useCallback((action: keyof typeof actionPermissions): boolean => {
    return actionPermissions[action].includes(currentUser.role);
  }, [currentUser.role]);

  const isGestor = useMemo(() => currentUser.role === "gestor", [currentUser.role]);
  const isConsultor = useMemo(() => currentUser.role === "consultor", [currentUser.role]);
  const isSDR = useMemo(() => currentUser.role === "sdr", [currentUser.role]);

  const editableFields = useMemo(() => {
    return leadFieldPermissions
      .filter(p => p.editableBy.includes(currentUser.role))
      .map(p => p.field);
  }, [currentUser.role]);

  const protectedFields = useMemo(() => {
    return leadFieldPermissions
      .filter(p => p.isProtected && !p.editableBy.includes(currentUser.role))
      .map(p => p.field);
  }, [currentUser.role]);

  return {
    currentUser,
    canEditField,
    getFieldPermission,
    canPerformAction,
    isGestor,
    isConsultor,
    isSDR,
    editableFields,
    protectedFields,
  };
}
