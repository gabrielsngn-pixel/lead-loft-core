import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileText, Download, Star, Eye } from "lucide-react";
import { generateContractTemplateHtml } from "@/lib/contractPdfGenerator";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface ContractTemplateCardProps {
  className?: string;
}

export function ContractTemplateCard({ className }: ContractTemplateCardProps) {
  const { toast } = useToast();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleDownload = () => {
    try {
      const html = generateContractTemplateHtml();
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Modelo_Contrato_Prestacao_Servicos_Loft.html";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download iniciado",
        description: "O modelo de contrato foi baixado com sucesso.",
      });
    } catch (error) {
      console.error("Error downloading template:", error);
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar o modelo de contrato.",
        variant: "destructive",
      });
    }
  };

  const handlePreview = () => {
    try {
      const html = generateContractTemplateHtml();
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (error) {
      console.error("Error previewing template:", error);
      toast({
        title: "Erro na visualização",
        description: "Não foi possível abrir a visualização.",
        variant: "destructive",
      });
    }
  };

  const handlePrint = () => {
    try {
      const html = generateContractTemplateHtml();
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } catch (error) {
      console.error("Error printing template:", error);
    }
  };

  return (
    <Card 
      className={cn(
        "stat-card p-0 overflow-hidden transition-all duration-200 hover:shadow-lg group ring-2 ring-primary/20 border-primary/30 flex flex-col",
        className
      )}
    >
      {/* Header with type indicator */}
      <div className="px-4 py-3 border-b bg-primary/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg border bg-red-100 text-red-600 border-red-200">
            <FileText className="w-4 h-4" />
          </div>
          <Badge variant="secondary" className="text-xs">
            PDF/HTML
          </Badge>
          <Badge className="bg-primary/10 text-primary text-xs flex items-center gap-1">
            <Star className="w-3 h-3 fill-current" />
            Recomendado
          </Badge>
        </div>
      </div>

      <CardContent className="p-4 flex flex-col flex-1">
        {/* Title and Description */}
        <h3 className="font-semibold text-foreground mb-1">
          Modelo de Contrato – Prestação de Serviços Loft
        </h3>
        <p className="text-sm text-muted-foreground mb-3">
          Modelo oficial do contrato de prestação de serviços de intermediação de crédito imobiliário, repasse e registro. Dados sensíveis substituídos por placeholders.
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          <Badge variant="outline" className="text-xs">contrato</Badge>
          <Badge variant="outline" className="text-xs">institucional</Badge>
          <Badge variant="outline" className="text-xs">modelo</Badge>
          <Badge variant="outline" className="text-xs">comercial</Badge>
        </div>

        {/* Spacer to push buttons to bottom */}
        <div className="flex-1" />

        {/* Info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4 pt-3 border-t">
          <span>Versão Vigente</span>
          <Badge variant="secondary" className="text-xs">Todos</Badge>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            variant="outline"
            className="flex-1" 
            size="sm"
            onClick={handlePreview}
          >
            <Eye className="w-4 h-4 mr-2" />
            Visualizar
          </Button>
          <Button 
            className="flex-1 btn-cta" 
            size="sm"
            onClick={handleDownload}
          >
            <Download className="w-4 h-4 mr-2" />
            Baixar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
