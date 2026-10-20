
Passo 2 — Implemente somente o que é da Etapa 1:

Tabelas, permissões (RLS) e valores iniciais — seções 4.1 a 4.5.
Motor de cálculo — seção 6. Funções puras em TypeScript, numa pasta própria do módulo (ex.: src/features/viability/, ou o equivalente na organização que o CRM já usa), sem depender de React nem do banco. Inclua testes automatizados (Vitest) com os 3 casos da seção 9, tolerância de R$ 0,01 e 0,01 ponto percentual.
Tela de premissas /simulador/premissas, só para administrador — seção 7.3, incluindo o autoteste do motor.
Item Simulador de viabilidade no menu lateral, apontando para /simulador. Por enquanto /simulador mostra só um aviso "Em construção" e, para administrador, um botão "Premissas".
Não construa ainda a tela de simulação, a lista nem o PDF.

Ao terminar, me diga: (a) como você identificou quem é administrador no CRM (papel que já existia ou que você criou); (b) onde ficou o motor de cálculo; (c) se o autoteste e os testes passaram nos 3 casos.


Simulador de viabilidade — especificação
1. Objetivo
Aba do CRM que responde: vale a pena assumir o repasse deste empreendimento, e em qual produto?

Para um empreendimento de uma incorporadora, o simulador estima a receita (banco da obra, bancos comissionados, incorporador e cliente), o custo para servir (vendas, operação e registro), o lucro operacional e a distância até o lucro mínimo exigido. Ele reproduz a planilha "Calculadora Aquisição": os casos de teste da seção 9 foram conferidos célula a célula no Excel.

2. Regras gerais
Visual: reaproveitar o layout, menu lateral, cabeçalho, componentes (cards, tabelas, inputs, selects, abas, badges, toasts, diálogos), cores e tipografia que o CRM já usa. Não criar tema novo nem instalar outra biblioteca de UI.
Escopo: não alterar telas, tabelas ou permissões existentes do CRM, exceto adicionar o item "Simulador de viabilidade" no menu lateral (ícone de calculadora) e, se o CRM ainda não tiver, o papel de administrador (4.4).
Idioma: textos de tela em português do Brasil; código, tabelas e colunas em inglês.
Formatos: dinheiro R$ 1.234,56; percentuais com 2 casas (1,78%); quantidades com até 1 casa (40,5 propostas). Em campos de percentual o usuário digita 35 e o sistema grava 0.35.
Precisão: nunca arredondar valores intermediários; arredondar só na exibição.
Divisão por zero (ex.: 0 unidades emitidas): exibir "—", nunca erro, NaN ou Infinity.
3. Rotas
Rota	Tela	Acesso
/simulador	Lista de simulações	todos os usuários logados
/simulador/nova	Nova simulação	todos
/simulador/:id	Simulação salva	todos veem; editar/excluir só autor ou administrador
/simulador/premissas	Premissas padrão	só administrador (os demais são redirecionados para /simulador com aviso "Apenas administradores podem alterar as premissas")
4. Dados
4.1 Tipos
export type ProductKey = 'traditional' | 'saas' | 'full_saas';

export type CostLineKey =
  | 'live'
  | 'salesOnboarding'
  | 'salesFormalization'
  | 'opsCredit'
  | 'opsLegal'
  | 'opsRelease'
  | 'registryOutsideSp'
  | 'registrySp';

export type TeamKey = 'salesOnboarding' | 'salesFormalization' | 'opsCredit' | 'opsLegal' | 'opsRelease';

export type DeveloperPaymentMode = 'all' | 'unpaid_only' | 'obra_bank_only' | 'unpaid_and_obra_bank';

export interface BankAssumption {
  id: string;                          // slug estável: 'caixa', 'itau', 'bradesco'...
  name: string;
  fixedFeeType: 'amount' | 'percent';  // R$ por contrato | % do valor financiado
  fixedFeeValue: number;               // R$; ou fração quando 'percent' (0.01 = 1%)
  obraBankShare: number;               // fração dos processos que ficam com o banco da obra
  unpaidConversionRate: number;        // fração das unidades a repassar que viram casos isolados (não remunerados por banco)
  isActive: boolean;
}

