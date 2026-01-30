import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface ScriptToPdfButtonProps {
  className?: string;
}

export function ScriptToPdfButton({ className }: ScriptToPdfButtonProps) {
  const handleExport = () => {
    // Create a printable version
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({
        title: "Erro",
        description: "Não foi possível abrir a janela de impressão.",
        variant: "destructive",
      });
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Script de Atendimento Loft</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Inter', sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
          }
          
          .header {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 32px;
            padding-bottom: 24px;
            border-bottom: 2px solid #FF774A;
          }
          
          .logo {
            width: 48px;
            height: 48px;
            background: #FF774A;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 20px;
          }
          
          .header-text h1 {
            font-size: 24px;
            font-weight: 700;
            color: #115644;
          }
          
          .header-text p {
            font-size: 14px;
            color: #666;
          }
          
          .section {
            margin-bottom: 24px;
            page-break-inside: avoid;
          }
          
          .section-header {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            background: #f8f9fa;
            border-radius: 8px;
            margin-bottom: 12px;
          }
          
          .section-number {
            width: 28px;
            height: 28px;
            background: #FF774A;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 14px;
          }
          
          .section-title {
            font-size: 16px;
            font-weight: 600;
            color: #115644;
          }
          
          .content {
            padding-left: 40px;
          }
          
          .key-phrases {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 12px;
          }
          
          .key-phrase {
            padding: 4px 12px;
            background: #e8f5f1;
            color: #115644;
            border-radius: 16px;
            font-size: 12px;
            font-weight: 500;
          }
          
          .highlight {
            background: #fff3f0;
            border-left: 3px solid #FF774A;
            padding: 12px 16px;
            margin: 12px 0;
            border-radius: 0 8px 8px 0;
          }
          
          .highlight p {
            color: #FF774A;
            font-weight: 500;
          }
          
          ul {
            margin: 12px 0;
            padding-left: 20px;
          }
          
          li {
            margin-bottom: 8px;
            color: #444;
          }
          
          .question {
            background: #f8f9fa;
            padding: 10px 14px;
            border-radius: 8px;
            margin: 8px 0;
            border: 1px solid #e0e0e0;
          }
          
          .question::before {
            content: "❓ ";
          }
          
          .stat {
            background: #115644;
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            text-align: center;
            font-family: monospace;
            margin: 12px 0;
          }
          
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            text-align: center;
            color: #999;
            font-size: 12px;
          }
          
          @media print {
            body {
              padding: 20px;
            }
            .section {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">L</div>
          <div class="header-text">
            <h1>Script de Atendimento Loft</h1>
            <p>Roteiro Comercial - Proposta de Valor 2026</p>
          </div>
        </div>
        
        <div class="section">
          <div class="section-header">
            <div class="section-number">1</div>
            <div class="section-title">Abordagem</div>
          </div>
          <div class="content">
            <div class="key-phrases">
              <span class="key-phrase">A maior originadora de crédito imobiliário</span>
              <span class="key-phrase">+8.4 BI em contratos</span>
            </div>
            <p>Olá! Meu nome é [Nome], sou consultor da Loft. A Loft é a maior originadora de crédito imobiliário do Brasil, com mais de R$ 8,4 bilhões em contratos emitidos por ano.</p>
            <div class="highlight">
              <p>Nosso objetivo: transformar crédito em previsibilidade para incorporações.</p>
            </div>
            <div class="stat">+9 Mil parceiros ativos | +2 MM de pessoas impactadas | +174 BI em propostas</div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-header">
            <div class="section-number">2</div>
            <div class="section-title">Conexão</div>
          </div>
          <div class="content">
            <p>Entendemos que na incorporação imobiliária, o maior risco não está na execução da obra em si. O verdadeiro desafio está no intervalo crítico entre vender hoje e financiar daqui a 36 meses.</p>
            <div class="highlight">
              <p>A dor central: O incorporador assume todo o risco financeiro e operacional do projeto.</p>
            </div>
            <p><strong>Três fatores que criam alto risco:</strong></p>
            <ul>
              <li>Crédito ausente: O financiamento ainda não existe e depende de aprovação futura</li>
              <li>Caixa incerto: A previsibilidade de entrada de recursos é baixa e volátil</li>
              <li>Risco integral: Bancos só avaliam o comprador no momento final</li>
            </ul>
          </div>
        </div>
        
        <div class="section">
          <div class="section-header">
            <div class="section-number">3</div>
            <div class="section-title">Perguntas-Chave</div>
          </div>
          <div class="content">
            <div class="question">Qual é o volume médio de vendas na planta por mês nos seus empreendimentos?</div>
            <div class="question">Vocês já enfrentaram problemas com distrato estrutural? Qual a taxa atual?</div>
            <div class="question">Como é feita hoje a análise de crédito dos compradores antes da venda?</div>
            <div class="question">Existe acompanhamento do perfil de crédito durante o período de obra?</div>
            <div class="question">Qual tem sido a taxa de reprovação no momento do repasse?</div>
            <div class="question">Vocês trabalham com CCA ou assessoria de crédito atualmente?</div>
            <div class="question">Qual o maior desafio hoje: vender mais ou garantir que a venda se converta em caixa?</div>
            <div class="question">Quanto de estoque involuntário vocês têm em unidades prontas?</div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-header">
            <div class="section-number">4</div>
            <div class="section-title">Proposta de Valor</div>
          </div>
          <div class="content">
            <div class="highlight">
              <p>A Loft atua como uma infraestrutura de crédito integrada à jornada completa da incorporação.</p>
            </div>
            <p><strong>Nossos pilares de sucesso:</strong></p>
            <ul>
              <li>Atendimento especializado: Esteira até 35% mais ágil em comparação ao mercado</li>
              <li>Tecnologia com IA: Ferramentas automatizadas no WhatsApp e PDP</li>
              <li>Operação de Excelência: Portfólio multibancos e especialistas em reversão de crédito negado</li>
            </ul>
            <div class="stat">15-25% taxa de distrato típica | 30-40% reprovação no repasse | R$5-15M em estoque involuntário</div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-header">
            <div class="section-number">5</div>
            <div class="section-title">Solução Loft</div>
          </div>
          <div class="content">
            <div class="highlight">
              <p>Multibanco não é quantidade, é direcionamento inteligente.</p>
            </div>
            <p><strong>O que entregamos na prática:</strong></p>
            <ul>
              <li>Integração via API: Conexão direta com sistemas da incorporadora</li>
              <li>Pré-qualificação multibanco: Análise prévia em múltiplas instituições antes da venda</li>
              <li>Matching inteligente: Direcionamos cada cliente ao banco com maior chance de aprovação</li>
              <li>Monitoramento contínuo: Alertas automáticos de mudanças críticas de risco</li>
              <li>Redução SLA: 35% menos tempo de aprovação de crédito</li>
            </ul>
            <p><strong>Bancos conectados:</strong> Itaú, Bradesco, Santander, Caixa, Inter</p>
          </div>
        </div>
        
        <div class="section">
          <div class="section-header">
            <div class="section-number">6</div>
            <div class="section-title">Fechamento</div>
          </div>
          <div class="content">
            <div class="highlight">
              <p>Crédito deixa de ser surpresa e passa a ser variável controlável.</p>
            </div>
            <p><strong>Impacto direto mensurável:</strong></p>
            <ul>
              <li>Redução de distratos: Diminuição estrutural através de pré-qualificação</li>
              <li>Menor volatilidade: Fluxo de caixa mais estável e previsível</li>
              <li>Previsibilidade de repasse: Maior certeza sobre quando e quanto será recebido</li>
              <li>Narrativa sólida: Dados concretos para bancos, fundos e investidores</li>
            </ul>
            <div class="highlight">
              <p>Próximo passo: Agendar uma análise gratuita do seu pipeline atual e identificar oportunidades de melhoria.</p>
            </div>
          </div>
        </div>
        
        <div class="footer">
          <p>Loft CRM - Script de Atendimento Comercial</p>
          <p>Documento gerado em ${new Date().toLocaleDateString("pt-BR")}</p>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
    }, 250);

    toast({
      title: "PDF gerado",
      description: "O script foi preparado para impressão/download.",
    });
  };

  return (
    <Button variant="outline" onClick={handleExport} className={className}>
      <FileDown className="h-4 w-4 mr-2" />
      Exportar PDF
    </Button>
  );
}
