import { useState, useRef } from "react";
import { format } from "date-fns";
import {
  FileCheck2,
  ArrowLeft,
  ArrowRight,
  Download,
  Check,
  Loader2,
  AlertCircle,
  FileText,
  Printer,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { SimuladorResults } from "@/lib/simulador";
import {
  ContratoData,
  ContratoFluxoStep,
  DadosIncorporadora,
  DadosProjeto,
  defaultDadosIncorporadora,
} from "./types";
import { DadosIncorporadoraForm } from "./DadosIncorporadoraForm";
import { ContratoPreview } from "./ContratoPreview";

interface ContratoFluxoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: SimuladorResults;
  vgv: number;
  unidades: number;
  ticketMedio: number;
  comissaoIncorporador: number;
  valorRegistroPorUnidade: number;
  registroTipo: string;
  viabilidadeData?: {
    cnpj?: string;
    endereco?: string;
    cidade?: string;
    estado?: string;
    nome_empreendimento?: string;
  };
  onContratoGerado?: (contrato: ContratoData) => void;
}

const STEPS: { id: ContratoFluxoStep; label: string; description: string }[] = [
  { id: "dados", label: "Dados", description: "Dados da incorporadora" },
  { id: "revisao", label: "Revisão", description: "Conferir contrato" },
  { id: "assinatura", label: "Exportar", description: "Gerar PDF" },
];

function generateContractNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `LOFT-${year}-${random}`;
}