export interface TeamAssumption {
  volumeRate: number;        // fração aplicada sobre a base de volume da equipe (ver 6.4)
  proposalsPerHead: number;  // propostas que uma pessoa processa
  costPerHead: number;       // custo médio por pessoa, em R$
}

export interface ViabilityAssumptions {
  banks: BankAssumption[];
  taxRate: number;
  commissionedRate: { ticketThreshold: number; rateAtOrAbove: number; rateBelow: number };
  productRevenueShare: Record<ProductKey, number>;
  costApplicability: Record<CostLineKey, ProductKey[]>;
  liveCost: number;
  teams: Record<TeamKey, TeamAssumption>;
  registryCostPerCase: { outsideSp: number; sp: number };
  minimumProfit: { base: number; divisor: number; multiplier: number };
  benchmarks: { netRevenuePerUnit: number; averageCommissionRate: number };
  newSimulationDefaults: {
    conversionRate: number;
    developerFeePerUnit: number;
    developerPaymentMode: DeveloperPaymentMode;
    registryFeePerUnit: number;
    registryConversionRate: number;
    outsideSpShare: number;
  };
}

export interface SimulationInputs {
  totalUnits: number | null;      // informativo
  stockUnits: number | null;      // informativo
  unitsToTransfer: number;
  habiteSeMonth: string | null;   // 'AAAA-MM', informativo
  averageTicket: number;
  obraBankId: string;
  product: ProductKey;
  conversionRate: number;
  developerFeePerUnit: number;
  developerPaymentMode: DeveloperPaymentMode;
  registryFeePerUnit: number;
  registryConversionRate: number;
  outsideSpShare: number;
}
Validar com zod tanto as premissas quanto as entradas.

4.2 Valores iniciais das premissas (seed)
Bancos

id	Nome	Remuneração fixa do banco da obra	% dos processos com o banco da obra	% de casos isolados
caixa	Caixa Econômica Federal	1,00% do valor financiado (percent, 0.01)	50%	8,4%
itau	Itaú Unibanco S.A.	R$ 1.200 por contrato	50%	7,1%
bradesco	Banco Bradesco S.A.	R$ 1.000 por contrato	34%	11,8%
inter	Banco Inter	R$ 0	10%	0%
santander	Banco Santander (Brasil) S.A.	R$ 2.000 por contrato	24%	4,3%
bb	Banco do Brasil S.A.	R$ 800 por contrato	30%	23,5%
banrisul	Banrisul	R$ 800 por contrato	10%	0%
sem_banco	Sem banco	R$ 0	0%	10,4%
Todos ativos, nesta ordem.

Demais premissas

Premissa	Valor
Imposto sobre a receita (taxRate)	14,25%
Comissão média dos bancos comissionados	1,78% se ticket ≥ R$ 600.000; 1,49% se ticket < R$ 600.000
Participação da Loft na receita por produto	Tradicional 100% · SaaS 50% · Full SaaS 25%
Custo Live (fixo por projeto)	R$ 5.000
Vendas — onboarding	100% das unidades a repassar · 70 propostas por pessoa · R$ 10.000 por pessoa
Vendas — formalização	60% do volume de onboarding · 40 propostas por pessoa · R$ 10.000 por pessoa
Operação — crédito	100% do volume de formalização · 170 propostas por pessoa · R$ 4.225,11 por pessoa
Operação — jurídico	45% do volume de onboarding · 212 propostas por pessoa · R$ 7.500 por pessoa
Operação — liberação/registro	90% do volume do jurídico · 60 propostas por pessoa · R$ 7.500 por pessoa
Custo de registro por caso	Fora de SP R$ 750 · Em SP R$ 175
Lucro mínimo por projeto	base R$ 270.000 ÷ divisor 25 × multiplicador 4,5 = R$ 48.600
Referências	Remuneração média por unidade: R$ 4.500 · Comissão média: 1,20%
Sugestões para nova simulação	Conversão 35% · Remuneração do incorporador R$ 250 por unidade · Cobrança "Por todas as unidades emitidas + casos isolados" · Registro cobrado do cliente R$ 0 · 50% dos clientes pagam o registro · 50% dos registros fora de SP
Em quais produtos cada custo entra (costApplicability) — reproduz a planilha:

