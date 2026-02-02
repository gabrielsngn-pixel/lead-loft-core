export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      access_requests: {
        Row: {
          created_at: string
          email: string
          id: string
          justificativa: string | null
          nome: string
          requested_role: Database["public"]["Enums"]["user_role"]
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          justificativa?: string | null
          nome: string
          requested_role?: Database["public"]["Enums"]["user_role"]
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          justificativa?: string | null
          nome?: string
          requested_role?: Database["public"]["Enums"]["user_role"]
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      activities: {
        Row: {
          categoria: string
          comentario: string | null
          concluida: boolean
          created_at: string
          criado_por: string
          criado_por_nome: string
          data_agendada: string
          data_conclusao: string | null
          descricao: string | null
          id: string
          lead_id: string | null
          negociacao_id: string | null
          responsavel_id: string | null
          responsavel_nome: string | null
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          categoria: string
          comentario?: string | null
          concluida?: boolean
          created_at?: string
          criado_por: string
          criado_por_nome: string
          data_agendada: string
          data_conclusao?: string | null
          descricao?: string | null
          id?: string
          lead_id?: string | null
          negociacao_id?: string | null
          responsavel_id?: string | null
          responsavel_nome?: string | null
          tipo: string
          titulo: string
          updated_at?: string
        }
        Update: {
          categoria?: string
          comentario?: string | null
          concluida?: boolean
          created_at?: string
          criado_por?: string
          criado_por_nome?: string
          data_agendada?: string
          data_conclusao?: string | null
          descricao?: string | null
          id?: string
          lead_id?: string | null
          negociacao_id?: string | null
          responsavel_id?: string | null
          responsavel_nome?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_negociacao_id_fkey"
            columns: ["negociacao_id"]
            isOneToOne: false
            referencedRelation: "negotiations"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_action_logs: {
        Row: {
          action_type: string
          admin_name: string
          admin_user_id: string
          created_at: string
          details: Json | null
          id: string
          target_user_email: string | null
          target_user_id: string | null
        }
        Insert: {
          action_type: string
          admin_name: string
          admin_user_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user_email?: string | null
          target_user_id?: string | null
        }
        Update: {
          action_type?: string
          admin_name?: string
          admin_user_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user_email?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          atualizado_por: string | null
          atualizado_por_nome: string | null
          cidade: string
          cnpj: string
          created_at: string
          criado_por: string
          criado_por_nome: string
          data_criacao: string
          data_ultima_interacao: string
          email: string
          estado: string
          id: string
          nome_contato: string | null
          nome_fantasia: string | null
          observacoes: string | null
          origem: string
          prioridade: string
          proxima_atividade: string | null
          proxima_reuniao: string | null
          razao_social: string
          responsavel_id: string | null
          responsavel_nome: string | null
          status: string
          telefone: string
          tipo_empresa: string
          updated_at: string
        }
        Insert: {
          atualizado_por?: string | null
          atualizado_por_nome?: string | null
          cidade: string
          cnpj: string
          created_at?: string
          criado_por: string
          criado_por_nome: string
          data_criacao?: string
          data_ultima_interacao?: string
          email: string
          estado: string
          id?: string
          nome_contato?: string | null
          nome_fantasia?: string | null
          observacoes?: string | null
          origem?: string
          prioridade?: string
          proxima_atividade?: string | null
          proxima_reuniao?: string | null
          razao_social: string
          responsavel_id?: string | null
          responsavel_nome?: string | null
          status?: string
          telefone: string
          tipo_empresa?: string
          updated_at?: string
        }
        Update: {
          atualizado_por?: string | null
          atualizado_por_nome?: string | null
          cidade?: string
          cnpj?: string
          created_at?: string
          criado_por?: string
          criado_por_nome?: string
          data_criacao?: string
          data_ultima_interacao?: string
          email?: string
          estado?: string
          id?: string
          nome_contato?: string | null
          nome_fantasia?: string | null
          observacoes?: string | null
          origem?: string
          prioridade?: string
          proxima_atividade?: string | null
          proxima_reuniao?: string | null
          razao_social?: string
          responsavel_id?: string | null
          responsavel_nome?: string | null
          status?: string
          telefone?: string
          tipo_empresa?: string
          updated_at?: string
        }
        Relationships: []
      }
      material_usages: {
        Row: {
          contexto: string | null
          created_at: string
          id: string
          lead_id: string | null
          lead_name: string | null
          material_id: string
          negociacao_id: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          contexto?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          lead_name?: string | null
          material_id: string
          negociacao_id?: string | null
          user_id: string
          user_name: string
        }
        Update: {
          contexto?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          lead_name?: string | null
          material_id?: string
          negociacao_id?: string | null
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_usages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_usages_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_usages_negociacao_id_fkey"
            columns: ["negociacao_id"]
            isOneToOne: false
            referencedRelation: "negotiations"
            referencedColumns: ["id"]
          },
        ]
      }
      material_versions: {
        Row: {
          autor: string
          created_at: string
          descricao: string | null
          id: string
          material_id: string
          versao: string
        }
        Insert: {
          autor: string
          created_at?: string
          descricao?: string | null
          id?: string
          material_id: string
          versao: string
        }
        Update: {
          autor?: string
          created_at?: string
          descricao?: string | null
          id?: string
          material_id?: string
          versao?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_versions_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          arquivo_nome: string | null
          arquivo_tamanho: number | null
          atualizado_por: string | null
          atualizado_por_nome: string | null
          categoria: string
          created_at: string
          criado_por: string
          criado_por_nome: string
          descricao: string | null
          etapa_sugerida: string[] | null
          id: string
          publico_alvo: string
          recomendado: boolean
          status: string
          tags: string[] | null
          tipo: string
          titulo: string
          updated_at: string
          url: string | null
          usos: number
          versao: string
          visualizacoes: number
        }
        Insert: {
          arquivo_nome?: string | null
          arquivo_tamanho?: number | null
          atualizado_por?: string | null
          atualizado_por_nome?: string | null
          categoria: string
          created_at?: string
          criado_por: string
          criado_por_nome: string
          descricao?: string | null
          etapa_sugerida?: string[] | null
          id?: string
          publico_alvo?: string
          recomendado?: boolean
          status?: string
          tags?: string[] | null
          tipo: string
          titulo: string
          updated_at?: string
          url?: string | null
          usos?: number
          versao?: string
          visualizacoes?: number
        }
        Update: {
          arquivo_nome?: string | null
          arquivo_tamanho?: number | null
          atualizado_por?: string | null
          atualizado_por_nome?: string | null
          categoria?: string
          created_at?: string
          criado_por?: string
          criado_por_nome?: string
          descricao?: string | null
          etapa_sugerida?: string[] | null
          id?: string
          publico_alvo?: string
          recomendado?: boolean
          status?: string
          tags?: string[] | null
          tipo?: string
          titulo?: string
          updated_at?: string
          url?: string | null
          usos?: number
          versao?: string
          visualizacoes?: number
        }
        Relationships: []
      }
      meeting_history: {
        Row: {
          campo: string
          created_at: string
          id: string
          meeting_id: string
          usuario_id: string
          usuario_nome: string
          valor_anterior: string | null
          valor_novo: string | null
        }
        Insert: {
          campo: string
          created_at?: string
          id?: string
          meeting_id: string
          usuario_id: string
          usuario_nome: string
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Update: {
          campo?: string
          created_at?: string
          id?: string
          meeting_id?: string
          usuario_id?: string
          usuario_nome?: string
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_history_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          arquivada: boolean
          atualizado_por: string | null
          atualizado_por_nome: string | null
          cnpj: string
          consultor_id: string | null
          consultor_nome: string
          created_at: string
          criado_por: string
          criado_por_nome: string
          data_reuniao: string
          decisoes: string | null
          discussao: string | null
          empresa: string
          hora_fim: string | null
          hora_inicio: string | null
          id: string
          lead_id: string | null
          negociacao_id: string | null
          objetivos: string | null
          observacoes: string | null
          participantes: string[] | null
          pauta: string | null
          proximos_passos: string | null
          status: string
          tipo_reuniao: string
          updated_at: string
          vinculada_contato: boolean
        }
        Insert: {
          arquivada?: boolean
          atualizado_por?: string | null
          atualizado_por_nome?: string | null
          cnpj: string
          consultor_id?: string | null
          consultor_nome: string
          created_at?: string
          criado_por: string
          criado_por_nome: string
          data_reuniao: string
          decisoes?: string | null
          discussao?: string | null
          empresa: string
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          lead_id?: string | null
          negociacao_id?: string | null
          objetivos?: string | null
          observacoes?: string | null
          participantes?: string[] | null
          pauta?: string | null
          proximos_passos?: string | null
          status?: string
          tipo_reuniao?: string
          updated_at?: string
          vinculada_contato?: boolean
        }
        Update: {
          arquivada?: boolean
          atualizado_por?: string | null
          atualizado_por_nome?: string | null
          cnpj?: string
          consultor_id?: string | null
          consultor_nome?: string
          created_at?: string
          criado_por?: string
          criado_por_nome?: string
          data_reuniao?: string
          decisoes?: string | null
          discussao?: string | null
          empresa?: string
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          lead_id?: string | null
          negociacao_id?: string | null
          objetivos?: string | null
          observacoes?: string | null
          participantes?: string[] | null
          pauta?: string | null
          proximos_passos?: string | null
          status?: string
          tipo_reuniao?: string
          updated_at?: string
          vinculada_contato?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "meetings_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_negociacao_id_fkey"
            columns: ["negociacao_id"]
            isOneToOne: false
            referencedRelation: "negotiations"
            referencedColumns: ["id"]
          },
        ]
      }
      negotiations: {
        Row: {
          atualizado_por: string | null
          atualizado_por_nome: string | null
          comissao_bancaria_ponderada: number | null
          comissao_incorporador: number | null
          created_at: string
          criado_por: string
          criado_por_nome: string
          data_previsao_fechamento: string | null
          despesas_operacionais: number | null
          etapa: string
          id: string
          lead_id: string
          margem_estimada: number | null
          probabilidade: number
          receita_registro_loft_percent: number | null
          registro_tipo: string | null
          registro_valor: number | null
          ticket_medio: number | null
          titulo: string
          unidades: number | null
          updated_at: string
          valor: number
          vgv_total: number | null
          viabilidade_id: string | null
        }
        Insert: {
          atualizado_por?: string | null
          atualizado_por_nome?: string | null
          comissao_bancaria_ponderada?: number | null
          comissao_incorporador?: number | null
          created_at?: string
          criado_por: string
          criado_por_nome: string
          data_previsao_fechamento?: string | null
          despesas_operacionais?: number | null
          etapa?: string
          id?: string
          lead_id: string
          margem_estimada?: number | null
          probabilidade?: number
          receita_registro_loft_percent?: number | null
          registro_tipo?: string | null
          registro_valor?: number | null
          ticket_medio?: number | null
          titulo: string
          unidades?: number | null
          updated_at?: string
          valor?: number
          vgv_total?: number | null
          viabilidade_id?: string | null
        }
        Update: {
          atualizado_por?: string | null
          atualizado_por_nome?: string | null
          comissao_bancaria_ponderada?: number | null
          comissao_incorporador?: number | null
          created_at?: string
          criado_por?: string
          criado_por_nome?: string
          data_previsao_fechamento?: string | null
          despesas_operacionais?: number | null
          etapa?: string
          id?: string
          lead_id?: string
          margem_estimada?: number | null
          probabilidade?: number
          receita_registro_loft_percent?: number | null
          registro_tipo?: string | null
          registro_valor?: number | null
          ticket_medio?: number | null
          titulo?: string
          unidades?: number | null
          updated_at?: string
          valor?: number
          vgv_total?: number | null
          viabilidade_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "negotiations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negotiations_viabilidade_id_fkey"
            columns: ["viabilidade_id"]
            isOneToOne: false
            referencedRelation: "viabilidades"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          nome: string
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          created_at?: string
          email: string
          id?: string
          nome: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          nome?: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      repository_documents: {
        Row: {
          arquivo_nome: string | null
          arquivo_tamanho: number | null
          arquivo_url: string | null
          atualizado_por: string | null
          atualizado_por_nome: string | null
          contato_id: string | null
          created_at: string
          criado_por: string
          criado_por_nome: string
          descricao: string | null
          id: string
          lead_id: string | null
          negocio_id: string | null
          status: string
          tags: string[] | null
          tipo: string
          titulo: string
          updated_at: string
          versao: string
          versao_anterior_id: string | null
        }
        Insert: {
          arquivo_nome?: string | null
          arquivo_tamanho?: number | null
          arquivo_url?: string | null
          atualizado_por?: string | null
          atualizado_por_nome?: string | null
          contato_id?: string | null
          created_at?: string
          criado_por: string
          criado_por_nome: string
          descricao?: string | null
          id?: string
          lead_id?: string | null
          negocio_id?: string | null
          status?: string
          tags?: string[] | null
          tipo: string
          titulo: string
          updated_at?: string
          versao?: string
          versao_anterior_id?: string | null
        }
        Update: {
          arquivo_nome?: string | null
          arquivo_tamanho?: number | null
          arquivo_url?: string | null
          atualizado_por?: string | null
          atualizado_por_nome?: string | null
          contato_id?: string | null
          created_at?: string
          criado_por?: string
          criado_por_nome?: string
          descricao?: string | null
          id?: string
          lead_id?: string | null
          negocio_id?: string | null
          status?: string
          tags?: string[] | null
          tipo?: string
          titulo?: string
          updated_at?: string
          versao?: string
          versao_anterior_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "repository_documents_versao_anterior_id_fkey"
            columns: ["versao_anterior_id"]
            isOneToOne: false
            referencedRelation: "repository_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      viabilidades: {
        Row: {
          analisado_por: string | null
          analisado_por_nome: string | null
          cidade: string | null
          cnpj: string | null
          comissao_incorporador: number | null
          contato_id: string | null
          created_at: string
          custo_obra: number | null
          custo_terreno: number | null
          data_analise: string | null
          data_habitese: string | null
          data_solicitacao: string
          documento_id: string | null
          empresa_id: string | null
          empresa_nome: string | null
          endereco: string | null
          estado: string | null
          id: string
          lead_id: string | null
          margem_estimada: number | null
          negocio_id: string | null
          nome_empreendimento: string
          observacoes: string | null
          payback_meses: number | null
          projeto_atrasado: boolean | null
          recomendacao: string | null
          resultado: string | null
          simulation_data: Json | null
          solicitado_por: string
          solicitado_por_nome: string
          status: string
          tir_estimada: number | null
          updated_at: string
          vgv_estimado: number | null
          viability_compass_id: string | null
        }
        Insert: {
          analisado_por?: string | null
          analisado_por_nome?: string | null
          cidade?: string | null
          cnpj?: string | null
          comissao_incorporador?: number | null
          contato_id?: string | null
          created_at?: string
          custo_obra?: number | null
          custo_terreno?: number | null
          data_analise?: string | null
          data_habitese?: string | null
          data_solicitacao?: string
          documento_id?: string | null
          empresa_id?: string | null
          empresa_nome?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          lead_id?: string | null
          margem_estimada?: number | null
          negocio_id?: string | null
          nome_empreendimento: string
          observacoes?: string | null
          payback_meses?: number | null
          projeto_atrasado?: boolean | null
          recomendacao?: string | null
          resultado?: string | null
          simulation_data?: Json | null
          solicitado_por: string
          solicitado_por_nome: string
          status?: string
          tir_estimada?: number | null
          updated_at?: string
          vgv_estimado?: number | null
          viability_compass_id?: string | null
        }
        Update: {
          analisado_por?: string | null
          analisado_por_nome?: string | null
          cidade?: string | null
          cnpj?: string | null
          comissao_incorporador?: number | null
          contato_id?: string | null
          created_at?: string
          custo_obra?: number | null
          custo_terreno?: number | null
          data_analise?: string | null
          data_habitese?: string | null
          data_solicitacao?: string
          documento_id?: string | null
          empresa_id?: string | null
          empresa_nome?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          lead_id?: string | null
          margem_estimada?: number | null
          negocio_id?: string | null
          nome_empreendimento?: string
          observacoes?: string | null
          payback_meses?: number | null
          projeto_atrasado?: boolean | null
          recomendacao?: string | null
          resultado?: string | null
          simulation_data?: Json | null
          solicitado_por?: string
          solicitado_por_nome?: string
          status?: string
          tir_estimada?: number | null
          updated_at?: string
          vgv_estimado?: number | null
          viability_compass_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "viabilidades_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "repository_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viabilidades_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { check_user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_approved: { Args: { check_user_id: string }; Returns: boolean }
      is_gestor: { Args: { check_user_id: string }; Returns: boolean }
      is_master: { Args: { check_user_id: string }; Returns: boolean }
    }
    Enums: {
      user_role: "pending" | "sdr" | "consultor" | "gestor" | "master"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["pending", "sdr", "consultor", "gestor", "master"],
    },
  },
} as const
