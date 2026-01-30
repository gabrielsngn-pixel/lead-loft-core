import { Material, NegotiationStage } from "@/types/materials";
import { mockMaterials } from "@/data/mockMaterials";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  FileText,
  Presentation,
  Video,
  Image,
  Link2,
  FileSpreadsheet,
  Star,
  ExternalLink,
  Lightbulb,
} from "lucide-react";
import { MaterialType } from "@/types/materials";

const typeIcons: Record<MaterialType, typeof FileText> = {
  pdf: FileText,
  ppt: Presentation,
  video: Video,
  imagem: Image,
  link: Link2,
  documento: FileSpreadsheet,
};

interface SuggestedMaterialsProps {
  stage: NegotiationStage;
  onUseMaterial?: (material: Material) => void;
  maxItems?: number;
}

export function SuggestedMaterials({
  stage,
  onUseMaterial,
  maxItems = 3,
}: SuggestedMaterialsProps) {
  // Get materials suggested for this stage
  const suggestedMaterials = mockMaterials
    .filter(
      (m) =>
        m.status === "ativo" &&
        m.etapaSugerida?.includes(stage)
    )
    .sort((a, b) => {
      // Recommended first
      if (a.recomendado && !b.recomendado) return -1;
      if (!a.recomendado && b.recomendado) return 1;
      // Then by usage
      return b.usos - a.usos;
    })
    .slice(0, maxItems);

  if (suggestedMaterials.length === 0) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-primary" />
          Materiais Sugeridos
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {suggestedMaterials.map((material) => {
            const TypeIcon = typeIcons[material.tipo];
            return (
              <div
                key={material.id}
                className="flex items-center justify-between gap-2 p-2 rounded-lg bg-background hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <TypeIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm font-medium truncate">
                    {material.titulo}
                  </span>
                  {material.recomendado && (
                    <Star className="w-3 h-3 text-primary fill-primary flex-shrink-0" />
                  )}
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 flex-shrink-0"
                      onClick={() => onUseMaterial?.(material)}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Usar material</TooltipContent>
                </Tooltip>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