Linha de custo	Tradicional	SaaS	Full SaaS
Live	sim	sim	sim
Vendas — onboarding	sim	não	sim
Vendas — formalização	sim	não	sim
Operação — crédito	sim	sim	sim
Operação — jurídico	sim	sim	sim
Operação — liberação/registro	sim	sim	sim
Registro fora de SP	sim	não	sim
Registro em SP	sim	não	sim
4.3 Tabelas
viability_settings — uma única linha com as premissas padrão.

id integer primary key default 1, com check (id = 1)
assumptions jsonb not null (formato ViabilityAssumptions)
updated_at timestamptz not null default now()
updated_by uuid referência ao usuário
viability_simulations

id uuid pk
name text not null — nome da simulação
developer_name text — incorporadora (texto livre)
project_name text — empreendimento (texto livre)
notes text
inputs jsonb not null (formato SimulationInputs)
assumptions_snapshot jsonb not null — premissas efetivamente usadas (padrão da época + ajustes da simulação)
overridden_paths text[] not null default '{}' — premissas ajustadas nesta simulação (ex.: taxRate, teams.opsLegal.costPerHead, banks.bradesco.obraBankShare)
settings_updated_at timestamptz not null — viability_settings.updated_at no momento em que o snapshot foi montado
results_summary jsonb not null — resumo do produto escolhido para a lista: { product, obraBankName, unitsToTransfer, issuedUnits, netRevenue, totalCost, operatingProfit, gap, isViable }
created_by uuid, created_at, updated_by uuid, updated_at (com trigger de updated_at)
4.4 Administrador
Usar o mecanismo de papéis que o CRM já tem. Se não existir papel de administrador, criar a tabela user_roles (enum app_role com admin e user) e a função has_role(user_id, role) como security definer, no padrão recomendado do Supabase. Nunca guardar papel na tabela de perfis nem decidir permissão só no front-end.

4.5 Permissões (RLS)
viability_settings: leitura para qualquer usuário logado; alteração só administrador.
viability_simulations: leitura para qualquer usuário logado; inclusão por qualquer usuário logado com created_by = auth.uid(); alteração e exclusão só pelo autor ou administrador.
5. Entradas da simulação (tela)
Campo na tela	Chave	Obrigatório	Observação
Nome da simulação	name	sim	ex.: "Residencial Aurora — proposta 1"
Incorporadora	developer_name	não	texto livre
Empreendimento	project_name	não	texto livre
Observações	notes	não	
Unidades totais	totalUnits	não	informativo
Unidades em estoque	stockUnits	não	informativo
Unidades a repassar	unitsToTransfer	sim	inteiro > 0. Se maior que as unidades totais, avisar sem bloquear
Habite-se previsto	habiteSeMonth	não	mês/ano
Ticket médio a financiar	averageTicket	sim	R$ > 0
VGF a repassar	—	—	calculado, só leitura: ticket × unidades a repassar
Banco da obra	obraBankId	sim	select com os bancos ativos. Abaixo do select, uma linha com as premissas do banco: "34% dos processos com o banco da obra · R$ 1.000 por contrato · 11,8% de casos isolados"
Produto	product	sim	seletor segmentado: Tradicional / SaaS / Full SaaS, com legenda "A Loft fica com 100% / 50% / 25% da receita"
Conversão para emissão	conversionRate	sim	% das unidades a repassar que viram financiamento emitido
Remuneração do incorporador por unidade	developerFeePerUnit	sim	R$, pode ser 0
Como o incorporador paga	developerPaymentMode	sim	ver opções abaixo
Valor do registro cobrado do cliente	registryFeePerUnit	sim	R$, pode ser 0
% de clientes que pagam o registro	registryConversionRate	sim	
% dos registros fora de SP	outsideSpShare	sim	o restante é considerado em SP
Opções de Como o incorporador paga (com texto de ajuda: "Casos isolados são os clientes que convertem sem gerar remuneração de banco; a quantidade vem do % de casos isolados do banco da obra, aplicado sobre as unidades a repassar."):

