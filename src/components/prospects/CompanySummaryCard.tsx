import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Download } from "lucide-react";
import { Prospect } from "@/types/prospects";

interface CompanySummaryCardProps {
  prospects: Prospect[];
}

interface CompanyGroup {
  empresa: string;
  total: number;
  ativos: number;
  convertidos: number;
  descartados: number;
}

export function CompanySummaryCard({ prospects }: CompanySummaryCardProps) {
  const companyGroups = useMemo(() => {
    const map = new Map<string, CompanyGroup>();

    for (const p of prospects) {
      const key = p.empresa.trim().toLowerCase();
      const existing = map.get(key);

      if (existing) {
        existing.total++;
        if (p.status === "convertido") existing.convertidos++;
        else if (p.status === "descartado") existing.descartados++;
        else existing.ativos++;
      } else {
        map.set(key, {
          empresa: p.empresa.trim(),
          total: 1,
          ativos: p.status !== "convertido" && p.status !== "descartado" ? 1 : 0,
          convertidos: p.status === "convertido" ? 1 : 0,
          descartados: p.status === "descartado" ? 1 : 0,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [prospects]);

  const exportCSV = () => {
    const header = "Incorporadora,Total Prospects,Ativos,Convertidos,Descartados";
    const rows = companyGroups.map(
      (g) => `"${g.empresa}",${g.total},${g.ativos},${g.convertidos},${g.descartados}`
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "incorporadoras_consolidado.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="stat-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Incorporadoras ({companyGroups.length})
          </CardTitle>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-1" />
            Exportar CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-64 overflow-y-auto space-y-2">
          {companyGroups.map((group) => (
            <div
              key={group.empresa}
              className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <span className="font-medium text-sm text-foreground truncate mr-2">
                {group.empresa}
              </span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant="secondary" className="text-xs">
                  {group.total} {group.total === 1 ? "prospect" : "prospects"}
                </Badge>
                {group.convertidos > 0 && (
                  <Badge className="bg-emerald-600 text-white text-xs">
                    {group.convertidos} conv.
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
