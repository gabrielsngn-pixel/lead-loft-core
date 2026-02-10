import { useState, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileSpreadsheet, AlertCircle } from "lucide-react";
import type { Empreendimento } from "@/types/empreendimentos";

interface ImportEmpreendimentosDialogProps {
  onImport: (records: Partial<Empreendimento>[], fonte: string) => void;
  isLoading: boolean;
}

const FIELD_MAP: Record<string, string> = {
  "nome do empreendimento": "nome_empreendimento",
  "empreendimento": "nome_empreendimento",
  "nome": "nome_empreendimento",
  "construtora": "construtora",
  "incorporadora": "construtora",
  "construtora / incorporadora": "construtora",
  "cidade": "cidade",
  "estado": "estado",
  "região": "estado",
  "estado / região": "estado",
  "uf": "estado",
  "data prevista de habite-se": "data_habitese",
  "data habite-se": "data_habitese",
  "habite-se": "data_habitese",
  "data habitese": "data_habitese",
  "tipo de empreendimento": "tipo_empreendimento",
  "tipo": "tipo_empreendimento",
  "unidades estimadas": "unidades_estimadas",
  "unidades": "unidades_estimadas",
  "quantidade de unidades": "unidades_estimadas",
  "ticket médio": "ticket_medio",
  "ticket medio": "ticket_medio",
  "vgv estimado": "vgv_estimado",
  "vgv": "vgv_estimado",
  "banco financiador": "banco_financiador",
  "banco": "banco_financiador",
  "modelo de repasse": "modelo_repasse",
  "modelo repasse": "modelo_repasse",
  "observações": "observacoes",
  "observacoes": "observacoes",
};

export function ImportEmpreendimentosDialog({ onImport, isLoading }: ImportEmpreendimentosDialogProps) {
  const [open, setOpen] = useState(false);
  const [fonte, setFonte] = useState("orulo");
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDownloadTemplate = () => {
    const headers = [
      "Nome do Empreendimento",
      "Construtora",
      "Cidade",
      "Estado",
      "Data Habite-se",
      "Tipo de Empreendimento",
      "Unidades Estimadas",
      "Ticket Médio",
      "VGV Estimado",
      "Banco Financiador",
      "Modelo de Repasse",
      "Observações",
    ];
    const csv = headers.join(",");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo-empreendimentos.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseDate = (val: string): string | null => {
    if (!val) return null;
    // Try DD/MM/YYYY
    const brMatch = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (brMatch) {
      return new Date(`${brMatch[3]}-${brMatch[2].padStart(2, "0")}-${brMatch[1].padStart(2, "0")}`).toISOString();
    }
    // Try MM/YYYY
    const monthYear = val.match(/^(\d{1,2})\/(\d{4})$/);
    if (monthYear) {
      return new Date(`${monthYear[2]}-${monthYear[1].padStart(2, "0")}-01`).toISOString();
    }
    // Try YYYY
    if (/^\d{4}$/.test(val)) {
      return new Date(`${val}-01-01`).toISOString();
    }
    // Try ISO
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d.toISOString();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const lines = text.split("\n").filter((l) => l.trim());
        if (lines.length < 2) {
          setImportError("Arquivo vazio ou sem dados.");
          return;
        }

        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
        const records: Partial<Empreendimento>[] = [];
        const errors: string[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",").map((v) => v.trim());
          const row: any = {};

          headers.forEach((header, idx) => {
            const field = FIELD_MAP[header];
            if (field && values[idx]) {
              if (field === "data_habitese") {
                row[field] = parseDate(values[idx]);
              } else if (["unidades_estimadas", "ticket_medio", "vgv_estimado"].includes(field)) {
                const num = parseFloat(values[idx].replace(/[^\d.,]/g, "").replace(",", "."));
                if (!isNaN(num)) row[field] = num;
              } else {
                row[field] = values[idx];
              }
            }
          });

          if (!row.nome_empreendimento || !row.construtora || !row.cidade) {
            errors.push(`Linha ${i + 1}: campos obrigatórios faltando (Nome, Construtora, Cidade)`);
            continue;
          }

          records.push(row);
        }

        if (errors.length > 0 && records.length === 0) {
          setImportError(errors.slice(0, 5).join("\n"));
          return;
        }

        if (records.length === 0) {
          setImportError("Nenhum registro válido encontrado.");
          return;
        }

        onImport(records, fonte);
        setOpen(false);

        if (errors.length > 0) {
          toast({
            title: "Atenção",
            description: `${errors.length} linhas ignoradas por erros de validação.`,
            variant: "destructive",
          });
        }
      } catch {
        setImportError("Erro ao processar o arquivo. Verifique o formato.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="w-4 h-4 mr-2" />
          Importar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importar Empreendimentos</DialogTitle>
          <DialogDescription>
            Faça upload de um CSV com empreendimentos. Duplicatas serão automaticamente ignoradas.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Fonte da base</Label>
            <Select value={fonte} onValueChange={setFonte}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="orulo">Órulo</SelectItem>
                <SelectItem value="geofusion">GeoFusion</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" className="w-full" onClick={handleDownloadTemplate}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Baixar Modelo CSV
          </Button>

          <div className="space-y-2">
            <Label htmlFor="emp-file-upload">Selecionar arquivo</Label>
            <Input
              id="emp-file-upload"
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={isLoading}
            />
          </div>

          {importError && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <pre className="whitespace-pre-wrap font-sans">{importError}</pre>
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Campos obrigatórios: Nome, Construtora, Cidade</p>
            <p>• Duplicidade verificada por: Nome + Cidade</p>
            <p>• Formatos de data aceitos: DD/MM/AAAA, MM/AAAA, AAAA</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