Valor	Texto na tela
all	Por todas as unidades emitidas + casos isolados
unpaid_only	Só pelos casos isolados
obra_bank_only	Só pelas unidades emitidas com o banco da obra
unpaid_and_obra_bank	Pelos casos isolados + unidades do banco da obra
Uma nova simulação já vem preenchida com as "Sugestões para nova simulação" das premissas.

6. Motor de cálculo
Funções puras, sem arredondamento interno:

calculateViability(inputs, assumptions, product = inputs.product): ViabilityResult
calculateAllProducts(inputs, assumptions): Record<ProductKey, ViabilityResult>
applyOverrides(defaults, snapshot, overriddenPaths): ViabilityAssumptions — monta premissas a partir do padrão atual reaplicando os valores ajustados (ver 7.2)
A tela, a lista e o PDF sempre usam essas funções; nenhuma fórmula é repetida em componente.

6.1 Variáveis
R = unidades a repassar
c = conversão para emissão
T = ticket médio a financiar
banco = premissa do banco da obra escolhido
pBO = banco.obraBankShare; pCom = 1 − pBO; pIso = banco.unpaidConversionRate
tCom = T ≥ commissionedRate.ticketThreshold ? rateAtOrAbove : rateBelow
imp = taxRate
s = productRevenueShare[produto]
6.2 Receitas (não dependem do produto)
Unidades emitidas E = R × c (pode ser fracionário; não arredondar)
VGF emitido = E × T
Receita do banco da obra = E × pBO × banco.fixedFeeValue, multiplicado também por T quando fixedFeeType = 'percent'
Receita dos bancos comissionados = E × pCom × tCom × T
Receita do cliente (registro) = registryConversionRate × registryFeePerUnit × E
Base de cobrança do incorporador K:
all → pIso × R + E
unpaid_only → pIso × R
obra_bank_only → pBO × E
unpaid_and_obra_bank → pIso × R + pBO × E
Receita do incorporador = developerFeePerUnit × K
Receita potencial = soma das quatro receitas
Potencial líquido do projeto (100%) = receita potencial × (1 − imp)
6.3 Receita do produto
Receita bruta = receita potencial × s
Impostos = receita bruta × imp
Receita líquida = receita bruta − impostos
6.4 Custo para servir
Volumes (propostas):

volOnboarding = R × teams.salesOnboarding.volumeRate
volFormalizacao = volOnboarding × teams.salesFormalization.volumeRate
volCredito = volFormalizacao × teams.opsCredit.volumeRate
volJuridico = volOnboarding × teams.opsLegal.volumeRate
volLiberacao = volJuridico × teams.opsRelease.volumeRate
volRegistroForaSP = volLiberacao × outsideSpShare
volRegistroSP = volLiberacao × (1 − outsideSpShare)
Linhas de custo (cada linha só entra se o produto estiver em costApplicability[linha]; caso contrário vale 0):

Live = liveCost
Equipes (onboarding, formalização, crédito, jurídico, liberação) = volume ÷ proposalsPerHead × costPerHead. Mostrar também as pessoas-equivalentes = volume ÷ proposalsPerHead.
Registro fora de SP = volRegistroForaSP × registryCostPerCase.outsideSp
Registro em SP = volRegistroSP × registryCostPerCase.sp
Custo total = soma das linhas
6.5 Resultado
Lucro operacional (antes de G&A) = receita líquida − custo total
Lucro mínimo = minimumProfit.base ÷ divisor × multiplier
Gap para o lucro mínimo = lucro operacional − lucro mínimo
Viável = gap ≥ 0
Por unidade emitida: receita bruta, impostos, receita líquida, custo total, lucro operacional, lucro mínimo e gap, cada um ÷ E (com E = 0, "—")
Remuneração média por unidade = receita líquida ÷ E
Comissão média do projeto = remuneração média por unidade ÷ T
Referências: remuneração média por unidade ≥ benchmarks.netRevenuePerUnit e comissão média ≥ benchmarks.averageCommissionRate (verde quando atinge, âmbar quando fica abaixo)
6.6 Preço mínimo para viabilizar
Quanto cobrar do incorporador, por unidade, para o lucro operacional chegar ao lucro mínimo, mantendo todo o resto igual. O lucro cresce em linha reta com essa remuneração:

