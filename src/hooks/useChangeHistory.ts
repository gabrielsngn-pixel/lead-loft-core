import { useState, useCallback } from "react";
import { ChangeLogEntry } from "@/types/permissions";
import { usePermissions } from "./usePermissions";

// Mock change history - in production this would be persisted
const mockChangeHistory: ChangeLogEntry[] = [
  {
    id: "ch1",
    entityType: "lead",
    entityId: "1",
    userId: "1",
    userName: "João Silva",
    userRole: "consultor",
    fieldName: "status",
    fieldLabel: "Status",
    oldValue: "novo",
    newValue: "qualificado",
    timestamp: new Date("2025-01-28T10:30:00"),
  },
  {
    id: "ch2",
    entityType: "lead",
    entityId: "1",
    userId: "1",
    userName: "João Silva",
    userRole: "consultor",
    fieldName: "prioridade",
    fieldLabel: "Prioridade",
    oldValue: "media",
    newValue: "alta",
    timestamp: new Date("2025-01-27T15:45:00"),
  },
  {
    id: "ch3",
    entityType: "lead",
    entityId: "2",
    userId: "2",
    userName: "Maria Santos",
    userRole: "consultor",
    fieldName: "valorEstimado",
    fieldLabel: "Valor Estimado",
    oldValue: "250000",
    newValue: "280000",
    timestamp: new Date("2025-01-26T09:15:00"),
  },
];

export function useChangeHistory(entityType: ChangeLogEntry["entityType"], entityId: string) {
  const { currentUser } = usePermissions();
  const [history, setHistory] = useState<ChangeLogEntry[]>(
    mockChangeHistory.filter(h => h.entityType === entityType && h.entityId === entityId)
  );

  const logChange = useCallback((
    fieldName: string,
    fieldLabel: string,
    oldValue: string | null,
    newValue: string | null
  ) => {
    const entry: ChangeLogEntry = {
      id: `ch-${Date.now()}`,
      entityType,
      entityId,
      userId: currentUser.id,
      userName: currentUser.nome,
      userRole: currentUser.role,
      fieldName,
      fieldLabel,
      oldValue,
      newValue,
      timestamp: new Date(),
    };

    setHistory(prev => [entry, ...prev]);
    
    // In production, this would persist to database
    console.log("Change logged:", entry);
    
    return entry;
  }, [entityType, entityId, currentUser]);

  const getFieldHistory = useCallback((fieldName: string) => {
    return history.filter(h => h.fieldName === fieldName);
  }, [history]);

  return {
    history,
    logChange,
    getFieldHistory,
  };
}
