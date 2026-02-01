import { useMemo, useCallback } from "react";
import { UserRole } from "@/types/crm";
import { 
  leadFieldPermissions, 
  actionPermissions, 
  FieldPermission 
} from "@/types/permissions";
import { useAuth } from "@/hooks/useAuth";

export function usePermissions() {
  const { profile, isMaster, isGestor, isConsultor, isSDR } = useAuth();

  const currentUser = useMemo(() => {
    if (!profile) {
      return {
        id: "",
        nome: "",
        email: "",
        role: "sdr" as UserRole,
      };
    }
    return {
      id: profile.user_id,
      nome: profile.nome,
      email: profile.email,
      role: profile.role as UserRole,
    };
  }, [profile]);

  const canEditField = useCallback((fieldName: string): boolean => {
    // Master can edit everything
    if (isMaster) return true;
    
    const permission = leadFieldPermissions.find(p => p.field === fieldName);
    if (!permission) return false;
    return permission.editableBy.includes(currentUser.role);
  }, [currentUser.role, isMaster]);

  const getFieldPermission = useCallback((fieldName: string): FieldPermission | undefined => {
    return leadFieldPermissions.find(p => p.field === fieldName);
  }, []);

  const canPerformAction = useCallback((action: keyof typeof actionPermissions): boolean => {
    // Master can do everything
    if (isMaster) return true;
    
    return actionPermissions[action].includes(currentUser.role);
  }, [currentUser.role, isMaster]);

  const editableFields = useMemo(() => {
    if (isMaster) {
      return leadFieldPermissions.map(p => p.field);
    }
    return leadFieldPermissions
      .filter(p => p.editableBy.includes(currentUser.role))
      .map(p => p.field);
  }, [currentUser.role, isMaster]);

  const protectedFields = useMemo(() => {
    if (isMaster) return [];
    return leadFieldPermissions
      .filter(p => p.isProtected && !p.editableBy.includes(currentUser.role))
      .map(p => p.field);
  }, [currentUser.role, isMaster]);

  return {
    currentUser,
    canEditField,
    getFieldPermission,
    canPerformAction,
    isGestor,
    isConsultor,
    isSDR,
    isMaster,
    editableFields,
    protectedFields,
  };
}