ganhoPorReal = K × s × (1 − imp)
lucroSemIncorporador = (receita potencial − receita do incorporador) × s × (1 − imp) − custo total
Se ganhoPorReal = 0 → status not_reachable ("Não dá para viabilizar só com a remuneração do incorporador nesta forma de cobrança")
Senão x = (lucro mínimo − lucroSemIncorporador) ÷ ganhoPorReal
x ≤ 0 → status already_viable, valor 0 ("Viável mesmo sem cobrar do incorporador")
x > 0 → status reachable, valor x
6.7 Resultado do motor (ViabilityResult)
Deve expor, no mínimo: produto; E; VGF emitido; pBO, pCom, pIso, tCom; as quatro receitas, a receita potencial e o potencial líquido; K; s; receita bruta, impostos, receita líquida; a lista de linhas de custo (key, rótulo, volume, propostas por pessoa, pessoas-equivalentes, custo unitário, valor, applies); custo total; lucro operacional; lucro mínimo; gap; viável; os valores por unidade emitida; remuneração média por unidade; comissão média; referências; preço mínimo (status e value).

7. Telas
7.1 Lista (/simulador)
Botão Nova simulação; administrador vê também Premissas.
Busca por nome, incorporadora ou empreendimento; filtros por produto, banco da obra, situação (Viável/Inviável) e "Só as minhas".
Colunas: Nome · Incorporadora · Empreendimento · Produto · Banco da obra · Unidades a repassar · Lucro operacional · Gap · Situação (badge Viável/Inviável) · Autor · Atualizada em. Ordenação padrão: mais recentes primeiro.
Ações por linha: Abrir · Duplicar · Excluir (só autor ou administrador, com confirmação).
Lista vazia: "Nenhuma simulação ainda" com botão Nova simulação.
7.2 Simulação (/simulador/nova e /simulador/:id)
Cabeçalho: caminho "Simulador de viabilidade / Nome", badge Viável/Inviável do produto escolhido e botões Salvar, Duplicar, Exportar PDF e Excluir (este dentro de um menu "…").

Desktop em duas colunas: formulário à esquerda (~40%) e resultado à direita (~60%, fixo ao rolar). Celular: uma coluna, resultado abaixo do formulário e uma barra fixa no rodapé com lucro operacional e gap.

O resultado recalcula a cada alteração, sem botão "Calcular".

Coluna do formulário, em cards:

Identificação — nome, incorporadora, empreendimento, observações.
Projeto — unidades totais, estoque, unidades a repassar, habite-se, ticket médio, VGF a repassar (calculado).
Banco e produto — banco da obra (com a linha de premissas do banco) e produto.
Funil e cobranças — conversão, remuneração do incorporador, como o incorporador paga, registro cobrado do cliente, % que paga o registro, % fora de SP.
Premissas desta simulação (sanfona fechada; o título mostra "N premissas ajustadas" quando houver). Mostra os valores em uso e permite ajustar: imposto; comissão dos comissionados (corte de ticket e as duas taxas); participação de cada produto; custo Live; volume, propostas por pessoa e custo por pessoa de cada equipe; custo de registro fora de SP e em SP; base, divisor e multiplicador do lucro mínimo; e, do banco escolhido, remuneração fixa, % com o banco da obra e % de casos isolados. Campo ajustado ganha badge "Ajustado", mostra o valor padrão ao lado e um botão "Restaurar padrão". Não são ajustáveis aqui: a lista de bancos, a tabela de quais custos entram em cada produto, as referências e as sugestões.
Coluna do resultado (produto escolhido):

