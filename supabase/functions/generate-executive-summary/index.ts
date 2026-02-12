import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { metrics } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Você é um analista de negócios sênior da Loft Incorporações. Seu trabalho é redigir parágrafos executivos concisos para relatórios semanais de performance comercial. O tom deve ser institucional, direto, objetivo, sem termos técnicos excessivos e sem mencionar IA. Escreva em português brasileiro. Nunca use bullet points, apenas parágrafos corridos.`;

    const userPrompt = `Com base nos dados abaixo, gere um relatório executivo semanal com exatamente 4 seções separadas por "---":

SEÇÃO 1 - RESUMO GERAL (2-3 frases):
Comentário sobre performance da semana, receita acumulada vs meta, ritmo comercial e qualidade do pipeline.

SEÇÃO 2 - PULSO COMERCIAL (2-3 frases):
Análise do volume de geração de oportunidades (crescimento/estabilidade/retração) e ritmo comercial.

SEÇÃO 3 - ESTEIRA DE PROJETOS (2-3 frases):
Pipeline ativo com potencial de VGV, distribuição por etapas, maturidade das oportunidades.

SEÇÃO 4 - CONTAS ESTRATÉGICAS (1-2 frases):
Avanço em contas estratégicas e previsibilidade do pipeline.

DADOS:
- Receita Operacional acumulada: R$ ${metrics.receitaAcumulada?.toLocaleString("pt-BR") || "0"}
- Meta anual VGV: R$ 1.000.000.000
- % atingimento VGV: ${metrics.vgvPercent?.toFixed(1) || "0"}%
- Unidades contratadas: ${metrics.totalUnidades || 0}
- Meta unidades: 2.500
- Prospects na base: ${metrics.totalProspects || 0}
- Novos prospects (7d): ${metrics.novosProspects || 0}
- Contatos ativos: ${metrics.totalContatos || 0}
- Reuniões realizadas (7d): ${metrics.reunioesRealizadas || 0}
- Reuniões agendadas: ${metrics.reunioesAgendadas || 0}
- Contratos fechados (semana): ${metrics.contratosFechados || 0}
- Valor pipeline ativo: R$ ${metrics.valorPipeline?.toLocaleString("pt-BR") || "0"}
- Projetos aprovados: ${metrics.totalProjetos || 0}
- VGV pipeline projetos: R$ ${metrics.vgvProjetos?.toLocaleString("pt-BR") || "0"}
- Negociações ativas: ${metrics.negociacoesAtivas || 0}
- Principais empresas contatadas: ${metrics.empresasContatadas || "N/A"}`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          stream: false,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Erro ao gerar resumo executivo" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Split by "---" into 4 sections
    const sections = content.split("---").map((s: string) => s.trim()).filter(Boolean);

    return new Response(
      JSON.stringify({
        resumoGeral: sections[0] || "",
        pulsoComercial: sections[1] || "",
        esteiraProjetos: sections[2] || "",
        contasEstrategicas: sections[3] || "",
        fullText: content,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-executive-summary error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
