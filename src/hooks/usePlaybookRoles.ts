import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export interface PlaybookCard {
  id: string;
  title: string;
  responsibilities: string[];
  indicators?: string;
  notes?: string;
}

export interface PlaybookStage {
  id: string;
  title: string;
  cards: PlaybookCard[];
}

export interface PlaybookIndicator {
  id: string;
  name: string;
  formula?: string;
  goal?: string;
  frequency?: string;
}

export interface PlaybookRisk {
  id: string;
  name: string;
  condition?: string;
  impact?: string;
  action?: string;
}

export interface PlaybookSimpleItem {
  id: string;
  text: string;
}

export interface PlaybookRole {
  id: string;
  role_key: string;
  role_label: string;
  subtitle: string | null;
  mission: string | null;
  mission_highlight: string;
  stages: PlaybookStage[];
  indicators: PlaybookIndicator[];
  risks: PlaybookRisk[];
  mistakes: PlaybookSimpleItem[];
  behaviors: PlaybookSimpleItem[];
  guiding_quote: string | null;
  display_order: number;
  updated_by_nome: string | null;
  updated_at: string;
}

export function usePlaybookRoles() {
  const qc = useQueryClient();
  const { profile } = useAuth();

  const query = useQuery({
    queryKey: ["playbook_roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("playbook_roles" as any)
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data as any[]).map((r) => ({
        ...r,
        stages: Array.isArray(r.stages) ? r.stages : [],
        indicators: Array.isArray(r.indicators) ? r.indicators : [],
        risks: Array.isArray(r.risks) ? r.risks : [],
        mistakes: Array.isArray(r.mistakes) ? r.mistakes : [],
        behaviors: Array.isArray(r.behaviors) ? r.behaviors : [],
      })) as PlaybookRole[];
    },
  });

  const updateRole = useMutation({
    mutationFn: async (role: Partial<PlaybookRole> & { id: string }) => {
      const { id, ...rest } = role;
      const payload: any = {
        ...rest,
        updated_by: profile?.user_id ?? null,
        updated_by_nome: profile?.nome ?? null,
      };
      const { error } = await supabase
        .from("playbook_roles" as any)
        .update(payload)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["playbook_roles"] });
    },
    onError: (e: any) => {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    },
  });

  return { ...query, updateRole };
}