A. Veredito e números-chave. Faixa verde "Viável — lucro operacional R$ X acima do mínimo" ou vermelha "Inviável — faltam R$ X para o lucro mínimo". Cards: Unidades emitidas · Receita líquida · Custo para servir · Lucro operacional · Gap para o lucro mínimo.
B. Detalhe, em abas:
Receitas: banco da obra, bancos comissionados, incorporador, cliente (registro), receita potencial, potencial líquido do projeto (100%), participação do produto e receita bruta do produto.
Custo para servir: tabela Linha · Volume (propostas) · Propostas por pessoa · Pessoas-equivalentes · Custo por pessoa ou por caso · Custo. Linhas que não entram no produto aparecem em cinza com "Não se aplica a SaaS" (ou ao produto escolhido) e valor zero.
Economics: tabela com colunas Total e Por unidade emitida e linhas Receita bruta · Impostos · Receita líquida · Custo para servir · Lucro operacional (antes de G&A) · Lucro mínimo · Gap para o lucro mínimo.
Indicadores: remuneração média por unidade e comissão média, comparadas às referências.
C. Comparação dos 3 produtos (Etapa 3): tabela com colunas Tradicional · SaaS · Full SaaS e linhas Receita bruta · Impostos · Receita líquida · Custo para servir · Lucro operacional · Lucro mínimo · Gap · Lucro por unidade emitida · Remuneração média por unidade · Comissão média · Preço mínimo do incorporador · Situação. A coluna do produto escolhido fica destacada; clicar no título de outra coluna troca o produto da simulação.
D. Preço mínimo para viabilizar (Etapa 3): "Para atingir o lucro mínimo no [produto], a remuneração do incorporador precisa ser de pelo menos R$ X por unidade (hoje: R$ Y)". Mostrar a folga ou a falta em relação ao valor atual. Botão Aplicar este valor, que preenche a remuneração do incorporador arredondando para cima ao real inteiro. Para os status already_viable e not_reachable, mostrar as mensagens de 6.6 sem botão.
Salvar: grava entradas, snapshot das premissas em uso, premissas ajustadas, settings_updated_at e results_summary. Validar os obrigatórios antes de salvar.

Simulação de outra pessoa: abre só para leitura (exceto para administrador), com botão "Duplicar para editar".

Duplicar: cria cópia com nome "Cópia de …", autor = usuário atual, mantendo entradas, snapshot e ajustes.

Premissas padrão mudaram: se viability_settings.updated_at for mais novo que settings_updated_at da simulação, mostrar no topo: "As premissas padrão foram alteradas em dd/mm/aaaa, depois desta simulação. Os números abaixo usam as premissas da época." com botão Usar premissas atuais, que monta as premissas com applyOverrides (padrão atual + valores ajustados nesta simulação), recalcula e deixa a simulação pendente de salvar.

Alterações não salvas: avisar antes de sair da tela.

Banco desativado: simulações antigas continuam mostrando o banco (vem do snapshot); ele só deixa de aparecer no select de novas escolhas.

7.3 Premissas (/simulador/premissas, só administrador)
Seções editáveis, com os mesmos rótulos de negócio da seção 4.2:

Bancos — tabela editável: nome; tipo da remuneração fixa ("R$ por contrato" ou "% do valor financiado"); valor; % dos processos com o banco da obra; % de casos isolados; ativo. Botão para adicionar banco. Banco não é excluído, só desativado.
Comissão dos bancos comissionados — corte de ticket; taxa para ticket igual ou acima do corte; taxa abaixo do corte.
Imposto sobre a receita.
Participação da Loft por produto.
Custos por produto — grade de caixas de seleção (linhas de custo × produtos), com a nota: "Igual à planilha original: SaaS não carrega vendas nem registro; Full SaaS carrega todos os custos."
Equipes — para cada equipe: volume (% e a base em texto, ex.: "do volume de onboarding"), propostas por pessoa, custo por pessoa.
Custo Live e custo de registro por caso (fora de SP e em SP).
Lucro mínimo — base, divisor e multiplicador, mostrando o resultado (R$ 48.600 no padrão).
Referências — remuneração média por unidade e comissão média.
Sugestões para nova simulação.
Autoteste do motor — botão "Rodar autoteste" que executa os 3 casos da seção 9 com as premissas iniciais da seção 4.2 (fixas no código, independentes do que estiver salvo) e mostra uma tabela valor esperado × calculado com ✓/✗. Serve para conferir que o motor continua igual à planilha depois de qualquer mudança no código.
Salvar com confirmação ("Isto muda as premissas padrão de todas as novas simulações. Simulações salvas mantêm os números até alguém clicar em Usar premissas atuais."). Mostrar "Última alteração por [nome] em [data e hora]". Validar faixas: percentuais entre 0 e 100%, propostas por pessoa > 0, divisor > 0, valores em R$ ≥ 0.

