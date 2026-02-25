import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export type FollowupType = "ligacao" | "whatsapp" | "sms" | "linkedin" | "email";

export interface ContactFollowup {
  id: string;
  lead_id: string;
  tipo: FollowupType;
  anotacoes: string | null;
  data_acao: string;
  criado_por: string;
  criado_por_nome: string;
  created_at: string;
  updated_at: string;
}

export const followupTypeLabels: Record<FollowupType, string> = {
  ligacao: "Ligação",
  whatsapp: "WhatsApp",
  sms: "SMS",
  linkedin: "LinkedIn",
  email: "E-mail",
};

export const followupTypeIcons: Record<FollowupType, string> = {
  ligacao: "📞",
  whatsapp: "💬",
  sms: "📱",
  linkedin: "🔗",
  email: "📧",
};

export function getFollowupColor(followups: ContactFollowup[]): "green" | "yellow" | "red" | "gray" {
  if (followups.length === 0) return "gray";
  
  const now = new Date();
  const latest = followups.reduce((a, b) => 
    new Date(a.data_acao) > new Date(b.data_acao) ? a : b
  );
  const diffMs = now.getTime() - new Date(latest.data_acao).getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  
  if (diffDays <= 5) return "green";
  if (diffDays <= 7) return "yellow";
  return "red";
}

export function useContactFollowups() {
  const [followups, setFollowups] = useState<ContactFollowup[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchFollowups = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("contact_followups")
        .select("*")
        .order("data_acao", { ascending: false });

      if (error) throw error;
      setFollowups((data || []) as ContactFollowup[]);
    } catch (err: any) {
      console.error("Error fetching followups:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFollowups();
  }, [fetchFollowups]);

  const createFollowup = async (leadId: string, tipo: FollowupType, anotacoes: string, dataAcao: string) => {
    if (!profile) return null;
    try {
      const { data, error } = await supabase
        .from("contact_followups")
        .insert({
          lead_id: leadId,
          tipo,
          anotacoes: anotacoes || null,
          data_acao: dataAcao,
          criado_por: profile.user_id,
          criado_por_nome: profile.nome,
        })
        .select()
        .single();

      if (error) throw error;
      const newFollowup = data as ContactFollowup;
      setFollowups((prev) => [newFollowup, ...prev]);
      toast({ title: "Follow-up registrado" });
      return newFollowup;
    } catch (err: any) {
      console.error("Error creating followup:", err);
      toast({ title: "Erro ao registrar follow-up", description: err.message, variant: "destructive" });
      return null;
    }
  };

  const updateFollowup = async (id: string, updates: { tipo?: FollowupType; anotacoes?: string; data_acao?: string }) => {
    try {
      const { data, error } = await supabase
        .from("contact_followups")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      const updated = data as ContactFollowup;
      setFollowups((prev) => prev.map((f) => (f.id === id ? updated : f)));
      toast({ title: "Follow-up atualizado" });
      return updated;
    } catch (err: any) {
      toast({ title: "Erro ao atualizar follow-up", description: err.message, variant: "destructive" });
      return null;
    }
  };

  const deleteFollowup = async (id: string) => {
    try {
      const { error } = await supabase.from("contact_followups").delete().eq("id", id);
      if (error) throw error;
      setFollowups((prev) => prev.filter((f) => f.id !== id));
      toast({ title: "Follow-up excluído" });
      return true;
    } catch (err: any) {
      toast({ title: "Erro ao excluir follow-up", description: err.message, variant: "destructive" });
      return false;
    }
  };

  const getFollowupsForLead = useCallback(
    (leadId: string) => followups.filter((f) => f.lead_id === leadId),
    [followups]
  );

  return {
    followups,
    loading,
    createFollowup,
    updateFollowup,
    deleteFollowup,
    getFollowupsForLead,
    refetch: fetchFollowups,
  };
}
