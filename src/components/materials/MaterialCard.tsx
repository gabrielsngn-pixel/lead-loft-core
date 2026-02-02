import { Material, MaterialType, MaterialCategory } from "@/types/materials";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  FileText,
  Presentation,
  Video,
  Image,
  Link2,
  FileSpreadsheet,
  MoreVertical,
  Eye,
  Download,
  History,
  Star,
  StarOff,
  Archive,
  ExternalLink,
  Play,
  Users,
  GraduationCap,
  Briefcase,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const typeIcons: Record<MaterialType, typeof FileText> = {
  pdf: FileText,
  ppt: Presentation,
  video: Video,
  imagem: Image,
  link: Link2,
  documento: FileSpreadsheet,
};

const typeColors: Record<MaterialType, string> = {
  pdf: "bg-red-100 text-red-600 border-red-200",
  ppt: "bg-orange-100 text-orange-600 border-orange-200",
  video: "bg-purple-100 text-purple-600 border-purple-200",
  imagem: "bg-green-100 text-green-600 border-green-200",
  link: "bg-blue-100 text-blue-600 border-blue-200",
  documento: "bg-emerald-100 text-emerald-600 border-emerald-200",
};

const typeLabels: Record<MaterialType, string> = {
  pdf: "PDF",
  ppt: "Apresentação",
  video: "Vídeo",
  imagem: "Imagem",
  link: "Link",
  documento: "Documento",
};

const categoryIcons: Record<MaterialCategory, typeof GraduationCap> = {
  treinamento: GraduationCap,
  prospeccao: Briefcase,
  institucional: Users,
};

const audienceLabels = {
  sdr: "SDR",
  consultor: "Consultor",
  gestor: "Gestor",
  todos: "Todos",
};

interface MaterialCardProps {
  material: Material;
  onUse?: (material: Material) => void;
  onView?: (material: Material) => void;
  onDownload?: (material: Material) => void;
  onViewHistory?: (material: Material) => void;
  isAdmin?: boolean;
  onArchive?: (material: Material) => void;
  onToggleRecommended?: (material: Material) => void;
}

export function MaterialCard({
  material,
  onUse,
  onView,
  onDownload,
  onViewHistory,
  isAdmin = false,
  onArchive,
  onToggleRecommended,
}: MaterialCardProps) {
  const TypeIcon = typeIcons[material.tipo];
  const CategoryIcon = categoryIcons[material.categoria];

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card 
      className={cn(
        "stat-card p-0 overflow-hidden transition-all duration-200 hover:shadow-lg group",
        material.recomendado && "ring-2 ring-primary/20 border-primary/30"
      )}
    >
      {/* Header with type indicator */}
      <div className={cn(
        "px-4 py-3 border-b flex items-center justify-between",
        material.recomendado ? "bg-primary/5" : "bg-muted/30"
      )}>
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded-lg border",
            typeColors[material.tipo]
          )}>
            <TypeIcon className="w-4 h-4" />
          </div>
          <Badge variant="secondary" className="text-xs">
            {typeLabels[material.tipo]}
          </Badge>
          {material.recomendado && (
            <Badge className="bg-primary/10 text-primary text-xs flex items-center gap-1">
              <Star className="w-3 h-3 fill-current" />
              Recomendado
            </Badge>
          )}
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView?.(material)}>
              <Eye className="w-4 h-4 mr-2" />
              Visualizar
            </DropdownMenuItem>
            {material.tipo !== "link" && material.tipo !== "video" && (
              <DropdownMenuItem onClick={() => onDownload?.(material)}>
                <Download className="w-4 h-4 mr-2" />
                Baixar
              </DropdownMenuItem>
            )}
            {(material.tipo === "link" || material.tipo === "video") && (
              <DropdownMenuItem onClick={() => onView?.(material)}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir Link
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onViewHistory?.(material)}>
              <History className="w-4 h-4 mr-2" />
              Histórico de Versões
            </DropdownMenuItem>
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onToggleRecommended?.(material)}>
                  {material.recomendado ? (
                    <>
                      <StarOff className="w-4 h-4 mr-2" />
                      Remover Destaque
                    </>
                  ) : (
                    <>
                      <Star className="w-4 h-4 mr-2" />
                      Destacar
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onArchive?.(material)}>
                  <Archive className="w-4 h-4 mr-2" />
                  {material.status === "ativo" ? "Arquivar" : "Restaurar"}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CardContent className="p-4">
        {/* Title and Description */}
        <h3 className="font-semibold text-foreground mb-1 line-clamp-2">
          {material.titulo}
        </h3>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {material.descricao}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {material.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {material.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{material.tags.length - 3}
            </Badge>
          )}
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {material.visualizacoes}
            </span>
            <span className="flex items-center gap-1">
              <Play className="w-3 h-3" />
              {material.usos} usos
            </span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {audienceLabels[material.publicoAlvo]}
          </Badge>
        </div>

        {/* Version and Size */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4 pt-3 border-t">
          <span>v{material.versao}</span>
          <span>
            {formatDistanceToNow(material.dataAtualizacao, { addSuffix: true, locale: ptBR })}
          </span>
          {material.arquivoTamanho && (
            <span>{formatFileSize(material.arquivoTamanho)}</span>
          )}
        </div>

        {/* Action Button */}
        <Button 
          className="w-full btn-cta" 
          size="sm"
          onClick={() => onUse?.(material)}
        >
          <Play className="w-4 h-4 mr-2" />
          Usar este Material
        </Button>
      </CardContent>
    </Card>
  );
}
