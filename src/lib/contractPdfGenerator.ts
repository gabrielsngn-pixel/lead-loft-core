import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface ContractData {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  endereco: string;
  cidade: string;
  estado: string;
  representanteLegal: string;
  cpfRepresentante: string;
  vgvTotal: number;
  unidades: number;
  ticketMedio: number;
  comissaoIncorporador: number;
  valorRegistroPorUnidade: number;
  receitaRegistroTotal: number;
  hasRegistro: boolean;
  nomeEmpreendimento: string;
  numeroContrato: string;
  dataAssinatura: string;
}

const DADOS_LOFT = {
  razaoSocial: "LOFT INTERMEDIADORA LTDA",
  cnpj: "04.113.052/0001-25",
  sede: "São Paulo/SP",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

/**
 * Gera o HTML do contrato no formato pronto para impressão/PDF
 */
export function generateContractHtml(data: ContractData): string {
  const dataFormatada = format(new Date(data.dataAssinatura), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const enderecoCompleto = `${data.endereco}, ${data.cidade} - ${data.estado}`;
  const hasRegistro = data.hasRegistro && data.valorRegistroPorUnidade > 0;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contrato_${data.razaoSocial.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_")}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Inter', sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #000;
      background: white;
      padding: 40px 50px;
    }
    
    h1, h2 { font-weight: 700; }
    p { margin-bottom: 8px; text-align: justify; }
    strong { font-weight: 600; }
    
    .header { display: flex; justify-content: flex-end; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 2px solid #FF774A; }
    .header p { color: #666; font-size: 10pt; }
    
    .title { text-align: center; font-size: 14pt; color: #FF774A; font-weight: 700; margin-bottom: 32px; }
    
    .box { padding: 16px; margin-bottom: 16px; border-left: 3px solid #FF774A; background: #fafafa; }
    
    .section-title { color: #FF774A; font-weight: 700; margin-bottom: 12px; }
    
    .table { width: 100%; border-collapse: collapse; }
    .table td { padding: 12px; }
    .table tr:not(:last-child) { border-bottom: 1px solid #eee; }
    .table .right { text-align: right; font-weight: 700; }
    
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin: 32px 0; }
    .sig-box { padding: 16px; border: 1px solid #eee; border-radius: 4px; background: #fafafa; }
    .sig-box .name { color: #FF774A; font-weight: 700; margin-bottom: 4px; }
    .sig-box .cnpj { font-size: 10pt; margin-bottom: 16px; }
    .sig-line { border-bottom: 1px solid #000; height: 32px; margin-bottom: 8px; }
    
    .footer { text-align: center; padding: 16px; margin-top: 32px; background: #fafafa; border-radius: 4px; }
    .footer p { font-size: 9pt; font-style: italic; color: #666; }
    
    @media print {
      body { padding: 20px 30px; }
      @page { margin: 15mm; size: A4; }
    }
  </style>
</head>
<body>
  <div class="header">
    <p>São Paulo, ${dataFormatada}</p>
  </div>

  <h1 class="title">CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE INTERMEDIAÇÃO DE CRÉDITO IMOBILIÁRIO, REPASSE E REGISTRO</h1>

  <p>Pelo presente instrumento particular e na melhor forma de direito, de um lado:</p>
  
  <div class="box">
    <p><strong>${DADOS_LOFT.razaoSocial}</strong>, pessoa jurídica de direito privado, inscrita no CNPJ/MF sob nº <strong>${DADOS_LOFT.cnpj}</strong>, com sede na cidade de ${DADOS_LOFT.sede}, doravante denominada simplesmente "<strong>CONTRATADA</strong>" ou "<strong>LOFT</strong>";</p>
  </div>

  <p>E, de outro lado:</p>

  <div class="box">
    <p><strong>${data.razaoSocial}</strong>${data.nomeFantasia ? `, nome fantasia "${data.nomeFantasia}"` : ""}, pessoa jurídica de direito privado, inscrita no CNPJ/MF sob nº <strong>${data.cnpj}</strong>, com sede em ${enderecoCompleto}, neste ato representada por seu(sua) representante legal, <strong>${data.representanteLegal}</strong>, portador(a) do CPF nº <strong>${data.cpfRepresentante}</strong>, doravante denominada simplesmente "<strong>CONTRATANTE</strong>" ou "<strong>INCORPORADORA</strong>";</p>
  </div>

  <p style="margin-bottom: 32px;">Têm entre si, justo e acordado, celebrar o presente Contrato de Prestação de Serviços de Intermediação de Crédito Imobiliário, Repasse e Registro, referente ao empreendimento "<strong>${data.nomeEmpreendimento}</strong>", que se regerá pelas cláusulas e condições seguintes, bem como pelas disposições legais aplicáveis.</p>

  <h2 class="section-title">CLÁUSULA PRIMEIRA – DO OBJETO</h2>
  <p><strong>1.1.</strong> O presente contrato tem como objeto a prestação, pela <strong>LOFT INTERMEDIADORA LTDA</strong>, dos serviços de:</p>
  <ul style="list-style: none; padding-left: 32px; margin-bottom: 24px;">
    <li>• Originação e acompanhamento de crédito imobiliário;</li>
    <li>• Assessoria no repasse bancário;</li>
    <li>• Assessoria para registro dos contratos de financiamento;</li>
    <li>• Monitoramento da jornada do comprador até a liberação dos recursos.</li>
  </ul>
  <p style="margin-bottom: 24px;"><strong>1.2.</strong> Todos os serviços previstos neste contrato serão prestados sob responsabilidade exclusiva da <strong>LOFT</strong>, que responderá integralmente perante a <strong>INCORPORADORA</strong> pela sua execução.</p>

  <h2 class="section-title">CLÁUSULA SEGUNDA – DO ESCOPO DOS SERVIÇOS</h2>
  <p><strong>2.1. Dos Serviços de Crédito:</strong> A CONTRATADA executará: contato com clientes; análise de documentação; submissão às instituições financeiras; acompanhamento do processo.</p>
  <p><strong>2.2. Dos Serviços de Repasse:</strong> Emissão de fichas cadastrais; análise jurídica; liberação de minuta; acompanhamento de assinatura.</p>
  <p><strong>2.3. Dos Serviços de Registro:</strong> Providências junto à Prefeitura para ITBI; acompanhamento cartorário; entrega de via registrada.</p>
  <p style="margin-bottom: 24px;"><strong>2.4.</strong> A CONTRATADA poderá operar com modalidade digital de assinatura e registro.</p>

  <h2 class="section-title">CLÁUSULA TERCEIRA – DAS CONDIÇÕES COMERCIAIS</h2>
  <p><strong>3.1.</strong> As condições comerciais acordadas para o empreendimento "<strong>${data.nomeEmpreendimento}</strong>" são as seguintes:</p>
  
  <div class="box">
    <table class="table">
      <tr>
        <td>Empreendimento:</td>
        <td class="right">${data.nomeEmpreendimento}</td>
      </tr>
      <tr>
        <td>Valor Geral de Vendas (VGV):</td>
        <td class="right">${formatCurrency(data.vgvTotal)}</td>
      </tr>
      <tr>
        <td>Número de unidades contratadas:</td>
        <td class="right">${data.unidades} unidades</td>
      </tr>
      <tr>
        <td>Ticket médio por unidade:</td>
        <td class="right">${formatCurrency(data.ticketMedio)}</td>
      </tr>
      ${data.comissaoIncorporador > 0 ? `
      <tr>
        <td>Comissão da incorporadora:</td>
        <td class="right">${formatPercent(data.comissaoIncorporador)}</td>
      </tr>
      ` : ""}
      ${hasRegistro ? `
      <tr>
        <td>Valor de registro por unidade:</td>
        <td class="right">${formatCurrency(data.valorRegistroPorUnidade)}</td>
      </tr>
      <tr>
        <td>Receita de registro total prevista:</td>
        <td class="right">${formatCurrency(data.receitaRegistroTotal)}</td>
      </tr>
      ` : ""}
    </table>
  </div>

  <p><strong>3.2.</strong> A remuneração da CONTRATADA será proveniente das comissões bancárias decorrentes da intermediação.</p>
  <p style="margin-bottom: 24px;"><strong>3.3.</strong> A <strong>LOFT</strong> é a única responsável pela coordenação, gestão e entrega dos serviços contratados.</p>

  ${hasRegistro ? `
  <h2 class="section-title">CLÁUSULA QUARTA – DA COBRANÇA E DO REPASSE DOS VALORES DE REGISTRO</h2>
  <p><strong>4.1.</strong> A cobrança dos valores referentes aos serviços de registro será realizada diretamente pela INCORPORADORA junto ao cliente final.</p>
  <p><strong>4.2.</strong> A responsabilidade pela cobrança, recebimento e repasse dos valores de registro à LOFT será exclusivamente da INCORPORADORA.</p>
  <p><strong>4.3.</strong> A INCORPORADORA obriga-se a repassar à LOFT os valores correspondentes à receita de registro a cada processo de financiamento.</p>
  <p><strong>4.4.</strong> A eventual inadimplência do cliente final não exime a INCORPORADORA da obrigação de pagamento à LOFT.</p>
  <p style="margin-bottom: 24px;"><strong>4.5.</strong> O não repasse dos valores de registro caracterizará inadimplemento contratual.</p>
  ` : ""}

  <h2 class="section-title">CLÁUSULA ${hasRegistro ? "QUINTA" : "QUARTA"} – DAS OBRIGAÇÕES DAS PARTES</h2>
  <p><strong>${hasRegistro ? "5" : "4"}.1. São obrigações da CONTRATADA:</strong> Executar os serviços com diligência; manter a CONTRATANTE informada; zelar pelo sigilo; cumprir normas aplicáveis.</p>
  <p style="margin-bottom: 24px;"><strong>${hasRegistro ? "5" : "4"}.2. São obrigações da CONTRATANTE:</strong> Fornecer informações e documentos necessários; colaborar com o andamento; efetuar pagamentos; comunicar alterações relevantes.</p>

  <h2 class="section-title">CLÁUSULA ${hasRegistro ? "SEXTA" : "QUINTA"} – DO PRAZO</h2>
  <p><strong>${hasRegistro ? "6" : "5"}.1.</strong> O contrato vigorará pelo prazo necessário à conclusão dos serviços, podendo ser rescindido com 30 dias de antecedência.</p>
  <p style="margin-bottom: 24px;"><strong>${hasRegistro ? "6" : "5"}.2.</strong> A rescisão não prejudicará a remuneração por serviços já prestados.</p>

  <h2 class="section-title">CLÁUSULA ${hasRegistro ? "SÉTIMA" : "SEXTA"} – DA CONFIDENCIALIDADE</h2>
  <p style="margin-bottom: 24px;"><strong>${hasRegistro ? "7" : "6"}.1.</strong> As partes comprometem-se a manter sigilo sobre informações comerciais, financeiras e estratégicas.</p>

  <h2 class="section-title">CLÁUSULA ${hasRegistro ? "OITAVA" : "SÉTIMA"} – DAS DISPOSIÇÕES GERAIS</h2>
  <p><strong>${hasRegistro ? "8" : "7"}.1.</strong> Este contrato reflete as condições comerciais aprovadas na simulação de viabilidade.</p>
  <p><strong>${hasRegistro ? "8" : "7"}.2.</strong> Alterações somente serão válidas se formalizadas por escrito.</p>
  <p style="margin-bottom: 24px;"><strong>${hasRegistro ? "8" : "7"}.3.</strong> A tolerância não implicará novação ou renúncia.</p>

  <h2 class="section-title">CLÁUSULA ${hasRegistro ? "NONA" : "OITAVA"} – DO FORO</h2>
  <p style="margin-bottom: 32px;"><strong>${hasRegistro ? "9" : "8"}.1.</strong> As partes elegem o foro da Comarca de São Paulo, Estado de São Paulo, para dirimir quaisquer controvérsias.</p>

  <p>E, por estarem assim justas e contratadas, as partes assinam o presente instrumento em 2 (duas) vias de igual teor e forma.</p>

  <p style="text-align: center; margin: 32px 0;">São Paulo, ${dataFormatada}.</p>

  <h2 style="text-align: center; color: #FF774A; text-decoration: underline; margin-bottom: 24px;">ASSINATURAS</h2>
  
  <div class="signatures">
    <div class="sig-box">
      <p class="name">${DADOS_LOFT.razaoSocial}</p>
      <p class="cnpj">CNPJ: ${DADOS_LOFT.cnpj}</p>
      <div class="sig-line"></div>
      <p style="font-size: 10pt;">Nome: _________________________</p>
      <p style="font-size: 10pt;">Cargo: _________________________</p>
    </div>
    <div class="sig-box">
      <p class="name">${data.razaoSocial}</p>
      <p class="cnpj">CNPJ: ${data.cnpj}</p>
      <div class="sig-line"></div>
      <p style="font-size: 10pt;">Nome: ${data.representanteLegal}</p>
      <p style="font-size: 10pt;">CPF: ${data.cpfRepresentante}</p>
    </div>
  </div>

  <h2 style="font-weight: 700; margin-bottom: 16px;">TESTEMUNHAS:</h2>
  
  <div class="signatures">
    <div>
      <div class="sig-line"></div>
      <p style="font-size: 10pt;">Nome: _________________________</p>
      <p style="font-size: 10pt;">CPF: _________________________</p>
    </div>
    <div>
      <div class="sig-line"></div>
      <p style="font-size: 10pt;">Nome: _________________________</p>
      <p style="font-size: 10pt;">CPF: _________________________</p>
    </div>
  </div>

  <div class="footer">
    <p>"Ao assinar este documento, as partes concordam integralmente com as condições comerciais aprovadas na simulação de viabilidade."</p>
    <p style="margin-top: 8px; font-style: normal; color: #999;">Contrato #${data.numeroContrato}</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Faz upload do contrato HTML para o Storage e retorna a URL pública
 */
export async function uploadContractToStorage(
  html: string,
  numeroContrato: string
): Promise<string | null> {
  try {
    const fileName = `${numeroContrato}.html`;
    const filePath = `contracts/${fileName}`;

    // Criar blob do HTML
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });

    const { data, error } = await supabase.storage
      .from("contracts")
      .upload(filePath, blob, {
        cacheControl: "3600",
        contentType: "text/html",
        upsert: true,
      });

    if (error) {
      console.error("Error uploading contract:", error);
      throw error;
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from("contracts")
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error("Error in uploadContractToStorage:", error);
    return null;
  }
}

/**
 * Gera número único do contrato
 */
export function generateContractNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `LOFT-${year}-${random}`;
}
