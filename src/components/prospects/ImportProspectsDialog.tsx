import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Download, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProspectCSVRow } from "@/types/prospects";

interface ImportProspectsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (rows: ProspectCSVRow[]) => Promise<{
    imported: number;
    ignored: number;
    reasons: Record<string, string>;
  }>;
  checkLimit: () => Promise<{ canImport: boolean; message?: string }>;
}

export function ImportProspectsDialog({
  open,
  onOpenChange,
  onImport,
  checkLimit,
}: ImportProspectsDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [limitError, setLimitError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    imported: number;
    ignored: number;
    reasons: Record<string, string>;
  } | null>(null);

  const handleOpenChange = async (newOpen: boolean) => {
    if (newOpen) {
      setFile(null);
      setResult(null);
      setLimitError(null);
      
      // Check import limit
      const limit = await checkLimit();
      if (!limit.canImport) {
        setLimitError(limit.message || "Limite de importação atingido");
      }
    }
    onOpenChange(newOpen);
  };

  const downloadTemplate = () => {
    const headers = "nome_completo,cargo,empresa,email,telefone,linkedin_url";
    const example = "João Silva,Diretor Comercial,ABC Incorporadora,joao@abc.com.br,11999998888,https://linkedin.com/in/joaosilva";
    const csv = `${headers}\n${example}`;
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "template_prospects.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string): ProspectCSVRow[] => {
    const lines = text.split("\n").filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    const requiredHeaders = ["nome_completo", "cargo", "empresa", "email", "linkedin_url"];
    
    for (const required of requiredHeaders) {
      if (!headers.includes(required)) {
        throw new Error(`Coluna obrigatória ausente: ${required}`);
      }
    }

    const rows: ProspectCSVRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.trim());
      if (values.length < headers.length) continue;

      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });

      // Validate required fields
      if (!row.nome_completo || !row.cargo || !row.empresa || !row.email || !row.linkedin_url) {
        continue;
      }

      rows.push(row as ProspectCSVRow);
    }

    return rows;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".csv")) {
        toast({
          title: "Formato inválido",
          description: "Por favor, selecione um arquivo CSV",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        throw new Error("Nenhum registro válido encontrado no arquivo");
      }

      if (rows.length > 25) {
        throw new Error(`Máximo de 25 registros por importação. O arquivo contém ${rows.length} registros.`);
      }

      const importResult = await onImport(rows);
      setResult(importResult);
      
      toast({
        title: "Importação concluída",
        description: `${importResult.imported} registros importados, ${importResult.ignored} ignorados`,
      });
    } catch (error: any) {
      toast({
        title: "Erro na importação",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Importar Prospects</DialogTitle>
          <DialogDescription>
            Importe prospects de um arquivo CSV. Máximo de 25 registros por importação, 
            1 importação por semana.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {limitError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{limitError}</AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Download Template */}
              <Button
                variant="outline"
                className="w-full"
                onClick={downloadTemplate}
              >
                <Download className="w-4 h-4 mr-2" />
                Baixar Template CSV
              </Button>

              {/* File Upload */}
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {file ? file.name : "Selecionar Arquivo CSV"}
                </Button>
              </div>

              {/* Result */}
              {result && (
                <div className="space-y-2">
                  <Alert variant={result.imported > 0 ? "default" : "destructive"}>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{result.imported}</strong> prospects importados.
                      {result.ignored > 0 && (
                        <> <strong>{result.ignored}</strong> ignorados (duplicados).</>
                      )}
                    </AlertDescription>
                  </Alert>

                  {Object.keys(result.reasons).length > 0 && (
                    <div className="text-xs text-muted-foreground max-h-32 overflow-y-auto">
                      <p className="font-medium mb-1">Registros ignorados:</p>
                      {Object.entries(result.reasons).map(([key, reason]) => (
                        <p key={key}>• {key}: {reason}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {result ? "Fechar" : "Cancelar"}
          </Button>
          {!limitError && !result && (
            <Button 
              onClick={handleImport} 
              disabled={!file || loading}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Importar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
