import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface DbMaterial {
  id: string;
  titulo: string;
  descricao: string | null;
  categoria: "treinamento" | "prospeccao" | "institucional";
  tipo: "pdf" | "ppt" | "video" | "imagem" | "link" | "documento";
  status: "ativo" | "arquivado";
  publico_alvo: "sdr" | "consultor" | "gestor" | "todos";
  url: string | null;
  arquivo_nome: string | null;
  arquivo_tamanho: number | null;
  versao: string;
  recomendado: boolean;
  etapa_sugerida: string[] | null;
  tags: string[];
  visualizacoes: number;
  usos: number;
  criado_por: string;
  criado_por_nome: string;
  atualizado_por: string | null;
  atualizado_por_nome: string | null;
  created_at: string;
  updated_at: string;
}

export interface MaterialVersion {
  id: string;
  material_id: string;
  versao: string;
  autor: string;
  descricao: string | null;
  created_at: string;
}

export interface CreateMaterialInput {
  titulo: string;
  descricao?: string;
  categoria: "treinamento" | "prospeccao" | "institucional";
  tipo: "pdf" | "ppt" | "video" | "imagem" | "link" | "documento";
  publico_alvo?: "sdr" | "consultor" | "gestor" | "todos";
  url?: string;
  arquivo_nome?: string;
  arquivo_tamanho?: number;
  tags?: string[];
  recomendado?: boolean;
}

export function useMaterials() {
  const [materials, setMaterials] = useState<DbMaterial[]>([]);
  const [versions, setVersions] = useState<MaterialVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchMaterials = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("materials")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMaterials((data as DbMaterial[]) || []);
    } catch (error: any) {
      console.error("Error fetching materials:", error);
      toast({
        title: "Erro ao carregar materiais",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchVersions = useCallback(async (materialId: string) => {
    try {
      const { data, error } = await supabase
        .from("material_versions")
        .select("*")
        .eq("material_id", materialId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVersions((data as MaterialVersion[]) || []);
      return (data as MaterialVersion[]) || [];
    } catch (error: any) {
      console.error("Error fetching versions:", error);
      return [];
    }
  }, []);

  const createMaterial = useCallback(
    async (input: CreateMaterialInput) => {
      if (!profile) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para criar materiais.",
          variant: "destructive",
        });
        return null;
      }

      try {
        const newMaterial = {
          titulo: input.titulo,
          descricao: input.descricao || null,
          categoria: input.categoria,
          tipo: input.tipo,
          publico_alvo: input.publico_alvo || "todos",
          url: input.url || null,
          arquivo_nome: input.arquivo_nome || null,
          arquivo_tamanho: input.arquivo_tamanho || null,
          tags: input.tags || [],
          recomendado: input.recomendado || false,
          criado_por: profile.user_id,
          criado_por_nome: profile.nome,
        };

        const { data, error } = await supabase
          .from("materials")
          .insert(newMaterial)
          .select()
          .single();

        if (error) throw error;

        // Create initial version
        await supabase.from("material_versions").insert({
          material_id: data.id,
          versao: "1.0",
          autor: profile.nome,
          descricao: "Versão inicial",
        });

        setMaterials((prev) => [data as DbMaterial, ...prev]);
        toast({
          title: "Material criado",
          description: `"${input.titulo}" foi adicionado à biblioteca.`,
        });
        return data as DbMaterial;
      } catch (error: any) {
        console.error("Error creating material:", error);
        toast({
          title: "Erro ao criar material",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }
    },
    [profile, toast]
  );

  const updateMaterial = useCallback(
    async (id: string, updates: Partial<DbMaterial>) => {
      if (!profile) return null;

      try {
        const { data, error } = await supabase
          .from("materials")
          .update({
            ...updates,
            atualizado_por: profile.user_id,
            atualizado_por_nome: profile.nome,
          })
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;

        setMaterials((prev) =>
          prev.map((m) => (m.id === id ? (data as DbMaterial) : m))
        );
        return data as DbMaterial;
      } catch (error: any) {
        console.error("Error updating material:", error);
        toast({
          title: "Erro ao atualizar material",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }
    },
    [profile, toast]
  );

  const deleteMaterial = useCallback(
    async (id: string) => {
      try {
        const material = materials.find((m) => m.id === id);
        const { error } = await supabase.from("materials").delete().eq("id", id);

        if (error) throw error;

        setMaterials((prev) => prev.filter((m) => m.id !== id));
        toast({
          title: "Material excluído",
          description: material
            ? `"${material.titulo}" foi removido da biblioteca.`
            : "Material removido.",
        });
        return true;
      } catch (error: any) {
        console.error("Error deleting material:", error);
        toast({
          title: "Erro ao excluir material",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }
    },
    [materials, toast]
  );

  const incrementViews = useCallback(async (id: string) => {
    try {
      const material = materials.find((m) => m.id === id);
      if (!material) return;

      await supabase
        .from("materials")
        .update({ visualizacoes: material.visualizacoes + 1 })
        .eq("id", id);

      setMaterials((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, visualizacoes: m.visualizacoes + 1 } : m
        )
      );
    } catch (error) {
      console.error("Error incrementing views:", error);
    }
  }, [materials]);

  const incrementUsage = useCallback(
    async (id: string, leadId?: string, leadName?: string, contexto?: string) => {
      if (!profile) return;

      try {
        const material = materials.find((m) => m.id === id);
        if (!material) return;

        // Update usage count
        await supabase
          .from("materials")
          .update({ usos: material.usos + 1 })
          .eq("id", id);

        // Record usage
        await supabase.from("material_usages").insert({
          material_id: id,
          user_id: profile.user_id,
          user_name: profile.nome,
          lead_id: leadId || null,
          lead_name: leadName || null,
          contexto: contexto || null,
        });

        setMaterials((prev) =>
          prev.map((m) => (m.id === id ? { ...m, usos: m.usos + 1 } : m))
        );
      } catch (error) {
        console.error("Error recording usage:", error);
      }
    },
    [materials, profile]
  );

  const toggleRecommended = useCallback(
    async (id: string) => {
      const material = materials.find((m) => m.id === id);
      if (!material) return;

      await updateMaterial(id, { recomendado: !material.recomendado });
      toast({
        title: material.recomendado ? "Destaque removido" : "Material destacado",
        description: `"${material.titulo}" ${
          material.recomendado ? "não é mais" : "agora é"
        } recomendado.`,
      });
    },
    [materials, updateMaterial, toast]
  );

  const archiveMaterial = useCallback(
    async (id: string) => {
      const material = materials.find((m) => m.id === id);
      if (!material) return;

      const newStatus = material.status === "ativo" ? "arquivado" : "ativo";
      await updateMaterial(id, { status: newStatus });
      toast({
        title: newStatus === "arquivado" ? "Material arquivado" : "Material restaurado",
        description: `"${material.titulo}" foi ${
          newStatus === "arquivado" ? "arquivado" : "restaurado"
        }.`,
      });
    },
    [materials, updateMaterial, toast]
  );

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  return {
    materials,
    versions,
    loading,
    fetchMaterials,
    fetchVersions,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    incrementViews,
    incrementUsage,
    toggleRecommended,
    archiveMaterial,
  };
}
