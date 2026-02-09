import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  Prospect, 
  ProspectActivity, 
  ProspectStatus, 
  ProspectCSVRow,
  ProspectActivityType 
} from "@/types/prospects";

interface ProspectRow {
  id: string;
  nome_completo: string;
  cargo: string;
  empresa: string;
  email: string;
  telefone: string | null;
  linkedin_url: string;
  origem: string;
  status: string;
  data_importacao: string;
  consultor_responsavel_id: string | null;
  consultor_responsavel_nome: string | null;
  convertido_em: string | null;
  contato_ativo_id: string | null;
  observacoes: string | null;
  criado_por: string;
  criado_por_nome: string;
  atualizado_por: string | null;
  atualizado_por_nome: string | null;
  created_at: string;
  updated_at: string;
}

interface ProspectActivityRow {
  id: string;
  prospect_id: string;
  tipo: string;
  titulo: string;
  descricao: string | null;
  data_atividade: string;
  arquivo_url: string | null;
  arquivo_nome: string | null;
  responsavel_id: string;
  responsavel_nome: string;
  created_at: string;
}

function rowToProspect(row: ProspectRow): Prospect {
  return {
    id: row.id,
    nomeCompleto: row.nome_completo,
    cargo: row.cargo,
    empresa: row.empresa,
    email: row.email,
    telefone: row.telefone ?? undefined,
    linkedinUrl: row.linkedin_url,
    origem: row.origem,
    status: row.status as ProspectStatus,
    dataImportacao: new Date(row.data_importacao),
    consultorResponsavelId: row.consultor_responsavel_id ?? undefined,
    consultorResponsavelNome: row.consultor_responsavel_nome ?? undefined,
    convertidoEm: row.convertido_em ? new Date(row.convertido_em) : undefined,
    contatoAtivoId: row.contato_ativo_id ?? undefined,
    observacoes: row.observacoes ?? undefined,
    criadoPor: row.criado_por,
    criadoPorNome: row.criado_por_nome,
    atualizadoPor: row.atualizado_por ?? undefined,
    atualizadoPorNome: row.atualizado_por_nome ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function rowToActivity(row: ProspectActivityRow): ProspectActivity {
  return {
    id: row.id,
    prospectId: row.prospect_id,
    tipo: row.tipo as ProspectActivityType,
    titulo: row.titulo,
    descricao: row.descricao ?? undefined,
    dataAtividade: new Date(row.data_atividade),
    arquivoUrl: row.arquivo_url ?? undefined,
    arquivoNome: row.arquivo_nome ?? undefined,
    responsavelId: row.responsavel_id,
    responsavelNome: row.responsavel_nome,
    createdAt: new Date(row.created_at),
  };
}

export function useProspects() {
  const { profile, isMaster } = useAuth();
  const { toast } = useToast();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProspects = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("prospects")
      .select("*")
      .order("data_importacao", { ascending: false });

    if (error) {
      console.error("Erro ao buscar prospects:", error);
      toast({ title: "Erro ao carregar prospects", variant: "destructive" });
      setLoading(false);
      return;
    }
    setProspects((data as ProspectRow[]).map(rowToProspect));
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchProspects();
  }, [fetchProspects]);

  const checkImportLimit = async (): Promise<{ canImport: boolean; message?: string }> => {
    return { canImport: true };
  };

  const importProspects = async (rows: ProspectCSVRow[]): Promise<{
    imported: number;
    ignored: number;
    reasons: Record<string, string>;
  }> => {
    if (!profile || !isMaster) {
      throw new Error("Apenas usuários Master podem importar prospects");
    }

    if (rows.length > 25) {
      throw new Error("Máximo de 25 registros por importação");
    }

    // Get existing emails and linkedin URLs for deduplication
    const { data: existingProspects } = await supabase
      .from("prospects")
      .select("email, linkedin_url");

    const existingEmails = new Set((existingProspects || []).map(p => p.email.toLowerCase()));
    const existingLinkedins = new Set((existingProspects || []).map(p => p.linkedin_url.toLowerCase()));

    const toInsert: any[] = [];
    const reasons: Record<string, string> = {};

    for (const row of rows) {
      const email = row.email.trim().toLowerCase();
      const linkedin = row.linkedin_url.trim().toLowerCase();

      if (existingEmails.has(email)) {
        reasons[row.email] = "Email já cadastrado";
        continue;
      }

      if (existingLinkedins.has(linkedin)) {
        reasons[row.linkedin_url] = "LinkedIn já cadastrado";
        continue;
      }

      // Check within current batch
      if (toInsert.some(p => p.email.toLowerCase() === email)) {
        reasons[row.email] = "Email duplicado no arquivo";
        continue;
      }

      if (toInsert.some(p => p.linkedin_url.toLowerCase() === linkedin)) {
        reasons[row.linkedin_url] = "LinkedIn duplicado no arquivo";
        continue;
      }

      toInsert.push({
        nome_completo: row.nome_completo.trim(),
        cargo: row.cargo.trim(),
        empresa: row.empresa.trim(),
        email: row.email.trim(),
        telefone: row.telefone?.trim() || null,
        linkedin_url: row.linkedin_url.trim(),
        origem: "Apollo",
        status: "novo",
        criado_por: profile.user_id,
        criado_por_nome: profile.nome,
      });

      existingEmails.add(email);
      existingLinkedins.add(linkedin);
    }

    if (toInsert.length > 0) {
      const { error } = await supabase.from("prospects").insert(toInsert);
      if (error) {
        console.error("Erro ao inserir prospects:", error);
        throw error;
      }
    }

    // Log the import
    await supabase.from("prospect_import_logs").insert({
      user_id: profile.user_id,
      user_nome: profile.nome,
      quantidade: rows.length,
      registros_importados: toInsert.length,
      registros_ignorados: rows.length - toInsert.length,
      motivos_ignorados: Object.keys(reasons).length > 0 ? reasons : null,
    });

    await fetchProspects();

    return {
      imported: toInsert.length,
      ignored: rows.length - toInsert.length,
      reasons,
    };
  };

  const updateProspectStatus = async (id: string, status: ProspectStatus) => {
    if (!profile) throw new Error("Usuário não autenticado");

    const prospect = prospects.find(p => p.id === id);
    if (prospect?.status === "convertido") {
      throw new Error("Prospect já convertido não pode ser alterado");
    }

    const { error } = await supabase
      .from("prospects")
      .update({
        status,
        atualizado_por: profile.user_id,
        atualizado_por_nome: profile.nome,
      })
      .eq("id", id);

    if (error) {
      console.error("Erro ao atualizar status:", error);
      throw error;
    }

    setProspects(prev => 
      prev.map(p => p.id === id ? { ...p, status, updatedAt: new Date() } : p)
    );
  };

  const convertToContact = async (prospect: Prospect, companyData?: { razaoSocial: string; nomeFantasia: string; cnpj: string }): Promise<string> => {
    if (!profile) throw new Error("Usuário não autenticado");

    if (prospect.status === "convertido") {
      throw new Error("Prospect já foi convertido");
    }

    const empresa = companyData?.razaoSocial || prospect.empresa;
    const nomeFantasia = companyData?.nomeFantasia || prospect.empresa;
    const cnpj = companyData?.cnpj || "00.000.000/0000-00";

    // Create new contact in leads table (as Contato Ativo)
    const { data: newContact, error: contactError } = await supabase
      .from("leads")
      .insert({
        cnpj: cnpj,
        razao_social: empresa,
        nome_fantasia: nomeFantasia,
        nome_contato: prospect.nomeCompleto,
        email: prospect.email,
        telefone: prospect.telefone || "",
        cidade: "",
        estado: "",
        origem: "outbound",
        status: "qualificado",
        prioridade: "media",
        tipo_empresa: "incorporadora",
        responsavel_id: profile.user_id,
        responsavel_nome: profile.nome,
        observacoes: `Convertido de prospect. Cargo: ${prospect.cargo}. LinkedIn: ${prospect.linkedinUrl}`,
        linkedin: prospect.linkedinUrl,
        criado_por: profile.user_id,
        criado_por_nome: profile.nome,
      })
      .select()
      .single();

    if (contactError) {
      console.error("Erro ao criar contato:", contactError);
      throw contactError;
    }

    // Update prospect status to converted
    const { error: updateError } = await supabase
      .from("prospects")
      .update({
        status: "convertido",
        convertido_em: new Date().toISOString(),
        contato_ativo_id: newContact.id,
        consultor_responsavel_id: profile.user_id,
        consultor_responsavel_nome: profile.nome,
        atualizado_por: profile.user_id,
        atualizado_por_nome: profile.nome,
      })
      .eq("id", prospect.id);

    if (updateError) {
      console.error("Erro ao atualizar prospect:", updateError);
      throw updateError;
    }

    await fetchProspects();
    return newContact.id;
  };

  const deleteProspect = async (id: string) => {
    if (!isMaster) {
      throw new Error("Apenas usuários Master podem excluir prospects");
    }

    const prospect = prospects.find(p => p.id === id);
    if (prospect?.status === "convertido") {
      throw new Error("Prospect convertido não pode ser excluído");
    }

    const { error } = await supabase.from("prospects").delete().eq("id", id);
    if (error) {
      console.error("Erro ao excluir prospect:", error);
      throw error;
    }

    setProspects(prev => prev.filter(p => p.id !== id));
  };

  const addActivity = async (
    prospectId: string, 
    tipo: ProspectActivityType, 
    titulo: string, 
    descricao?: string,
    arquivoUrl?: string,
    arquivoNome?: string
  ): Promise<ProspectActivity> => {
    if (!profile) throw new Error("Usuário não autenticado");

    const prospect = prospects.find(p => p.id === prospectId);
    if (prospect?.status === "convertido") {
      throw new Error("Não é possível adicionar atividades a prospect convertido");
    }

    const { data, error } = await supabase
      .from("prospect_activities")
      .insert({
        prospect_id: prospectId,
        tipo,
        titulo,
        descricao: descricao || null,
        arquivo_url: arquivoUrl || null,
        arquivo_nome: arquivoNome || null,
        responsavel_id: profile.user_id,
        responsavel_nome: profile.nome,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao adicionar atividade:", error);
      throw error;
    }

    return rowToActivity(data as ProspectActivityRow);
  };

  const getProspectActivities = async (prospectId: string): Promise<ProspectActivity[]> => {
    const { data, error } = await supabase
      .from("prospect_activities")
      .select("*")
      .eq("prospect_id", prospectId)
      .order("data_atividade", { ascending: false });

    if (error) {
      console.error("Erro ao buscar atividades:", error);
      throw error;
    }

    return (data as ProspectActivityRow[]).map(rowToActivity);
  };

  // Assign prospect to a specific consultant and convert to Contato Ativo
  const assignProspect = async (
    prospect: Prospect,
    consultantId: string,
    consultantName: string,
    companyData?: { razaoSocial: string; nomeFantasia: string; cnpj: string }
  ) => {
    if (!profile) throw new Error("Usuário não autenticado");

    if (prospect.status === "convertido") {
      throw new Error("Prospect já convertido não pode ser alterado");
    }

    const empresa = companyData?.razaoSocial || prospect.empresa;
    const nomeFantasia = companyData?.nomeFantasia || prospect.empresa;
    const cnpj = companyData?.cnpj || "00.000.000/0000-00";

    // Create new contact in leads table (as Contato Ativo)
    const { data: newContact, error: contactError } = await supabase
      .from("leads")
      .insert({
        cnpj,
        razao_social: empresa,
        nome_fantasia: nomeFantasia,
        nome_contato: prospect.nomeCompleto,
        email: prospect.email,
        telefone: prospect.telefone || "",
        cidade: "",
        estado: "",
        origem: "outbound",
        status: "qualificado",
        prioridade: "media",
        tipo_empresa: "incorporadora",
        responsavel_id: consultantId,
        responsavel_nome: consultantName,
        observacoes: `Atribuído por ${profile.nome}. Cargo: ${prospect.cargo}. LinkedIn: ${prospect.linkedinUrl}`,
        linkedin: prospect.linkedinUrl,
        criado_por: profile.user_id,
        criado_por_nome: profile.nome,
      })
      .select()
      .single();

    if (contactError) {
      console.error("Erro ao criar contato:", contactError);
      throw contactError;
    }

    // Update prospect status to converted
    const { error: updateError } = await supabase
      .from("prospects")
      .update({
        status: "convertido",
        convertido_em: new Date().toISOString(),
        contato_ativo_id: newContact.id,
        consultor_responsavel_id: consultantId,
        consultor_responsavel_nome: consultantName,
        atualizado_por: profile.user_id,
        atualizado_por_nome: profile.nome,
      })
      .eq("id", prospect.id);

    if (updateError) {
      console.error("Erro ao atualizar prospect:", updateError);
      throw updateError;
    }

    await fetchProspects();
  };

  return { 
    prospects, 
    loading, 
    fetchProspects, 
    importProspects,
    checkImportLimit,
    updateProspectStatus, 
    convertToContact, 
    deleteProspect,
    addActivity,
    getProspectActivities,
    assignProspect,
  };
}
