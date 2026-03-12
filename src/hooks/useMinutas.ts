import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface Clausula {
  id: string;
  titulo: string;
  conteudo: string;
}

export interface Minuta {
  id: string;
  negotiation_id: string | null;
  viabilidade_id: string | null;
  nome_empreendimento: string;
  empresa_nome: string;
  cnpj: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  representante_legal: string | null;
  cpf_representante: string | null;
  nome_fantasia: string | null;
  dados_projeto: Record<string, unknown> | null;
  clausulas: Clausula[];
  numero_contrato: string;
  data_assinatura: string | null;
  criado_por: string;
  criado_por_nome: string;
  atualizado_por: string | null;
  atualizado_por_nome: string | null;
  created_at: string;
  updated_at: string;
}

// Default clauses from the contract template
export function getDefaultClausulas(hasRegistro: boolean): Clausula[] {
  const clausulas: Clausula[] = [
    {
      id: crypto.randomUUID(),
      titulo: "CLÁUSULA PRIMEIRA – DO OBJETO",
      conteudo: `1.1. O presente contrato tem como objeto a prestação, pela LOFT INTERMEDIADORA LTDA, dos serviços de:\n• Originação e acompanhamento de crédito imobiliário;\n• Assessoria no repasse bancário;\n• Assessoria para registro dos contratos de financiamento;\n• Monitoramento da jornada do comprador até a liberação dos recursos.\n\n1.2. Todos os serviços previstos neste contrato serão prestados sob responsabilidade exclusiva da LOFT, que responderá integralmente perante a INCORPORADORA pela sua execução.\n\n1.3. O presente contrato caracteriza-se como obrigação de meio, não de resultado. A LOFT compromete-se a empregar os melhores esforços para a conversão das oportunidades de repasse, sem garantia de volume, valor ou resultado financeiro mínimo.`,
    },
    {
      id: crypto.randomUUID(),
      titulo: "CLÁUSULA SEGUNDA – DO ESCOPO DOS SERVIÇOS",
      conteudo: `2.1. Dos Serviços de Crédito: A CONTRATADA executará: contato com clientes; análise de documentação; submissão às instituições financeiras; acompanhamento do processo.\n\n2.2. Dos Serviços de Repasse: Emissão de fichas cadastrais; análise jurídica; liberação de minuta; acompanhamento de assinatura.\n\n2.3. Dos Serviços de Registro: Providências junto à Prefeitura para ITBI; acompanhamento cartorário; entrega de via registrada.\n\n2.4. A CONTRATADA poderá operar com modalidade digital de assinatura e registro.`,
    },
    {
      id: crypto.randomUUID(),
      titulo: "CLÁUSULA TERCEIRA – DA CARTEIRA POTENCIAL E CONDIÇÕES COMERCIAIS",
      conteudo: `3.1. A CONTRATANTE obriga-se a disponibilizar à LOFT 100% (cem por cento) de sua carteira potencial de repasse, permitindo que a LOFT atue comercialmente junto aos clientes finais.\n\n3.2. Os valores da tabela de condições comerciais representam estimativas não vinculantes, baseadas na projeção da carteira potencial de repasse no momento da contratação.\n\n3.3. Fica expressamente consignado que a CONTRATANTE não possui obrigação de resultado quanto ao volume de unidades enviadas, valor potencial da carteira ou montante de repasses efetivamente realizados.\n\n3.4. A remuneração da CONTRATADA será proveniente das comissões bancárias decorrentes da intermediação efetivamente realizada.\n\n3.5. A LOFT é a única responsável pela coordenação, gestão e entrega dos serviços contratados.`,
    },
  ];

  if (hasRegistro) {
    clausulas.push({
      id: crypto.randomUUID(),
      titulo: "CLÁUSULA QUARTA – DA COBRANÇA E DO REPASSE DOS VALORES DE REGISTRO",
      conteudo: `4.1. A cobrança dos valores referentes aos serviços de registro será realizada diretamente pela INCORPORADORA junto ao cliente final.\n\n4.2. A responsabilidade pela cobrança, recebimento e repasse dos valores de registro à LOFT será exclusivamente da INCORPORADORA, limitando-se aos repasses efetivamente convertidos.\n\n4.3. A INCORPORADORA obriga-se a repassar à LOFT os valores correspondentes à receita de registro a cada processo de financiamento efetivamente concluído.\n\n4.4. A eventual inadimplência do cliente final não exime a INCORPORADORA da obrigação de pagamento à LOFT pelos serviços já prestados.\n\n4.5. O não repasse dos valores de registro pelos serviços efetivamente prestados caracterizará inadimplemento contratual.`,
    });
  }

  clausulas.push(
    {
      id: crypto.randomUUID(),
      titulo: `CLÁUSULA ${hasRegistro ? "QUINTA" : "QUARTA"} – DAS OBRIGAÇÕES DAS PARTES`,
      conteudo: `São obrigações da CONTRATADA: Executar os serviços com diligência e empregar os melhores esforços na conversão das oportunidades; manter a CONTRATANTE informada sobre o andamento dos processos; zelar pelo sigilo; cumprir normas aplicáveis.\n\nSão obrigações da CONTRATANTE: Disponibilizar 100% de sua carteira potencial de repasse; fornecer informações e documentos necessários; colaborar com o andamento; efetuar pagamentos pelos serviços efetivamente prestados; comunicar alterações relevantes.`,
    },
    {
      id: crypto.randomUUID(),
      titulo: `CLÁUSULA ${hasRegistro ? "SEXTA" : "QUINTA"} – DO PRAZO`,
      conteudo: `O contrato vigorará pelo prazo necessário à conclusão dos serviços, podendo ser rescindido com 30 dias de antecedência.\n\nA rescisão não prejudicará a remuneração por serviços já prestados.`,
    },
    {
      id: crypto.randomUUID(),
      titulo: `CLÁUSULA ${hasRegistro ? "SÉTIMA" : "SEXTA"} – DA CONFIDENCIALIDADE`,
      conteudo: `As partes comprometem-se a manter sigilo sobre informações comerciais, financeiras e estratégicas.`,
    },
    {
      id: crypto.randomUUID(),
      titulo: `CLÁUSULA ${hasRegistro ? "OITAVA" : "SÉTIMA"} – DAS DISPOSIÇÕES GERAIS`,
      conteudo: `Este contrato reflete as estimativas da carteira potencial de repasse aprovadas na simulação de viabilidade, sem caráter vinculante quanto a resultados.\n\nAlterações somente serão válidas se formalizadas por escrito.\n\nA tolerância não implicará novação ou renúncia.`,
    },
    {
      id: crypto.randomUUID(),
      titulo: `CLÁUSULA ${hasRegistro ? "NONA" : "OITAVA"} – DO FORO`,
      conteudo: `As partes elegem o foro da Comarca de São Paulo, Estado de São Paulo, para dirimir quaisquer controvérsias.`,
    }
  );

  return clausulas;
}

