import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// Templates
export function useMessageTemplates() {
  return useQuery({
    queryKey: ["message_templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("message_templates" as any)
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  const { user, profile } = useAuth();
  return useMutation({
    mutationFn: async (template: { name: string; channel: string; subject?: string; body: string }) => {
      const { error } = await supabase.from("message_templates" as any).insert({
        ...template,
        created_by: user!.id,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["message_templates"] });
      toast.success("Template criado com sucesso");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; subject?: string; body?: string }) => {
      const { error } = await supabase
        .from("message_templates" as any)
        .update({ ...data, updated_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["message_templates"] });
      toast.success("Template atualizado");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("message_templates" as any)
        .update({ is_active: false, updated_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["message_templates"] });
      toast.success("Template removido");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// Message Logs
export function useMessageLogs(filters?: { channel?: string; status?: string }) {
  return useQuery({
    queryKey: ["message_logs", filters],
    queryFn: async () => {
      let query = supabase
        .from("message_logs" as any)
        .select("*")
        .order("sent_at", { ascending: false })
        .limit(200);
      if (filters?.channel) query = query.eq("channel", filters.channel);
      if (filters?.status) query = query.eq("status", filters.status);
      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
  });
}

// Bulk Dispatch
export function useBulkDispatchLogs() {
  return useQuery({
    queryKey: ["bulk_dispatch_logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bulk_dispatch_logs" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as any[];
    },
  });
}

// Send email
export async function sendEmail(params: {
  to: string;
  subject: string;
  body: string;
  lead_id?: string;
  template_id?: string;
  bulk_dispatch_id?: string;
}) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) throw new Error("Not authenticated");

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    }
  );

  const result = await response.json();
  if (!result.success) throw new Error(result.error || "Failed to send email");
  return result;
}

// Email metrics
export function useEmailMetrics() {
  return useQuery({
    queryKey: ["email_metrics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("message_logs" as any)
        .select("status, user_id, sender_name, sent_at")
        .eq("channel", "email");
      if (error) throw error;
      const logs = data as any[];
      const today = new Date().toISOString().split("T")[0];
      return {
        total: logs.length,
        today: logs.filter((l: any) => l.sent_at?.startsWith(today)).length,
        sent: logs.filter((l: any) => l.status === "sent").length,
        delivered: logs.filter((l: any) => l.status === "delivered").length,
        read: logs.filter((l: any) => l.status === "read").length,
        failed: logs.filter((l: any) => l.status === "failed").length,
        openRate: logs.length > 0
          ? ((logs.filter((l: any) => l.status === "read").length / logs.length) * 100).toFixed(1)
          : "0",
        byUser: Object.values(
          logs.reduce((acc: any, l: any) => {
            const key = l.user_id;
            if (!acc[key]) acc[key] = { user_id: key, nome: l.sender_name || "N/A", sent: 0, read: 0 };
            acc[key].sent++;
            if (l.status === "read") acc[key].read++;
            return acc;
          }, {})
        ),
      };
    },
  });
}

// Resolve template variables
export function resolveTemplateVariables(body: string, lead: any): string {
  return body
    .replace(/\{\{nome\}\}/g, lead.nome_contato || lead.razao_social || "")
    .replace(/\{\{empresa\}\}/g, lead.razao_social || "")
    .replace(/\{\{cidade\}\}/g, lead.cidade || "")
    .replace(/\{\{estado\}\}/g, lead.estado || "");
}
