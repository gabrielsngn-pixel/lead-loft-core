/**
 * ContratoLoft - Componente único e reutilizável de geração de contrato
 * 
 * Este componente gera um contrato de prestação de serviços seguindo
 * exatamente o template visual da Loft, pronto para exportação em PDF.
 * 
 * Pode ser utilizado em qualquer parte do CRM que necessite gerar contratos.
 */

import { useState, useRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  FileCheck2,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  AlertCircle,
  FileText,
  Printer,
} from "lucide-react";
import {
  generateContractHtml,
  uploadContractToStorage,
  type ContractData,
} from "@/lib/contractPdfGenerator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";


// ==========================================
// TIPOS
// ==========================================

export interface DadosIncorporadora {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  endereco: string;
  cidade: string;
  estado: string;
  representanteLegal: string;
  cpfRepresentante: string;
}

export interface DadosProjeto {
  vgvTotal: number;
  unidades: number;
  ticketMedio: number;
  comissaoIncorporador: number;
  valorRegistroPorUnidade: number;
  receitaRegistroTotal: number;
  hasRegistro: boolean;
  nomeEmpreendimento: string;
}

export interface ContratoData {
  dadosIncorporadora: DadosIncorporadora;
  dadosProjeto: DadosProjeto;
  dataAssinatura: string;
  numeroContrato: string;
  contratoUrl?: string;
}

type FluxoStep = "dados" | "revisao" | "exportar";

// ==========================================
// CONSTANTES
// ==========================================

const DADOS_LOFT = {
  razaoSocial: "LOFT INTERMEDIADORA LTDA",
  cnpj: "04.113.052/0001-25",
  sede: "São Paulo/SP",
};

const CAMPOS_OBRIGATORIOS: { key: keyof DadosIncorporadora; label: string }[] = [
  { key: "razaoSocial", label: "Razão Social" },
  { key: "cnpj", label: "CNPJ" },
  { key: "endereco", label: "Endereço" },
  { key: "cidade", label: "Cidade" },
  { key: "estado", label: "UF" },
  { key: "representanteLegal", label: "Representante Legal" },
  { key: "cpfRepresentante", label: "CPF do Representante" },
];

const STEPS: { id: FluxoStep; label: string }[] = [
  { id: "dados", label: "Dados" },
  { id: "revisao", label: "Revisão" },
  { id: "exportar", label: "Exportar" },
];

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

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

function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function generateContractNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `LOFT-${year}-${random}`;
}

// ==========================================
// COMPONENTE DO CONTRATO (RENDERIZAÇÃO)
// ==========================================

interface ContratoDocumentoProps {
  data: ContratoData;
}

