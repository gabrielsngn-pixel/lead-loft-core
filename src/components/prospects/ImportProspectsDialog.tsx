import { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  Download,
  AlertCircle,
  CheckCircle,
  Loader2,
  UserCheck,
  AlertTriangle,
  ArrowLeft,
  Building2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProspectCSVRow } from "@/types/prospects";
import { supabase } from "@/integrations/supabase/client";

interface Consultant {
  id: string;
  nome: string;
  email: string;
}

interface ReviewRow extends ProspectCSVRow {
  index: number;
  selected: boolean;
  companyFlag?: "prospects" | "contatos" | "both";
  companyFlagLabel?: string;
  consultorLoft?: string;
}

interface ImportProspectsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (
    rows: ProspectCSVRow[],
    consultant?: { id: string; nome: string }
  ) => Promise<{
    imported: number;
    ignored: number;
    reasons: Record<string, string>;
  }>;
  checkLimit: () => Promise<{ canImport: boolean; message?: string }>;
}

type Step = "upload" | "review" | "result";

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
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [selectedConsultant, setSelectedConsultant] = useState<string>("");
  const [fetchingConsultants, setFetchingConsultants] = useState(false);
  const [step, setStep] = useState<Step>("upload");
  const [reviewRows, setReviewRows] = useState<ReviewRow[]>([]);
  const [detectedConsultor, setDetectedConsultor] = useState<string | null>(null);
  const [result, setResult] = useState<{
    imported: number;
    ignored: number;
    reasons: Record<string, string>;
  } | null>(null);

  const fetchConsultants = async () => {
    setFetchingConsultants(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, nome, email")
        .neq("role", "pending")
        .order("nome");

      if (error) {
        console.error("Erro ao buscar consultores:", error);
        return;
      }

      setConsultants(
        (data || []).map((d) => ({ id: d.user_id, nome: d.nome, email: d.email }))
      );
    } finally {
      setFetchingConsultants(false);
    }
  };

  const handleOpenChange = async (newOpen: boolean) => {
    if (newOpen) {
      setFile(null);
      setResult(null);
      setLimitError(null);
      setSelectedConsultant("");
      setStep("upload");
      setReviewRows([]);
      setDetectedConsultor(null);
      fetchConsultants();

      const limit = await checkLimit();
      if (!limit.canImport) {
        setLimitError(limit.message || "Limite de importação atingido");
      }
    }
    onOpenChange(newOpen);
  };

  const downloadTemplate = () => {
    const headers =
      "First Name,Last Name,Title,Company Name,Company Name for Emails,Email,Email Status,Primary Email Source,Primary Email Verification Source,Email Confidence,Primary Email Catch-all Status,Primary Email Last Verified At,Seniority,Departments,Contact Owner,Work Direct Phone,Home Phone,Mobile Phone,Corporate Phone,Other Phone,Stage,Lists,Last Contacted,Account Owner,# Employees,Industry,Keywords,Person Linkedin Url,Website,Company Linkedin Url,Facebook Url,Twitter Url,City,State,Country,Company Address,Company City,Company State,Company Country,Company Phone,Technologies,Annual Revenue,Total Funding,Latest Funding,Latest Funding Amount,Last Raised At,Subsidiary of,Email Sent,Email Open,Email Bounced,Replied,Demoed,Number of Retail Locations,Apollo Contact Id,Apollo Account Id,Secondary Email,Secondary Email Source,Secondary Email Status,Secondary Email Verification Source,Tertiary Email,Tertiary Email Source,Tertiary Email Status,Tertiary Email Verification Source,Qualify Contact";
    const example =
      "João,Silva,Diretor Comercial,ABC Incorporadora,ABC Incorporadora,joao@abc.com.br,Verified,Apollo,Apollo,,,2026-01-01T12:00:00+00:00,C suite,,user@email.com,,,11999998888,,,Cold,,,user@email.com,50,real estate,,https://linkedin.com/in/joaosilva,https://abc.com.br,,,,,São Paulo,SP,Brazil,,São Paulo,SP,Brazil,,,,,,,,,,,false,false,false,false,,,,,,,,,,,,";
    const csv = `${headers}\n${example}`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "template_apollo_prospects.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const parseCSV = (text: string): ProspectCSVRow[] => {
    const lines = text.split("\n").filter((line) => line.trim());
    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0]).map((h) =>
      h.toLowerCase().replace(/\s+/g, "_")
    );

    const requiredMappings: Record<string, string[]> = {
      first_name: ["first_name"],
      last_name: ["last_name"],
      title: ["title"],
      company_name: ["company_name"],
      email: ["email"],
      person_linkedin_url: ["person_linkedin_url"],
    };

    for (const [key, possibleNames] of Object.entries(requiredMappings)) {
      const found = possibleNames.some((name) => headers.includes(name));
      if (!found) {
        throw new Error(
          `Coluna obrigatória ausente: ${key.replace(/_/g, " ")}`
        );
      }
    }

    const rows: ProspectCSVRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length < 6) continue;

      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });

      const firstName = row["first_name"] || "";
      const lastName = row["last_name"] || "";
      const nomeCompleto = `${firstName} ${lastName}`.trim();
      const cargo = row["title"] || "";
      const empresa = row["company_name"] || "";
      const email = row["email"] || "";
      const linkedinUrl = row["person_linkedin_url"] || "";
      const telefone =
        row["mobile_phone"] ||
        row["work_direct_phone"] ||
        row["corporate_phone"] ||
        row["company_phone"] ||
        "";

      if (!nomeCompleto || !cargo || !empresa || !email || !linkedinUrl) {
        continue;
      }

      rows.push({
        nome_completo: nomeCompleto,
        cargo,
        empresa,
        email,
        telefone: telefone.replace(/[^\d+]/g, ""),
        linkedin_url: linkedinUrl,
      });
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
      setStep("upload");
      setReviewRows([]);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        throw new Error("Nenhum registro válido encontrado no arquivo");
      }

      // Fetch existing companies from prospects and leads
      const [prospectsRes, leadsRes] = await Promise.all([
        supabase.from("prospects").select("empresa"),
        supabase.from("leads").select("razao_social, nome_fantasia"),
      ]);

      const existingProspectCompanies = new Set(
        (prospectsRes.data || []).map((p) => p.empresa.toLowerCase().trim())
      );

      const existingLeadCompanies = new Set<string>();
      (leadsRes.data || []).forEach((l) => {
        existingLeadCompanies.add(l.razao_social.toLowerCase().trim());
        if (l.nome_fantasia) {
          existingLeadCompanies.add(l.nome_fantasia.toLowerCase().trim());
        }
      });

      // Build review rows with flags
      const reviewed: ReviewRow[] = rows.map((row, index) => {
        const empresaLower = row.empresa.toLowerCase().trim();
        const inProspects = existingProspectCompanies.has(empresaLower);
        const inContatos = existingLeadCompanies.has(empresaLower);

        let companyFlag: ReviewRow["companyFlag"];
        let companyFlagLabel: string | undefined;

        if (inProspects && inContatos) {
          companyFlag = "both";
          companyFlagLabel = "Já existe em Prospects e Contatos Ativos";
        } else if (inContatos) {
          companyFlag = "contatos";
          companyFlagLabel = "Já existe em Contatos Ativos";
        } else if (inProspects) {
          companyFlag = "prospects";
          companyFlagLabel = "Já existe em Prospects";
        }

        return {
          ...row,
          index,
          selected: !companyFlag, // Auto-deselect flagged ones
          companyFlag,
          companyFlagLabel,
        };
      });

      setReviewRows(reviewed);

      const flaggedCount = reviewed.filter((r) => r.companyFlag).length;
      if (flaggedCount > 0) {
        setStep("review");
      } else {
        // No conflicts, import directly
        await executeImport(reviewed);
      }
    } catch (error: any) {
      toast({
        title: "Erro na análise",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const executeImport = async (rows: ReviewRow[]) => {
    setLoading(true);
    try {
      const selectedRows = rows
        .filter((r) => r.selected)
        .map(({ index, selected, companyFlag, companyFlagLabel, ...csvRow }) => csvRow);

      if (selectedRows.length === 0) {
        toast({
          title: "Nenhum registro selecionado",
          description: "Selecione ao menos um registro para importar.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const consultant =
        selectedConsultant && selectedConsultant !== "none"
          ? consultants.find((c) => c.id === selectedConsultant)
          : undefined;

      const importResult = await onImport(
        selectedRows,
        consultant ? { id: consultant.id, nome: consultant.nome } : undefined
      );
      setResult(importResult);
      setStep("result");

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

  const handleConfirmReview = () => {
    executeImport(reviewRows);
  };

  const toggleRow = (index: number) => {
    setReviewRows((prev) =>
      prev.map((r) => (r.index === index ? { ...r, selected: !r.selected } : r))
    );
  };

  const toggleAllFlagged = (selected: boolean) => {
    setReviewRows((prev) =>
      prev.map((r) => (r.companyFlag ? { ...r, selected } : r))
    );
  };

  const selectedConsultantObj = consultants.find(
    (c) => c.id === selectedConsultant
  );

  const flaggedRows = reviewRows.filter((r) => r.companyFlag);
  const unflaggedRows = reviewRows.filter((r) => !r.companyFlag);
  const selectedCount = reviewRows.filter((r) => r.selected).length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {step === "review"
              ? "Revisão de Empresas Existentes"
              : "Importar Prospects do Apollo"}
          </DialogTitle>
          <DialogDescription>
            {step === "review"
              ? `${flaggedRows.length} registro(s) pertencem a empresas já cadastradas. Revise antes de importar.`
              : "Importe prospects diretamente do Apollo.io usando o arquivo CSV exportado."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* STEP: Upload */}
          {step === "upload" && (
            <div className="space-y-4 py-4">
              {limitError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{limitError}</AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-primary" />
                      Consultor responsável pela base
                    </Label>
                    <Select
                      value={selectedConsultant}
                      onValueChange={setSelectedConsultant}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            fetchingConsultants
                              ? "Carregando..."
                              : "Selecionar consultor (opcional)"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          Nenhum (atribuir depois)
                        </SelectItem>
                        {consultants.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nome} ({c.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      O consultor selecionado será definido como proprietário de
                      todos os prospects importados.
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full text-left justify-start"
                    onClick={downloadTemplate}
                  >
                    <Download className="w-4 h-4 mr-2 flex-shrink-0" />
                    Baixar Template Apollo.io
                  </Button>

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
                </>
              )}
            </div>
          )}

          {/* STEP: Review */}
          {step === "review" && (
            <div className="flex-1 overflow-hidden flex flex-col gap-3 py-2">
              {/* Summary bar */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  <strong>{selectedCount}</strong> de{" "}
                  <strong>{reviewRows.length}</strong> selecionados para importar
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleAllFlagged(true)}
                  >
                    Incluir todos
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleAllFlagged(false)}
                  >
                    Excluir todos
                  </Button>
                </div>
              </div>

              {/* Flagged rows */}
              <ScrollArea className="flex-1 min-h-0 max-h-[40vh] border rounded-lg">
                <div className="p-1">
                  {flaggedRows.length > 0 && (
                    <div className="space-y-1">
                      <div className="px-3 py-2 bg-muted/50 rounded-md">
                        <p className="text-xs font-semibold flex items-center gap-1.5 text-amber-600">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Empresas já cadastradas ({flaggedRows.length})
                        </p>
                      </div>
                      {flaggedRows.map((row) => (
                        <label
                          key={row.index}
                          className="flex items-start gap-3 px-3 py-2.5 rounded-md hover:bg-muted/40 cursor-pointer transition-colors"
                        >
                          <Checkbox
                            checked={row.selected}
                            onCheckedChange={() => toggleRow(row.index)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium truncate">
                                {row.nome_completo}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                — {row.cargo}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Building2 className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                              <span className="text-xs text-muted-foreground truncate">
                                {row.empresa}
                              </span>
                            </div>
                            <Badge
                              variant="outline"
                              className={`mt-1 text-[10px] ${
                                row.companyFlag === "contatos" || row.companyFlag === "both"
                                  ? "border-amber-500 text-amber-600 bg-amber-50"
                                  : "border-blue-500 text-blue-600 bg-blue-50"
                              }`}
                            >
                              {row.companyFlagLabel}
                            </Badge>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                  {unflaggedRows.length > 0 && (
                    <div className="space-y-1 mt-2">
                      <div className="px-3 py-2 bg-muted/50 rounded-md">
                        <p className="text-xs font-semibold flex items-center gap-1.5 text-green-600">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Novos ({unflaggedRows.length})
                        </p>
                      </div>
                      {unflaggedRows.slice(0, 10).map((row) => (
                        <div
                          key={row.index}
                          className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground"
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          <span className="truncate">
                            {row.nome_completo} — {row.empresa}
                          </span>
                        </div>
                      ))}
                      {unflaggedRows.length > 10 && (
                        <p className="text-xs text-muted-foreground px-3 py-1">
                          … e mais {unflaggedRows.length - 10} registros novos
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* STEP: Result */}
          {step === "result" && result && (
            <div className="space-y-4 py-4">
              <Alert variant={result.imported > 0 ? "default" : "destructive"}>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{result.imported}</strong> prospects importados.
                  {result.ignored > 0 && (
                    <>
                      {" "}
                      <strong>{result.ignored}</strong> ignorados (duplicados).
                    </>
                  )}
                  {selectedConsultantObj && (
                    <>
                      {" "}
                      Atribuídos a{" "}
                      <strong>{selectedConsultantObj.nome}</strong>.
                    </>
                  )}
                </AlertDescription>
              </Alert>

              {Object.keys(result.reasons).length > 0 && (
                <div className="text-xs text-muted-foreground max-h-32 overflow-y-auto">
                  <p className="font-medium mb-1">Registros ignorados:</p>
                  {Object.entries(result.reasons).map(([key, reason]) => (
                    <p key={key}>
                      • {key}: {reason}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {step === "review" && (
            <Button
              variant="outline"
              onClick={() => setStep("upload")}
              className="mr-auto"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          )}

          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {step === "result" ? "Fechar" : "Cancelar"}
          </Button>

          {step === "upload" && !limitError && (
            <Button onClick={handleAnalyze} disabled={!file || loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Analisar e Importar
            </Button>
          )}

          {step === "review" && (
            <Button
              onClick={handleConfirmReview}
              disabled={loading || selectedCount === 0}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Importar {selectedCount} registro(s)
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
