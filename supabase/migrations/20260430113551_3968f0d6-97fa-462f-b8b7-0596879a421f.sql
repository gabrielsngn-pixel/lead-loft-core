-- Tabela para armazenar a configuração editável do guia "Papéis & Responsabilidades" por cargo
CREATE TABLE public.playbook_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_key TEXT NOT NULL UNIQUE,
  role_label TEXT NOT NULL,
  subtitle TEXT,
  mission TEXT,
  mission_highlight TEXT DEFAULT 'default',
  stages JSONB NOT NULL DEFAULT '[]'::jsonb,
  indicators JSONB NOT NULL DEFAULT '[]'::jsonb,
  risks JSONB NOT NULL DEFAULT '[]'::jsonb,
  mistakes JSONB NOT NULL DEFAULT '[]'::jsonb,
  behaviors JSONB NOT NULL DEFAULT '[]'::jsonb,
  guiding_quote TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  updated_by UUID,
  updated_by_nome TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.playbook_roles ENABLE ROW LEVEL SECURITY;

-- Visualização: todos os usuários aprovados
CREATE POLICY "Approved users can view playbook roles"
ON public.playbook_roles FOR SELECT
USING (is_approved(auth.uid()));

-- Edição: apenas Master e Gestor
CREATE POLICY "Gestors can insert playbook roles"
ON public.playbook_roles FOR INSERT
WITH CHECK (is_gestor(auth.uid()));

CREATE POLICY "Gestors can update playbook roles"
ON public.playbook_roles FOR UPDATE
USING (is_gestor(auth.uid()));

CREATE POLICY "Masters can delete playbook roles"
ON public.playbook_roles FOR DELETE
USING (is_master(auth.uid()));