export function ContratoFluxoDialog({
  open,
  onOpenChange,
  results,
  vgv,
  unidades,
  ticketMedio,
  comissaoIncorporador,
  valorRegistroPorUnidade,
  registroTipo,
  viabilidadeData,
  onContratoGerado,
}: ContratoFluxoDialogProps) {
  const { toast } = useToast();
  const contratoRef = useRef<HTMLDivElement>(null);
  const [currentStep, setCurrentStep] = useState<ContratoFluxoStep>("dados");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  // Dados da incorporadora (editáveis)
  const [dadosIncorporadora, setDadosIncorporadora] = useState<DadosIncorporadora>(() => ({
    ...defaultDadosIncorporadora,
    cnpj: viabilidadeData?.cnpj || "",
    endereco: viabilidadeData?.endereco || "",
    cidade: viabilidadeData?.cidade || "",
    estado: viabilidadeData?.estado || "",
  }));

  // Dados do projeto (congelados da simulação)
  const dadosProjeto: DadosProjeto = {
    vgvTotal: vgv,
    unidades,
    ticketMedio,
    comissaoIncorporador,
    valorRegistroPorUnidade,
    receitaRegistroTotal: valorRegistroPorUnidade * unidades,
    hasRegistro: registroTipo === "internalizado",
  };

  // Número do contrato gerado
  const [numeroContrato] = useState(() => generateContractNumber());
  const dataAprovacao = new Date().toISOString();

  // Dados consolidados do contrato
  const contratoData: ContratoData = {
    dadosIncorporadora,
    dadosProjeto,
    dataAprovacao,
    numeroContrato,
  };

  // Validação dos dados obrigatórios com lista de campos faltantes
  const camposFaltantes: string[] = [];
  if (!dadosIncorporadora.razaoSocial.trim()) camposFaltantes.push("Razão Social");
  if (!dadosIncorporadora.cnpj.trim()) camposFaltantes.push("CNPJ");
  if (!dadosIncorporadora.endereco.trim()) camposFaltantes.push("Endereço");
  if (!dadosIncorporadora.cidade.trim()) camposFaltantes.push("Cidade");
  if (!dadosIncorporadora.estado.trim()) camposFaltantes.push("UF");
  if (!dadosIncorporadora.representanteLegal.trim()) camposFaltantes.push("Nome do Representante");
  if (!dadosIncorporadora.cpfRepresentante.trim()) camposFaltantes.push("CPF do Representante");
  
  const isValidDados = camposFaltantes.length === 0;

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  const handleNext = () => {
    if (currentStep === "dados") {
      if (!isValidDados) {
        toast({
          title: "Campos obrigatórios não preenchidos",
          description: `Faltam: ${camposFaltantes.join(", ")}`,
          variant: "destructive",
        });
        return;
      }
      setCurrentStep("revisao");
    } else if (currentStep === "revisao") {
      setCurrentStep("assinatura");
    }
  };

  const handleBack = () => {
    if (currentStep === "revisao") {
      setCurrentStep("dados");
    } else if (currentStep === "assinatura") {
      setCurrentStep("revisao");
    }
  };

  const handleExportPdf = async () => {
    if (!contratoRef.current) return;
    
    setIsGeneratingPdf(true);
    
    try {
      // Usar window.print() com CSS de impressão
      const printContent = contratoRef.current.innerHTML;
      const razaoSocialFormatted = dadosIncorporadora.razaoSocial
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .replace(/\s+/g, "_");
      
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        throw new Error("Não foi possível abrir a janela de impressão");
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Contrato_${razaoSocialFormatted}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
              
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                font-size: 11pt;
                line-height: 1.6;
                color: #000;
                background: white;
                padding: 40px 50px;
              }
              
              h1, h2 {
                font-family: 'Inter', sans-serif;
                font-weight: 700;
              }
              
              h1 { font-size: 14pt; margin-bottom: 24px; }
              h2 { font-size: 12pt; margin-bottom: 12px; }
              
              p { margin-bottom: 8px; }
              
              .text-center { text-align: center; }
              .text-justify { text-align: justify; }
              .text-right { text-align: right; }
              .font-semibold { font-weight: 600; }
              .font-bold { font-weight: 700; }
              .font-medium { font-weight: 500; }
              .text-sm { font-size: 10pt; }
              .text-xs { font-size: 9pt; }
              .text-base { font-size: 11pt; }
              .text-lg { font-size: 13pt; }
              .italic { font-style: italic; }
              
              .text-gray-600 { color: #666; }
              .text-gray-500 { color: #888; }
              .text-black { color: #000; }
              
              .bg-white { background: white; }
              
              .border { border: 1px solid #e5e5e5; }
              .border-black { border-color: #000; }
              .border-b { border-bottom: 1px solid #000; }
              .border-collapse { border-collapse: collapse; }
              
              .rounded-lg { border-radius: 8px; }
              
              .p-3 { padding: 12px; }
              .p-8 { padding: 32px; }
              .pl-8 { padding-left: 32px; }
              
              .mb-2 { margin-bottom: 8px; }
              .mb-3 { margin-bottom: 12px; }
              .mb-4 { margin-bottom: 16px; }
              .mb-6 { margin-bottom: 24px; }
              .mb-8 { margin-bottom: 32px; }
              .mb-12 { margin-bottom: 48px; }
              .mt-2 { margin-top: 8px; }
              .mt-8 { margin-top: 32px; }
              
              .space-y-1 > * + * { margin-top: 4px; }
              .space-y-2 > * + * { margin-top: 8px; }
              .space-y-4 > * + * { margin-top: 16px; }
              
              .grid { display: grid; }
              .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
              .gap-8 { gap: 32px; }
              
              .flex { display: flex; }
              .justify-between { justify-content: space-between; }
              .items-start { align-items: flex-start; }
              
              .w-full { width: 100%; }
              .h-8 { height: 32px; }
              .h-12 { height: 48px; }
              
              .list-disc { list-style-type: disc; }
              
              table { width: 100%; border-collapse: collapse; }
              td { padding: 12px; }
              
              img { max-height: 48px; }
              
              @media print {
                body { padding: 20px 30px; }
                @page { 
                  margin: 15mm; 
                  size: A4;
                }
              }
              
              /* Page breaks */
              .page-break { page-break-before: always; }
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
        title: "PDF em geração",
        description: "Use 'Salvar como PDF' na janela de impressão.",
      });

      // Notificar que o contrato foi gerado
      onContratoGerado?.(contratoData);

    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Não foi possível gerar o documento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleClose = () => {
    setCurrentStep("dados");
    setDadosIncorporadora({
      ...defaultDadosIncorporadora,
      cnpj: viabilidadeData?.cnpj || "",
      endereco: viabilidadeData?.endereco || "",
      cidade: viabilidadeData?.cidade || "",
      estado: viabilidadeData?.estado || "",
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
            Simulação aprovada com margem de {results.margemFinalPercent.toFixed(2)}%
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
              {index < STEPS.length - 1 && (
                <div className="w-8 h-px bg-border mx-2" />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 px-1">
          <div className="py-4">
            {/* Step 1: Dados da Incorporadora */}
            {currentStep === "dados" && (
              <div className="space-y-4">
                <Alert className="bg-primary/5 border-primary/20">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  <AlertDescription>
                    Preencha os dados da incorporadora que serão utilizados no contrato. 
                    Os campos marcados com * são obrigatórios.
                  </AlertDescription>
                </Alert>
                
                <DadosIncorporadoraForm
                  dados={dadosIncorporadora}
                  onChange={setDadosIncorporadora}
                />
              </div>
            )}

            {/* Step 2: Revisão do Contrato */}
            {currentStep === "revisao" && (
              <div className="space-y-4">
                <Alert className="bg-secondary/5 border-secondary/20">
                  <FileText className="h-4 w-4 text-secondary" />
                  <AlertDescription>
                    Revise o contrato antes de gerar o PDF. Você pode voltar e editar 
                    os dados da incorporadora se necessário.
                  </AlertDescription>
                </Alert>

                <div ref={contratoRef}>
                  <ContratoPreview data={contratoData} />
                </div>
              </div>
            )}

            {/* Step 3: Exportar PDF */}
            {currentStep === "assinatura" && (
              <div className="space-y-6">
                <Alert className="bg-success/5 border-success/20">
                  <Check className="h-4 w-4 text-success" />
                  <AlertDescription>
                    Contrato pronto para exportação! Clique no botão abaixo para 
                    gerar o PDF do contrato.
                  </AlertDescription>
                </Alert>

                <div className="text-center py-8">
                  <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                    <FileCheck2 className="w-10 h-10 text-success" />
                  </div>
                  <h3 className="font-display text-xl font-bold mb-2">
                    Contrato #{numeroContrato}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {dadosIncorporadora.razaoSocial}
                  </p>

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
                        Gerar e Imprimir PDF
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground mt-4">
                    Quando aplicável, a cobrança do registro ao cliente final é realizada pela 
                    incorporadora, que se compromete contratualmente a repassar os valores devidos à Loft.
                  </p>
                </div>

                {/* Preview oculto para geração do PDF */}
                <div className="hidden">
                  <div ref={contratoRef}>
                    <ContratoPreview data={contratoData} forPrint />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={currentStep === "dados" ? handleClose : handleBack}
            className="gap-2"
          >
            {currentStep === "dados" ? (
              "Cancelar"
            ) : (
              <>
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </>
            )}
          </Button>

          {currentStep !== "assinatura" && (
            <Button
              onClick={handleNext}
              disabled={currentStep === "dados" && !isValidDados}
              className="gap-2 bg-secondary hover:bg-secondary/90"
            >
              {currentStep === "dados" ? "Revisar Contrato" : "Exportar PDF"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}

          {currentStep === "assinatura" && (
            <Button
              variant="outline"
              onClick={handleClose}
              className="gap-2"
            >
              <Check className="w-4 h-4" />
              Concluir
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