8. PDF (Etapa 3)
Gerado no navegador (jsPDF + jspdf-autotable), A4 retrato, uma página, com a logo do CRM se existir. Nome do arquivo: viabilidade-[empreendimento ou nome]-[AAAA-MM-DD].pdf. Exporta o estado atual da tela, mesmo sem salvar.

Conteúdo:

Título "Simulação de viabilidade", nome da simulação, incorporadora, empreendimento, autor e data.
Dados do projeto: unidades a repassar, ticket médio, VGF a repassar, banco da obra, produto, conversão, remuneração do incorporador e forma de cobrança, registro cobrado do cliente.
Veredito do produto escolhido (Viável/Inviável) com lucro operacional, lucro mínimo e gap.
Tabela de comparação dos 3 produtos (bloco C).
Preço mínimo para viabilizar (bloco D).
Premissas: "Premissas padrão de dd/mm/aaaa" e a lista das premissas ajustadas (nome, valor usado, valor padrão), quando houver.
Rodapé: "Gerado pelo CRM em dd/mm/aaaa hh:mm · Estimativa; não é proposta comercial".
9. Casos de teste (conferidos no Excel)
Todos com as premissas iniciais da seção 4.2. Tolerância: R$ 0,01.

Entradas
Entrada	Caso 1	Caso 2	Caso 3
Banco da obra	Bradesco	Caixa	Santander
Unidades totais	150	320	80
Unidades a repassar	100	200	60
Ticket médio	R$ 600.000	R$ 450.000	R$ 380.000
Conversão para emissão	35%	30%	40%
Remuneração do incorporador	R$ 250	R$ 300	R$ 0
Como o incorporador paga	all	unpaid_and_obra_bank	obra_bank_only
Registro cobrado do cliente	R$ 0	R$ 1.500	R$ 0
% que paga o registro	50%	60%	50%
% dos registros fora de SP	50%	30%	100%
Receitas (iguais nos 3 produtos)
Caso 1	Caso 2	Caso 3
Unidades emitidas	35	60	24
VGF emitido	R$ 21.000.000,00	R$ 27.000.000,00	R$ 9.120.000,00
Comissão dos comissionados	1,78%	1,49%	1,49%
Receita do banco da obra	R$ 11.900,00	R$ 135.000,00	R$ 11.520,00
Receita dos comissionados	R$ 246.708,00	R$ 201.150,00	R$ 103.274,88
Receita do incorporador	R$ 11.700,00	R$ 14.040,00	R$ 0,00
Receita do cliente	R$ 0,00	R$ 54.000,00	R$ 0,00
Receita potencial	R$ 270.308,00	R$ 404.190,00	R$ 114.794,88
Potencial líquido (100%)	R$ 231.789,11	R$ 346.592,92	R$ 98.436,61
Custos por linha (valor quando a linha se aplica)
Linha	Caso 1	Caso 2	Caso 3
Live	R$ 5.000,00	R$ 5.000,00	R$ 5.000,00
Vendas — onboarding	R$ 14.285,71	R$ 28.571,43	R$ 8.571,43
Vendas — formalização	R$ 15.000,00	R$ 30.000,00	R$ 9.000,00
Operação — crédito	R$ 1.491,22	R$ 2.982,43	R$ 894,73
Operação — jurídico	R$ 1.591,98	R$ 3.183,96	R$ 955,19
Operação — liberação/registro	R$ 5.062,50	R$ 10.125,00	R$ 3.037,50
Registro fora de SP	R$ 15.187,50	R$ 18.225,00	R$ 18.225,00
Registro em SP	R$ 3.543,75	R$ 9.922,50	R$ 0,00
Resultado por produto
Caso 1

