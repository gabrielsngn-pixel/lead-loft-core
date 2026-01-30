import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, FileSpreadsheet, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface FieldConfig {
  key: string;
  label: string;
  required?: boolean;
}

interface ExportImportButtonsProps {
  moduleName: string;
  data: any[];
  columns: FieldConfig[];
  onImport?: (data: any[]) => void;
  templateFields?: FieldConfig[];
}

export function ExportImportButtons({
  moduleName,
  data,
  columns,
  onImport,
  templateFields,
}: ExportImportButtonsProps) {
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleExport = () => {
    const csvContent = [
      columns.map((col) => col.label).join(","),
      ...data.map((row) =>
        columns
          .map((col) => {
            const value = row[col.key];
            if (value instanceof Date) {
              return format(value, "dd/MM/yyyy HH:mm");
            }
            if (typeof value === "object" && value !== null) {
              return JSON.stringify(value).replace(/,/g, ";");
            }
            return String(value ?? "").replace(/,/g, ";");
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${moduleName}-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Exportação concluída",
      description: `${data.length} registros exportados com sucesso.`,
    });
  };

  const handleDownloadTemplate = () => {
    const fields = templateFields || columns;
    const csvContent = fields.map((f) => f.label).join(",");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `modelo-${moduleName}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const validateCNPJ = (cnpj: string): boolean => {
    const cleaned = cnpj.replace(/[^\d]/g, "");
    if (cleaned.length !== 14) return false;
    // Basic validation - could be extended
    return true;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError(null);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split("\n").filter((line) => line.trim());
        
        if (lines.length < 2) {
          setImportError("Arquivo vazio ou sem dados.");
          return;
        }

        const headers = lines[0].split(",").map((h) => h.trim());
        const fields = templateFields || columns;
        
        // Validate headers
        const missingHeaders = fields
          .filter((f) => f.required !== false)
          .filter((f) => !headers.some((h) => h.toLowerCase() === f.label.toLowerCase()));

        if (missingHeaders.length > 0) {
          setImportError(
            `Colunas obrigatórias faltando: ${missingHeaders.map((h) => h.label).join(", ")}`
          );
          return;
        }

        const importedData: any[] = [];
        const errors: string[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",").map((v) => v.trim());
          const row: any = {};

          headers.forEach((header, idx) => {
            const field = fields.find(
              (f) => f.label.toLowerCase() === header.toLowerCase()
            );
            if (field) {
              row[field.key] = values[idx] || "";
            }
          });

          // Validate CNPJ if present
          if (row.cnpj && !validateCNPJ(row.cnpj)) {
            errors.push(`Linha ${i + 1}: CNPJ inválido`);
            continue;
          }

          importedData.push(row);
        }

        if (errors.length > 0) {
          setImportError(errors.slice(0, 3).join("\n") + (errors.length > 3 ? `\n...e mais ${errors.length - 3} erros` : ""));
          return;
        }

        if (onImport) {
          onImport(importedData);
        }

        toast({
          title: "Importação concluída",
          description: `${importedData.length} registros importados com sucesso.`,
        });

        setImportDialogOpen(false);
      } catch (error) {
        setImportError("Erro ao processar o arquivo. Verifique o formato.");
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleExport}>
        <Download className="w-4 h-4 mr-2" />
        Exportar CSV
      </Button>

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Importar
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Importar {moduleName}</DialogTitle>
            <DialogDescription>
              Faça upload de um arquivo CSV com os dados para importar. Use o modelo padrão para garantir compatibilidade.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleDownloadTemplate}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Baixar Modelo CSV
            </Button>

            <div className="space-y-2">
              <Label htmlFor="file-upload">Selecionar arquivo</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
            </div>

            {importError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <pre className="whitespace-pre-wrap font-sans">{importError}</pre>
              </div>
            )}

            <div className="text-xs text-muted-foreground space-y-1">
              <p>• O CNPJ será usado como chave única (não duplica)</p>
              <p>• Campos obrigatórios devem estar preenchidos</p>
              <p>• Formato de data: DD/MM/AAAA</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