-- Trigger de updated_at
CREATE TRIGGER playbook_roles_updated_at
BEFORE UPDATE ON public.playbook_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed inicial: Consultor de Incorporadoras com conteúdo sugerido
INSERT INTO public.playbook_roles (role_key, role_label, subtitle, mission, mission_highlight, stages, indicators, risks, mistakes, behaviors, guiding_quote, display_order) VALUES
('consultor_incorporadoras',
 'Consultor de Incorporadoras',
 'Guia operacional vivo do consultor responsável pelo relacionamento com incorporadoras',
 'Construir relacionamento estratégico com incorporadoras, identificar empreendimentos viáveis e conduzir negociações até o fechamento, garantindo recorrência e crescimento da carteira.',
 'primary',
 '[
   {"id":"s1","title":"Prospecção","cards":[{"id":"c1","title":"Mapeamento de incorporadoras","responsibilities":["Identificar incorporadoras ativas no mercado-alvo","Mapear empreendimentos em lançamento ou fase comercial","Validar fit estratégico com a Loft"],"indicators":"Nº de incorporadoras mapeadas / semana","notes":"Priorizar empreendimentos próximos ao habite-se"}]},
   {"id":"s2","title":"Qualificação","cards":[{"id":"c2","title":"Validação do decisor","responsibilities":["Confirmar contato com decisor (diretor comercial / sócio)","Validar interesse no modelo de repasse Loft","Coletar dados de VGV e ticket médio"],"indicators":"Taxa de qualificação > 40%","notes":"Lead sem decisor identificado não avança"}]},
   {"id":"s3","title":"Reunião & Diagnóstico","cards":[{"id":"c3","title":"Reunião de apresentação","responsibilities":["Conduzir reunião com base no SPO","Registrar ata no CRM","Solicitar viabilidade quando aplicável"],"indicators":"Reuniões realizadas vs agendadas","notes":"Toda reunião deve gerar próximo passo claro"}]},
   {"id":"s4","title":"Proposta & Negociação","cards":[{"id":"c4","title":"Apresentação da proposta","responsibilities":["Apresentar proposta com base na viabilidade aprovada","Negociar comissão e condições de repasse","Alinhar prazos e expectativas"],"indicators":"Tempo médio de negociação","notes":"Toda negociação > 30 dias deve ter plano de aceleração"}]},
   {"id":"s5","title":"Fechamento","cards":[{"id":"c5","title":"Assinatura de minuta","responsibilities":["Gerar minuta no módulo de Minutas","Conduzir assinatura digital","Garantir registro no CRM"],"indicators":"Taxa de fechamento sobre propostas enviadas","notes":"Minuta sem assinatura em 7 dias = follow-up obrigatório"}]},
   {"id":"s6","title":"Ativação","cards":[{"id":"c6","title":"Onboarding do empreendimento","responsibilities":["Repassar empreendimento para esteira de projetos","Alinhar kickoff com time de operações","Documentar particularidades comerciais"],"indicators":"Tempo de ativação pós-fechamento","notes":"Ativação > 15 dias compromete recorrência"}]},
   {"id":"s7","title":"Pós-venda / Geração de Resultado","cards":[{"id":"c7","title":"Acompanhamento de resultado","responsibilities":["Monitorar performance do empreendimento na esteira","Reportar resultados ao decisor da incorporadora","Identificar oportunidades de novos empreendimentos"],"indicators":"VGV gerado por incorporadora ativa","notes":"Cliente sem novo empreendimento em 90 dias = risco de churn"}]}
 ]'::jsonb,
 '[
   {"id":"i1","name":"Empreendimentos fechados / mês","formula":"COUNT(empreendimentos com status=ativo)","goal":"3","frequency":"Mensal"},
   {"id":"i2","name":"VGV em pipeline","formula":"SUM(vgv_estimado WHERE etapa em negociação)","goal":"R$ 50M","frequency":"Semanal"},
   {"id":"i3","name":"Taxa de conversão proposta → fechamento","formula":"Fechadas / Propostas enviadas","goal":"30%","frequency":"Mensal"},
   {"id":"i4","name":"Reuniões com decisor / semana","formula":"COUNT(reuniões com decisor confirmado)","goal":"5","frequency":"Semanal"}
 ]'::jsonb,
 '[
   {"id":"r1","name":"Lead esfriando","condition":"Contato ativo sem interação > 7 dias","impact":"Alto — perda de momentum comercial","action":"Acionar follow-up imediato e registrar no CRM"},
   {"id":"r2","name":"Negociação travada","condition":"Negociação parada na mesma etapa > 21 dias","impact":"Médio — bloqueia pipeline","action":"Escalar para gestor e revisar proposta"},
   {"id":"r3","name":"Empreendimento sem decisor","condition":"Empreendimento mapeado sem decisor identificado","impact":"Alto — inviabiliza avanço","action":"Bloquear avanço até identificação do decisor"}
 ]'::jsonb,
 '[
   {"id":"m1","text":"Avançar lead sem ter falado com decisor"},
   {"id":"m2","text":"Enviar proposta sem viabilidade aprovada"},
   {"id":"m3","text":"Não registrar ata após reunião"},
   {"id":"m4","text":"Negociar comissão fora da política sem aprovação do gestor"},
   {"id":"m5","text":"Deixar contato ativo sem follow-up por mais de 1 semana"}
 ]'::jsonb,
 '[
   {"id":"b1","text":"Disciplina de CRM: registrar TODA interação"},
   {"id":"b2","text":"Postura consultiva: ouvir antes de propor"},
   {"id":"b3","text":"Foco em decisor: tempo é o ativo mais escasso"},
   {"id":"b4","text":"Transparência sobre viabilidade — nunca prometer o que não foi aprovado"},
   {"id":"b5","text":"Recorrência > Volume: cliente ativo é prioridade sobre prospecção"}
 ]'::jsonb,
 'Consultor de incorporadoras não vende serviço. Vende previsibilidade de resultado.',
 1
),
('inside_sales',
 'Inside Sales',
 'Guia operacional do time de Inside Sales — em construção',
 NULL, 'default', '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, NULL, 2
),
('supervisor',
 'Supervisor',
 'Guia operacional do Supervisor comercial — em construção',
 NULL, 'default', '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, NULL, 3
);