Tradicional	SaaS	Full SaaS
Receita bruta	R$ 270.308,00	R$ 135.154,00	R$ 67.577,00
Receita líquida	R$ 231.789,11	R$ 115.894,56	R$ 57.947,28
Custo para servir	R$ 61.162,66	R$ 13.145,70	R$ 61.162,66
Lucro operacional	R$ 170.626,45	R$ 102.748,86	−R$ 3.215,38
Gap para o lucro mínimo	R$ 122.026,45	R$ 54.148,86	−R$ 51.815,38
Remuneração média por unidade	R$ 6.622,55	R$ 3.311,27	R$ 1.655,64
Comissão média	1,10%	0,55%	0,28%
Preço mínimo do incorporador	viável sem cobrar	viável sem cobrar	R$ 5.414,62
Caso 2

Tradicional	SaaS	Full SaaS
Receita bruta	R$ 404.190,00	R$ 202.095,00	R$ 101.047,50
Receita líquida	R$ 346.592,92	R$ 173.296,46	R$ 86.648,23
Custo para servir	R$ 108.010,32	R$ 21.291,39	R$ 108.010,32
Lucro operacional	R$ 238.582,60	R$ 152.005,07	−R$ 21.362,09
Gap para o lucro mínimo	R$ 189.982,60	R$ 103.405,07	−R$ 69.962,09
Preço mínimo do incorporador	viável sem cobrar	viável sem cobrar	R$ 7.273,37
Caso 3

Tradicional	SaaS	Full SaaS
Receita bruta	R$ 114.794,88	R$ 57.397,44	R$ 28.698,72
Receita líquida	R$ 98.436,61	R$ 49.218,30	R$ 24.609,15
Custo para servir	R$ 45.683,85	R$ 9.887,42	R$ 45.683,85
Lucro operacional	R$ 52.752,76	R$ 39.330,89	−R$ 21.074,69
Gap para o lucro mínimo	R$ 4.152,76	−R$ 9.269,11	−R$ 69.674,69
Preço mínimo do incorporador	viável sem cobrar	R$ 3.753,29	R$ 56.425,89
Lucro mínimo em todos os casos: R$ 48.600,00.

Casos de borda que também devem ter teste:

Conversão 0% → unidades emitidas 0; valores por unidade e comissão média mostram "—"; sem erro.
Banco "Sem banco" com cobrança obra_bank_only → preço mínimo com status not_reachable.
Caso 3 / SaaS com remuneração do incorporador de R$ 3.754 → gap positivo e situação Viável.
10. De onde vem cada regra (planilha "Calculadora Aquisição", aba Página1)
Bancos: F7:J15. A coluna "Comissão" por banco (I) não entra em nenhuma conta da planilha e não foi trazida.
Caixa com remuneração fixa em % do valor financiado: fórmula de C22, generalizada aqui pelo tipo da remuneração do banco.
Comissão dos comissionados por faixa de ticket: C11 e F29:H30.
Base de cobrança do incorporador: C25. Receitas: C22 a C24. Potencial do projeto: C26.
Participação por produto: C27 e F24:G26. Receita bruta = C80 (equivale a receita potencial × participação).
Custos: C40 a C77. Quais custos entram em cada produto: condições das fórmulas de C42, C47, C53, C58, C63, C69 e C74.
Imposto: C15 (a planilha repete o valor em C81; aqui é um campo só).
Registro em SP = 1 − % fora de SP (na planilha eram duas células independentes, C71 e C76).
Lucro mínimo: C86 (=270000/25*4,5). Gap: C88. Valores por unidade: coluna D (÷ unidades emitidas).
Referências de remuneração média e comissão média: F33:G34.