function ContratoDocumento({ data }: ContratoDocumentoProps) {
  const { dadosIncorporadora, dadosProjeto, dataAssinatura } = data;
  
  const dataFormatada = format(new Date(dataAssinatura), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const enderecoCompleto = `${dadosIncorporadora.endereco}, ${dadosIncorporadora.cidade} - ${dadosIncorporadora.estado}`;
  const hasRegistro = dadosProjeto.hasRegistro && dadosProjeto.valorRegistroPorUnidade > 0;

  return (
    <div className="bg-white text-black p-8" style={{ fontFamily: "Inter, sans-serif", fontSize: "11pt", lineHeight: "1.6" }}>
      {/* CABEÇALHO */}
      <div className="flex justify-end items-start mb-8 pb-4" style={{ borderBottom: "2px solid #FF774A" }}>
        <p className="text-sm" style={{ color: "#666" }}>São Paulo, {dataFormatada}</p>
      </div>

      {/* TÍTULO */}
      <h1 className="text-center font-bold mb-8" style={{ fontSize: "14pt", color: "#FF774A" }}>
        CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE INTERMEDIAÇÃO DE CRÉDITO IMOBILIÁRIO, REPASSE E REGISTRO
      </h1>

      {/* PREÂMBULO */}
      <p className="text-justify mb-4">Pelo presente instrumento particular e na melhor forma de direito, de um lado:</p>
      
      <div className="p-4 mb-4" style={{ borderLeft: "3px solid #FF774A", backgroundColor: "#fafafa" }}>
        <p className="text-justify">
          <strong>{DADOS_LOFT.razaoSocial}</strong>, pessoa jurídica de direito privado, inscrita no CNPJ/MF sob nº{" "}
          <strong>{DADOS_LOFT.cnpj}</strong>, com sede na cidade de {DADOS_LOFT.sede}, doravante denominada simplesmente{" "}
          "<strong>CONTRATADA</strong>" ou "<strong>LOFT</strong>";
        </p>
      </div>

      <p className="text-justify mb-4">E, de outro lado:</p>

      <div className="p-4 mb-4" style={{ borderLeft: "3px solid #FF774A", backgroundColor: "#fafafa" }}>
        <p className="text-justify">
          <strong>{dadosIncorporadora.razaoSocial}</strong>
          {dadosIncorporadora.nomeFantasia && `, nome fantasia "${dadosIncorporadora.nomeFantasia}"`}, 
          pessoa jurídica de direito privado, inscrita no CNPJ/MF sob nº <strong>{dadosIncorporadora.cnpj}</strong>, 
          com sede em {enderecoCompleto}, neste ato representada por seu(sua) representante legal,{" "}
          <strong>{dadosIncorporadora.representanteLegal}</strong>, portador(a) do CPF nº <strong>{dadosIncorporadora.cpfRepresentante}</strong>, 
          doravante denominada simplesmente "<strong>CONTRATANTE</strong>" ou "<strong>INCORPORADORA</strong>";
        </p>
      </div>

      <p className="text-justify mb-8">
        Têm entre si, justo e acordado, celebrar o presente Contrato de Prestação de Serviços de Intermediação de 
        Crédito Imobiliário, Repasse e Registro, referente ao empreendimento "<strong>{dadosProjeto.nomeEmpreendimento}</strong>", que se regerá pelas cláusulas e condições seguintes, bem como 
        pelas disposições legais aplicáveis.
      </p>

      {/* CLÁUSULA PRIMEIRA */}
      <h2 className="font-bold mb-3" style={{ color: "#FF774A" }}>CLÁUSULA PRIMEIRA – DO OBJETO</h2>
      <p className="text-justify mb-2">
        <strong>1.1.</strong> O presente contrato tem como objeto a prestação, pela <strong>LOFT INTERMEDIADORA LTDA</strong>, dos serviços de:
        Crédito Imobiliário, Repasse e Registro, que se regerá pelas cláusulas e condições seguintes, bem como 
        pelas disposições legais aplicáveis.
      </p>

      {/* CLÁUSULA PRIMEIRA */}
      <h2 className="font-bold mb-3" style={{ color: "#FF774A" }}>CLÁUSULA PRIMEIRA – DO OBJETO</h2>
      <p className="text-justify mb-2">
        <strong>1.1.</strong> O presente contrato tem como objeto a prestação, pela <strong>LOFT INTERMEDIADORA LTDA</strong>, dos serviços de:
      </p>
      <ul className="list-none pl-8 mb-3 space-y-1">
        <li>Originação e acompanhamento de crédito imobiliário;</li>
        <li>Assessoria no repasse bancário;</li>
        <li>Assessoria para registro dos contratos de financiamento;</li>
        <li>Monitoramento da jornada do comprador até a liberação dos recursos.</li>
      </ul>
      <p className="text-justify mb-6">
        <strong>1.2.</strong> Todos os serviços previstos neste contrato serão prestados sob responsabilidade exclusiva da{" "}
        <strong>LOFT</strong>, que responderá integralmente perante a <strong>INCORPORADORA</strong> pela sua execução.
      </p>

      {/* CLÁUSULA SEGUNDA */}
      <h2 className="font-bold mb-3" style={{ color: "#FF774A" }}>CLÁUSULA SEGUNDA – DO ESCOPO DOS SERVIÇOS</h2>
      <p className="text-justify mb-2">
        <strong>2.1. Dos Serviços de Crédito:</strong> A CONTRATADA executará: contato com clientes; análise de documentação; 
        submissão às instituições financeiras; acompanhamento do processo.
      </p>
      <p className="text-justify mb-2">
        <strong>2.2. Dos Serviços de Repasse:</strong> Emissão de fichas cadastrais; análise jurídica; liberação de minuta; 
        acompanhamento de assinatura.
      </p>
      <p className="text-justify mb-2">
        <strong>2.3. Dos Serviços de Registro:</strong> Providências junto à Prefeitura para ITBI; acompanhamento cartorário; 
        entrega de via registrada.
      </p>
      <p className="text-justify mb-6">
        <strong>2.4.</strong> A CONTRATADA poderá operar com modalidade digital de assinatura e registro.
      </p>

      {/* CLÁUSULA TERCEIRA */}
      <h2 className="font-bold mb-3" style={{ color: "#FF774A" }}>CLÁUSULA TERCEIRA – DAS CONDIÇÕES COMERCIAIS</h2>
      <p className="text-justify mb-4">
        <strong>3.1.</strong> As condições comerciais acordadas para o empreendimento "<strong>{dadosProjeto.nomeEmpreendimento}</strong>" são as seguintes:
      </p>
      
      {/* TABELA DE CONDIÇÕES */}
      <div className="mb-4" style={{ borderLeft: "3px solid #FF774A", backgroundColor: "#fafafa" }}>
        <table className="w-full">
          <tbody>
            <tr style={{ borderBottom: "1px solid #eee" }}>
              <td className="p-3">Empreendimento:</td>
              <td className="p-3 text-right font-bold">{dadosProjeto.nomeEmpreendimento}</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #eee" }}>
              <td className="p-3">Valor Geral de Vendas (VGV):</td>
              <td className="p-3 text-right font-bold">{formatCurrency(dadosProjeto.vgvTotal)}</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #eee" }}>
              <td className="p-3">Número de unidades contratadas:</td>
              <td className="p-3 text-right font-bold">{dadosProjeto.unidades} unidades</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #eee" }}>
              <td className="p-3">Ticket médio por unidade:</td>
              <td className="p-3 text-right font-bold">{formatCurrency(dadosProjeto.ticketMedio)}</td>
            </tr>
            {dadosProjeto.comissaoIncorporador > 0 && (
              <tr style={{ borderBottom: hasRegistro ? "1px solid #eee" : "none" }}>
                <td className="p-3">Comissão da incorporadora:</td>
                <td className="p-3 text-right font-bold">{formatPercent(dadosProjeto.comissaoIncorporador)}</td>
              </tr>
            )}
            {hasRegistro && (
              <>
                <tr style={{ borderBottom: "1px solid #eee" }}>
                  <td className="p-3">Valor de registro por unidade:</td>
                  <td className="p-3 text-right font-bold">{formatCurrency(dadosProjeto.valorRegistroPorUnidade)}</td>
                </tr>
                <tr>
                  <td className="p-3">Receita de registro total prevista:</td>
                  <td className="p-3 text-right font-bold">{formatCurrency(dadosProjeto.receitaRegistroTotal)}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-justify mb-2">
        <strong>3.2.</strong> A remuneração da CONTRATADA será proveniente das comissões bancárias decorrentes da intermediação.
      </p>
      <p className="text-justify mb-6">
        <strong>3.3.</strong> A <strong>LOFT</strong> é a única responsável pela coordenação, gestão e entrega dos serviços contratados, 
        não mantendo a <strong>INCORPORADORA</strong> qualquer vínculo contratual com terceiros eventualmente envolvidos na execução operacional.
      </p>

      {/* CLÁUSULA DE REGISTRO (CONDICIONAL) */}
      {hasRegistro && (
        <>
          <h2 className="font-bold mb-3" style={{ color: "#FF774A" }}>CLÁUSULA QUARTA – DA COBRANÇA E DO REPASSE DOS VALORES DE REGISTRO</h2>
          <p className="text-justify mb-2">
            <strong>4.1.</strong> A cobrança dos valores referentes aos serviços de registro dos contratos de financiamento 
            imobiliário será realizada diretamente pela INCORPORADORA junto ao cliente final, conforme as condições 
            comerciais acordadas entre as partes.
          </p>
          <p className="text-justify mb-2">
            <strong>4.2.</strong> A responsabilidade pela cobrança, recebimento e repasse dos valores de registro à LOFT 
            INTERMEDIADORA LTDA será exclusivamente da INCORPORADORA, não cabendo à LOFT qualquer obrigação de cobrança 
            direta ao cliente final.
          </p>
          <p className="text-justify mb-2">
            <strong>4.3.</strong> A INCORPORADORA obriga-se a repassar à LOFT os valores correspondentes à receita de 
            registro a cada processo de financiamento repassado, independentemente do efetivo recebimento do valor 
            junto ao cliente final.
          </p>
          <p className="text-justify mb-2">
            <strong>4.4.</strong> A eventual inadimplência do cliente final não exime a INCORPORADORA da obrigação de 
            pagamento à LOFT.
          </p>
          <p className="text-justify mb-2">
            <strong>4.5.</strong> As partes reconhecem que os valores de registro, quando previstos neste contrato, 
            constituem receita da operação e são parte integrante do equilíbrio econômico-financeiro da presente contratação.
          </p>
          <p className="text-justify mb-6">
            <strong>4.6.</strong> O não repasse dos valores de registro nos termos deste contrato caracterizará 
            inadimplemento contratual, sujeitando a INCORPORADORA às penalidades previstas neste instrumento e 
            na legislação aplicável.
          </p>
        </>
      )}

      {/* CLÁUSULA DAS OBRIGAÇÕES */}
      <h2 className="font-bold mb-3" style={{ color: "#FF774A" }}>
        CLÁUSULA {hasRegistro ? "QUINTA" : "QUARTA"} – DAS OBRIGAÇÕES DAS PARTES
      </h2>
      <p className="text-justify mb-2">
        <strong>{hasRegistro ? "5" : "4"}.1. São obrigações da CONTRATADA:</strong> Executar os serviços com diligência; 
        manter a CONTRATANTE informada; zelar pelo sigilo; cumprir normas aplicáveis.
      </p>
      <p className="text-justify mb-6">
        <strong>{hasRegistro ? "5" : "4"}.2. São obrigações da CONTRATANTE:</strong> Fornecer informações e documentos 
        necessários; colaborar com o andamento; efetuar pagamentos; comunicar alterações relevantes.
      </p>

      {/* CLÁUSULA DO PRAZO */}
      <h2 className="font-bold mb-3" style={{ color: "#FF774A" }}>
        CLÁUSULA {hasRegistro ? "SEXTA" : "QUINTA"} – DO PRAZO
      </h2>
      <p className="text-justify mb-2">
        <strong>{hasRegistro ? "6" : "5"}.1.</strong> O contrato vigorará pelo prazo necessário à conclusão dos serviços, 
        podendo ser rescindido com 30 dias de antecedência.
      </p>
      <p className="text-justify mb-6">
        <strong>{hasRegistro ? "6" : "5"}.2.</strong> A rescisão não prejudicará a remuneração por serviços já prestados.
      </p>

      {/* CLÁUSULA DA CONFIDENCIALIDADE */}
      <h2 className="font-bold mb-3" style={{ color: "#FF774A" }}>
        CLÁUSULA {hasRegistro ? "SÉTIMA" : "SEXTA"} – DA CONFIDENCIALIDADE
      </h2>
      <p className="text-justify mb-6">
        <strong>{hasRegistro ? "7" : "6"}.1.</strong> As partes comprometem-se a manter sigilo sobre informações 
        comerciais, financeiras e estratégicas.
      </p>

      {/* CLÁUSULA DAS DISPOSIÇÕES GERAIS */}
      <h2 className="font-bold mb-3" style={{ color: "#FF774A" }}>
        CLÁUSULA {hasRegistro ? "OITAVA" : "SÉTIMA"} – DAS DISPOSIÇÕES GERAIS
      </h2>
      <p className="text-justify mb-2">
        <strong>{hasRegistro ? "8" : "7"}.1.</strong> Este contrato reflete as condições comerciais aprovadas na 
        simulação de viabilidade.
      </p>
      <p className="text-justify mb-2">
        <strong>{hasRegistro ? "8" : "7"}.2.</strong> Alterações somente serão válidas se formalizadas por escrito.
      </p>
      <p className="text-justify mb-2">
        <strong>{hasRegistro ? "8" : "7"}.3.</strong> A tolerância não implicará novação ou renúncia.
      </p>
      <p className="text-justify mb-6">
        <strong>{hasRegistro ? "8" : "7"}.4.</strong> Este contrato obriga as partes e seus sucessores.
      </p>

      {/* CLÁUSULA DO FORO */}
      <h2 className="font-bold mb-3" style={{ color: "#FF774A" }}>
        CLÁUSULA {hasRegistro ? "NONA" : "OITAVA"} – DO FORO
      </h2>
      <p className="text-justify mb-8">
        <strong>{hasRegistro ? "9" : "8"}.1.</strong> As partes elegem o foro da Comarca de São Paulo, Estado de São Paulo, 
        para dirimir quaisquer controvérsias.
      </p>

      {/* FECHAMENTO */}
      <p className="text-justify mb-8">
        E, por estarem assim justas e contratadas, as partes assinam o presente instrumento em 2 (duas) vias de 
        igual teor e forma, na presença de 2 (duas) testemunhas, para que produza seus jurídicos e legais efeitos.
      </p>

      <p className="text-center mb-12">São Paulo, {dataFormatada}.</p>

      {/* ASSINATURAS */}
      <h2 className="font-bold text-center mb-6" style={{ color: "#FF774A", textDecoration: "underline" }}>ASSINATURAS</h2>
      
      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Assinatura Loft */}
        <div className="p-4" style={{ border: "1px solid #eee", borderRadius: "4px", backgroundColor: "#fafafa" }}>
          <p className="font-bold mb-1" style={{ color: "#FF774A" }}>{DADOS_LOFT.razaoSocial}</p>
          <p className="text-sm mb-4">CNPJ: {DADOS_LOFT.cnpj}</p>
          <div className="border-b border-black w-full h-8 mb-2"></div>
          <p className="text-sm">Nome: _________________________</p>
          <p className="text-sm">Cargo: _________________________</p>
        </div>

        {/* Assinatura Incorporadora */}
        <div className="p-4" style={{ border: "1px solid #eee", borderRadius: "4px", backgroundColor: "#fafafa" }}>
          <p className="font-bold mb-1" style={{ color: "#FF774A" }}>{dadosIncorporadora.razaoSocial}</p>
          <p className="text-sm mb-4">CNPJ: {dadosIncorporadora.cnpj}</p>
          <div className="border-b border-black w-full h-8 mb-2"></div>
          <p className="text-sm">Nome: {dadosIncorporadora.representanteLegal}</p>
          <p className="text-sm">CPF: {dadosIncorporadora.cpfRepresentante}</p>
        </div>
      </div>

      {/* TESTEMUNHAS */}
      <h2 className="font-bold mb-4">TESTEMUNHAS:</h2>
      
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <div className="border-b border-black w-full h-6 mb-2"></div>
          <p className="text-sm">Nome: _________________________</p>
          <p className="text-sm">CPF: _________________________</p>
        </div>
        <div>
          <div className="border-b border-black w-full h-6 mb-2"></div>
          <p className="text-sm">Nome: _________________________</p>
          <p className="text-sm">CPF: _________________________</p>
        </div>
      </div>

      {/* RODAPÉ */}
      <div className="text-center p-4 mt-8" style={{ backgroundColor: "#fafafa", borderRadius: "4px" }}>
        <p className="text-xs italic" style={{ color: "#666" }}>
          "Ao assinar este documento, as partes concordam integralmente com as condições comerciais aprovadas na simulação de viabilidade."
        </p>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE PRINCIPAL (DIALOG)
// ==========================================

export interface ContratoLoftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dadosProjeto: {
    vgv: number;
    unidades: number;
    ticketMedio: number;
    comissaoIncorporador: number;
    valorRegistroPorUnidade: number;
    registroTipo: string;
    nomeEmpreendimento: string;
  };
  dadosPreenchidos?: Partial<DadosIncorporadora>;
  onContratoGerado?: (contrato: ContratoData) => void;
}

export function ContratoLoftDialog({
  open,
  onOpenChange,
  dadosProjeto,
  dadosPreenchidos,
  onContratoGerado,
}: ContratoLoftDialogProps) {
  const { toast } = useToast();
  const contratoRef = useRef<HTMLDivElement>(null);
  const [currentStep, setCurrentStep] = useState<FluxoStep>("dados");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Dados da incorporadora (editáveis)
  const [dados, setDados] = useState<DadosIncorporadora>({
    razaoSocial: dadosPreenchidos?.razaoSocial || "",
    nomeFantasia: dadosPreenchidos?.nomeFantasia || "",
    cnpj: dadosPreenchidos?.cnpj || "",
    endereco: dadosPreenchidos?.endereco || "",
    cidade: dadosPreenchidos?.cidade || "",
    estado: dadosPreenchidos?.estado || "",
    representanteLegal: dadosPreenchidos?.representanteLegal || "",
    cpfRepresentante: dadosPreenchidos?.cpfRepresentante || "",
  });

  // Número do contrato
  const [numeroContrato] = useState(() => generateContractNumber());

  // Dados do projeto formatados
  const projetoDados: DadosProjeto = {
    vgvTotal: dadosProjeto.vgv,
    unidades: dadosProjeto.unidades,
    ticketMedio: dadosProjeto.ticketMedio,
    comissaoIncorporador: dadosProjeto.comissaoIncorporador,
    valorRegistroPorUnidade: dadosProjeto.valorRegistroPorUnidade,
    receitaRegistroTotal: dadosProjeto.valorRegistroPorUnidade * dadosProjeto.unidades,
    hasRegistro: dadosProjeto.registroTipo === "internalizado",
    nomeEmpreendimento: dadosProjeto.nomeEmpreendimento,
  };

  // Dados consolidados
  const contratoData: ContratoData = {
    dadosIncorporadora: dados,
    dadosProjeto: projetoDados,
    dataAssinatura: new Date().toISOString(),
    numeroContrato,
  };

  // Validação
  const camposFaltantes = CAMPOS_OBRIGATORIOS.filter(
    (campo) => !dados[campo.key]?.trim()
  ).map((campo) => campo.label);

  const isValid = camposFaltantes.length === 0;
  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  const handleInputChange = (field: keyof DadosIncorporadora, value: string) => {
    let formattedValue = value;
    if (field === "cnpj") formattedValue = formatCNPJ(value);
    if (field === "cpfRepresentante") formattedValue = formatCPF(value);
    if (field === "estado") formattedValue = value.toUpperCase().slice(0, 2);
    setDados((prev) => ({ ...prev, [field]: formattedValue }));
  };

  const handleNext = () => {
    if (currentStep === "dados") {
      if (!isValid) {
        toast({
          title: "Campos obrigatórios",
          description: `Preencha: ${camposFaltantes.join(", ")}`,
          variant: "destructive",
        });
        return;
      }
      setCurrentStep("revisao");
    } else if (currentStep === "revisao") {
      setCurrentStep("exportar");
    }
  };

  const handleBack = () => {
    if (currentStep === "revisao") setCurrentStep("dados");
    else if (currentStep === "exportar") setCurrentStep("revisao");
  };

  const handleExportPdf = async () => {
    if (!contratoRef.current) return;

    setIsGeneratingPdf(true);

    try {
      const printContent = contratoRef.current.innerHTML;
      const nomeArquivo = dados.razaoSocial.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_");

      // Gerar HTML completo e fazer upload para o Storage
      const contractHtmlData: ContractData = {
        razaoSocial: dados.razaoSocial,
        nomeFantasia: dados.nomeFantasia,
        cnpj: dados.cnpj,
        endereco: dados.endereco,
        cidade: dados.cidade,
        estado: dados.estado,
        representanteLegal: dados.representanteLegal,
        cpfRepresentante: dados.cpfRepresentante,
        vgvTotal: projetoDados.vgvTotal,
        unidades: projetoDados.unidades,
        ticketMedio: projetoDados.ticketMedio,
        comissaoIncorporador: projetoDados.comissaoIncorporador,
        valorRegistroPorUnidade: projetoDados.valorRegistroPorUnidade,
        receitaRegistroTotal: projetoDados.receitaRegistroTotal,
        hasRegistro: projetoDados.hasRegistro,
        nomeEmpreendimento: projetoDados.nomeEmpreendimento,
        numeroContrato,
        dataAssinatura: new Date().toISOString(),
      };

      const contractHtml = generateContractHtml(contractHtmlData);
      const contratoUrl = await uploadContractToStorage(contractHtml, numeroContrato);

      // Também abrir janela de impressão para download do PDF
      const printWindow = window.open("", "_blank");
      if (!printWindow) throw new Error("Não foi possível abrir a janela de impressão");

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Contrato_${nomeArquivo}</title>
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
              
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .text-justify { text-align: justify; }
              .font-bold { font-weight: 700; }
              .text-sm { font-size: 10pt; }
              .text-xs { font-size: 9pt; }
              .italic { font-style: italic; }
              
              .grid { display: grid; }
              .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
              .gap-8 { gap: 32px; }
              
              .mb-1 { margin-bottom: 4px; }
              .mb-2 { margin-bottom: 8px; }
              .mb-3 { margin-bottom: 12px; }
              .mb-4 { margin-bottom: 16px; }
              .mb-6 { margin-bottom: 24px; }
              .mb-8 { margin-bottom: 32px; }
              .mb-12 { margin-bottom: 48px; }
              .mt-8 { margin-top: 32px; }
              
              .p-3 { padding: 12px; }
              .p-4 { padding: 16px; }
              .p-8 { padding: 32px; }
              .pb-4 { padding-bottom: 16px; }
              .pl-8 { padding-left: 32px; }
              
              .w-full { width: 100%; }
              .h-6 { height: 24px; }
              .h-8 { height: 32px; }
              .h-10 { height: 40px; }
              
              .flex { display: flex; }
              .justify-between { justify-content: space-between; }
              .items-start { align-items: flex-start; }
              
              .border-b { border-bottom: 1px solid #000; }
              .border-black { border-color: #000; }
              
              .list-none { list-style: none; }
              .space-y-1 > * + * { margin-top: 4px; }
              
              table { width: 100%; border-collapse: collapse; }
              td { padding: 12px; }
              img { max-height: 40px; }
              
              @media print {
                body { padding: 20px 30px; }
                @page { margin: 15mm; size: A4; }
              }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);

      printWindow.document.close();

      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);

      toast({
        title: "Contrato salvo!",
        description: contratoUrl 
          ? "O contrato foi salvo e está disponível para download na negociação." 
          : "Use 'Salvar como PDF' na janela de impressão.",
      });

      // Retornar dados do contrato incluindo a URL
      onContratoGerado?.({ 
        ...contratoData, 
        contratoUrl: contratoUrl || undefined 
      });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleClose = () => {
    setCurrentStep("dados");
    setDados({
      razaoSocial: dadosPreenchidos?.razaoSocial || "",
      nomeFantasia: dadosPreenchidos?.nomeFantasia || "",
      cnpj: dadosPreenchidos?.cnpj || "",
      endereco: dadosPreenchidos?.endereco || "",
      cidade: dadosPreenchidos?.cidade || "",
      estado: dadosPreenchidos?.estado || "",
      representanteLegal: dadosPreenchidos?.representanteLegal || "",
      cpfRepresentante: dadosPreenchidos?.cpfRepresentante || "",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-primary" />
            Gerar Contrato de Prestação de Serviços
          </DialogTitle>
          <DialogDescription>
            Contrato #{numeroContrato}
          </DialogDescription>
        </DialogHeader>

        {/* Steps Indicator */}
        <div className="flex items-center justify-center gap-2 py-4 border-b">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors",
                  currentStep === step.id
                    ? "bg-primary text-primary-foreground"
                    : currentStepIndex > index
                    ? "bg-success/20 text-success"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {currentStepIndex > index ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span className="w-5 h-5 flex items-center justify-center rounded-full bg-current/20 text-xs font-medium">
                    {index + 1}
                  </span>
                )}
                <span className="font-medium">{step.label}</span>
              </div>
              {index < STEPS.length - 1 && <div className="w-8 h-px bg-border mx-2" />}
            </div>
          ))}
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 px-1">
          <div className="py-4">
            {/* Step 1: Dados */}
            {currentStep === "dados" && (
              <div className="space-y-4">
                <Alert className="bg-primary/5 border-primary/20">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  <AlertDescription>
                    Preencha os dados da incorporadora. Campos com * são obrigatórios.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="razaoSocial">Razão Social *</Label>
                    <Input
                      id="razaoSocial"
                      value={dados.razaoSocial}
                      onChange={(e) => handleInputChange("razaoSocial", e.target.value)}
                      placeholder="Ex: Incorporadora ABC Ltda"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nomeFantasia">Nome Fantasia</Label>
                    <Input
                      id="nomeFantasia"
                      value={dados.nomeFantasia}
                      onChange={(e) => handleInputChange("nomeFantasia", e.target.value)}
                      placeholder="Ex: ABC Construtora"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ *</Label>
                    <Input
                      id="cnpj"
                      value={dados.cnpj}
                      onChange={(e) => handleInputChange("cnpj", e.target.value)}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="endereco">Endereço *</Label>
                    <Input
                      id="endereco"
                      value={dados.endereco}
                      onChange={(e) => handleInputChange("endereco", e.target.value)}
                      placeholder="Ex: Av. Paulista, 1000, Sala 100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade *</Label>
                    <Input
                      id="cidade"
                      value={dados.cidade}
                      onChange={(e) => handleInputChange("cidade", e.target.value)}
                      placeholder="Ex: São Paulo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado">UF *</Label>
                    <Input
                      id="estado"
                      value={dados.estado}
                      onChange={(e) => handleInputChange("estado", e.target.value)}
                      placeholder="Ex: SP"
                      maxLength={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="representanteLegal">Representante Legal *</Label>
                    <Input
                      id="representanteLegal"
                      value={dados.representanteLegal}
                      onChange={(e) => handleInputChange("representanteLegal", e.target.value)}
                      placeholder="Nome completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpfRepresentante">CPF do Representante *</Label>
                    <Input
                      id="cpfRepresentante"
                      value={dados.cpfRepresentante}
                      onChange={(e) => handleInputChange("cpfRepresentante", e.target.value)}
                      placeholder="000.000.000-00"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Revisão */}
            {currentStep === "revisao" && (
              <div className="space-y-4">
                <Alert className="bg-secondary/5 border-secondary/20">
                  <FileText className="h-4 w-4 text-secondary" />
                  <AlertDescription>
                    Revise o contrato antes de gerar o PDF.
                  </AlertDescription>
                </Alert>

                <div ref={contratoRef}>
                  <ContratoDocumento data={contratoData} />
                </div>
              </div>
            )}

            {/* Step 3: Exportar */}
            {currentStep === "exportar" && (
              <div className="space-y-6">
                <Alert className="bg-success/5 border-success/20">
                  <Check className="h-4 w-4 text-success" />
                  <AlertDescription>
                    Contrato pronto para exportação!
                  </AlertDescription>
                </Alert>

                <div className="text-center py-8">
                  <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                    <FileCheck2 className="w-10 h-10 text-success" />
                  </div>
                  <h3 className="font-display text-xl font-bold mb-2">
                    Contrato #{numeroContrato}
                  </h3>
                  <p className="text-muted-foreground mb-6">{dados.razaoSocial}</p>

                  <Button
                    size="lg"
                    onClick={handleExportPdf}
                    disabled={isGeneratingPdf}
                    className="gap-2 bg-primary hover:bg-primary/90"
                  >
                    {isGeneratingPdf ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Gerando PDF...
                      </>
                    ) : (
                      <>
                        <Printer className="w-5 h-5" />
                        Gerar PDF
                      </>
                    )}
                  </Button>
                </div>

                {/* Hidden preview for PDF */}
                <div className="hidden">
                  <div ref={contratoRef}>
                    <ContratoDocumento data={contratoData} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={currentStep === "dados" ? handleClose : handleBack} className="gap-2">
            {currentStep === "dados" ? "Cancelar" : (
              <>
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </>
            )}
          </Button>

          {currentStep !== "exportar" && (
            <Button onClick={handleNext} className="gap-2 bg-secondary hover:bg-secondary/90">
              {currentStep === "dados" ? "Revisar Contrato" : "Exportar PDF"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}

          {currentStep === "exportar" && (
            <Button variant="outline" onClick={handleClose} className="gap-2">
              <Check className="w-4 h-4" />
              Concluir
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Export default para facilitar uso
export default ContratoLoftDialog;