export function useMinutas() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: minutas = [], isLoading } = useQuery({
    queryKey: ["minutas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("minutas")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((m: Record<string, unknown>) => ({
        ...m,
        clausulas: (m.clausulas as Clausula[]) || [],
      })) as Minuta[];
    },
  });

  const createMinuta = useMutation({
    mutationFn: async (minuta: Omit<Minuta, "id" | "created_at" | "updated_at" | "atualizado_por" | "atualizado_por_nome">) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("minutas") as any)
        .insert({
          negotiation_id: minuta.negotiation_id,
          viabilidade_id: minuta.viabilidade_id,
          nome_empreendimento: minuta.nome_empreendimento,
          empresa_nome: minuta.empresa_nome,
          cnpj: minuta.cnpj,
          endereco: minuta.endereco,
          cidade: minuta.cidade,
          estado: minuta.estado,
          representante_legal: minuta.representante_legal,
          cpf_representante: minuta.cpf_representante,
          nome_fantasia: minuta.nome_fantasia,
          dados_projeto: minuta.dados_projeto,
          clausulas: minuta.clausulas,
          numero_contrato: minuta.numero_contrato,
          data_assinatura: minuta.data_assinatura,
          criado_por: minuta.criado_por,
          criado_por_nome: minuta.criado_por_nome,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["minutas"] });
      toast({ title: "Minuta criada com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao criar minuta", variant: "destructive" });
    },
  });

  const updateMinuta = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Minuta> & { id: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: Record<string, unknown> = {
        atualizado_por: profile?.user_id,
        atualizado_por_nome: profile?.nome,
        updated_at: new Date().toISOString(),
      };
      if (updates.clausulas !== undefined) payload.clausulas = updates.clausulas;
      if (updates.nome_empreendimento !== undefined) payload.nome_empreendimento = updates.nome_empreendimento;
      if (updates.empresa_nome !== undefined) payload.empresa_nome = updates.empresa_nome;
      if (updates.cnpj !== undefined) payload.cnpj = updates.cnpj;
      if (updates.endereco !== undefined) payload.endereco = updates.endereco;
      if (updates.cidade !== undefined) payload.cidade = updates.cidade;
      if (updates.estado !== undefined) payload.estado = updates.estado;
      if (updates.representante_legal !== undefined) payload.representante_legal = updates.representante_legal;
      if (updates.cpf_representante !== undefined) payload.cpf_representante = updates.cpf_representante;
      if (updates.nome_fantasia !== undefined) payload.nome_fantasia = updates.nome_fantasia;
      if (updates.dados_projeto !== undefined) payload.dados_projeto = updates.dados_projeto;

      const { error } = await (supabase.from("minutas") as any)
        .update(payload)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["minutas"] });
      toast({ title: "Minuta atualizada!" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar minuta", variant: "destructive" });
    },
  });

  const deleteMinuta = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("minutas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["minutas"] });
      toast({ title: "Minuta excluída!" });
    },
  });

  return { minutas, isLoading, createMinuta, updateMinuta, deleteMinuta };
}
