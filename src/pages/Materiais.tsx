import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MaterialCard } from "@/components/materials/MaterialCard";
import { VersionHistoryDialog } from "@/components/materials/VersionHistoryDialog";
import { UploadMaterialDialog } from "@/components/materials/UploadMaterialDialog";
import { MaterialViewerDialog } from "@/components/materials/MaterialViewerDialog";
import { mockMaterials } from "@/data/mockMaterials";
import { Material, MaterialCategory, MaterialType, MaterialAudience } from "@/types/materials";
import { cn } from "@/lib/utils";
import {
  Search,
  Plus,
  GraduationCap,
  Briefcase,
  Users,
  Filter,
  BookOpen,
  Star,
  Archive,
  FileText,
  Presentation,
  Video,
  Image,
  Link2,
  FileSpreadsheet,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const categoryConfig: Record<MaterialCategory, { label: string; icon: typeof GraduationCap; description: string }> = {
  treinamento: { 
    label: "Treinamentos", 
    icon: GraduationCap,
    description: "Materiais de onboarding, treinamentos e capacitação do time"
  },
  prospeccao: { 
    label: "Marketing e Trade", 
    icon: Briefcase,
    description: "Materiais para abordagem comercial, marketing e trade"
  },
  institucional: { 
    label: "Institucional", 
    icon: Users,
    description: "Apresentações, decks e documentos institucionais da empresa"
  },
};

const typeConfig: Record<MaterialType, { label: string; icon: typeof FileText }> = {
  pdf: { label: "PDF", icon: FileText },
  ppt: { label: "Apresentação", icon: Presentation },
  video: { label: "Vídeo", icon: Video },
  imagem: { label: "Imagem", icon: Image },
  link: { label: "Link", icon: Link2 },
  documento: { label: "Documento", icon: FileSpreadsheet },
};

const audienceLabels: Record<MaterialAudience, string> = {
  sdr: "SDR",
  consultor: "Consultor",
  gestor: "Gestor",
  todos: "Todos",
};

const Materiais = () => {
  const [activeTab, setActiveTab] = useState<MaterialCategory>("treinamento");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [audienceFilter, setAudienceFilter] = useState<string>("all");
  const [showArchived, setShowArchived] = useState(false);
  const [materials, setMaterials] = useState<Material[]>(mockMaterials);
  
  // Dialog states
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [viewerDialogOpen, setViewerDialogOpen] = useState(false);
  
  const { toast } = useToast();

  // Filter materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((material) => {
      // Category filter
      if (material.categoria !== activeTab) return false;
      
      // Status filter (archived)
      if (!showArchived && material.status === "arquivado") return false;
      
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesTitle = material.titulo.toLowerCase().includes(search);
        const matchesDesc = material.descricao.toLowerCase().includes(search);
        const matchesTags = material.tags.some(tag => tag.toLowerCase().includes(search));
        if (!matchesTitle && !matchesDesc && !matchesTags) return false;
      }
      
      // Type filter
      if (typeFilter !== "all" && material.tipo !== typeFilter) return false;
      
      // Audience filter
      if (audienceFilter !== "all" && material.publicoAlvo !== audienceFilter && material.publicoAlvo !== "todos") return false;
      
      return true;
    });
  }, [materials, activeTab, searchTerm, typeFilter, audienceFilter, showArchived]);

  // Sort: recommended first, then by usage count
  const sortedMaterials = useMemo(() => {
    return [...filteredMaterials].sort((a, b) => {
      if (a.recomendado && !b.recomendado) return -1;
      if (!a.recomendado && b.recomendado) return 1;
      return b.usos - a.usos;
    });
  }, [filteredMaterials]);

  // Stats
  const stats = useMemo(() => {
    const categoryMaterials = materials.filter(m => m.categoria === activeTab && m.status === "ativo");
    return {
      total: categoryMaterials.length,
      recommended: categoryMaterials.filter(m => m.recomendado).length,
      totalViews: categoryMaterials.reduce((sum, m) => sum + m.visualizacoes, 0),
      totalUses: categoryMaterials.reduce((sum, m) => sum + m.usos, 0),
    };
  }, [materials, activeTab]);

  const handleViewMaterial = (material: Material) => {
    if (material.url) {
      window.open(material.url, "_blank");
    } else {
      toast({
        title: "Visualizar material",
        description: `Abrindo "${material.titulo}"...`,
      });
    }
  };

  const handleDownloadMaterial = (material: Material) => {
    toast({
      title: "Download iniciado",
      description: `Baixando "${material.arquivoNome || material.titulo}"...`,
    });
  };

  const handleViewHistory = (material: Material) => {
    setSelectedMaterial(material);
    setHistoryDialogOpen(true);
  };

  const handleUseMaterial = (material: Material) => {
    // Open material in the viewer dialog
    setSelectedMaterial(material);
    setViewerDialogOpen(true);
    // TODO: Increment usage count in database
  };

  const handleDeleteMaterial = (material: Material) => {
    setMaterials(prev => prev.filter(m => m.id !== material.id));
    toast({
      title: "Material excluído",
      description: `"${material.titulo}" foi removido da biblioteca.`,
    });
  };

  const CategoryIcon = categoryConfig[activeTab].icon;

  return (
    <AppLayout title="Central de Materiais" subtitle="Biblioteca de recursos para o time comercial">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="stat-card py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Materiais Ativos</p>
            </div>
          </div>
        </div>
        <div className="stat-card py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/20">
              <Star className="w-5 h-5 text-warning-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.recommended}</p>
              <p className="text-xs text-muted-foreground">Recomendados</p>
            </div>
          </div>
        </div>
        <div className="stat-card py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary/10">
              <Users className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Visualizações</p>
            </div>
          </div>
        </div>
        <div className="stat-card py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <FileText className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalUses.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Usos Registrados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MaterialCategory)} className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <TabsList className="grid w-full lg:w-auto grid-cols-3">
            {Object.entries(categoryConfig).map(([key, config]) => {
              const Icon = config.icon;
              const count = materials.filter(m => m.categoria === key && m.status === "ativo").length;
              return (
                <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{config.label.split(" ")[0]}</span>
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {count}
                  </Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>
          
          <Button onClick={() => setUploadDialogOpen(true)} className="btn-cta">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Material
          </Button>
        </div>

        {/* Category Description */}
        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border">
          <CategoryIcon className="w-6 h-6 text-primary" />
          <div>
            <h3 className="font-semibold">{categoryConfig[activeTab].label}</h3>
            <p className="text-sm text-muted-foreground">{categoryConfig[activeTab].description}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="stat-card">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar materiais..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex flex-wrap gap-3 items-center">
              <Filter className="w-4 h-4 text-muted-foreground" />
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Tipos</SelectItem>
                  {Object.entries(typeConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={audienceFilter} onValueChange={setAudienceFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Público" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Object.entries(audienceLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2 ml-2">
                <Checkbox
                  id="showArchived"
                  checked={showArchived}
                  onCheckedChange={(checked) => setShowArchived(checked as boolean)}
                />
                <Label htmlFor="showArchived" className="text-sm text-muted-foreground flex items-center gap-1">
                  <Archive className="w-3 h-3" />
                  Arquivados
                </Label>
              </div>

              <Badge variant="secondary" className="ml-auto">
                {sortedMaterials.length} materiais
              </Badge>
            </div>
          </div>
        </div>

        {/* Materials Grid */}
        {Object.keys(categoryConfig).map((category) => (
          <TabsContent key={category} value={category} className="space-y-6">
            {sortedMaterials.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sortedMaterials.map((material, index) => (
                  <div
                    key={material.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <MaterialCard
                      material={material}
                      onUse={handleUseMaterial}
                      onView={handleUseMaterial}
                      onDownload={handleDownloadMaterial}
                      onViewHistory={handleViewHistory}
                      onDelete={handleDeleteMaterial}
                      isAdmin={true} // In real app, check user role
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <BookOpen className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  Nenhum material encontrado
                </p>
                <p className="text-sm text-muted-foreground/70 mb-4">
                  Ajuste os filtros ou adicione um novo material
                </p>
                <Button onClick={() => setUploadDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Material
                </Button>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Dialogs */}
      <VersionHistoryDialog
        material={selectedMaterial}
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
      />
      
      <MaterialViewerDialog
        material={selectedMaterial}
        open={viewerDialogOpen}
        onOpenChange={setViewerDialogOpen}
        onDownload={handleDownloadMaterial}
      />
      
      <UploadMaterialDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        defaultCategory={activeTab}
      />
    </AppLayout>
  );
};

export default Materiais;
