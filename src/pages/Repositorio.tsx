import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  FolderOpen,
  Plus,
  Search,
  Filter,
  Download,
  Trash2,
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  Upload,
  Eye,
  Clock,
  Loader2,
  Tag,
  Archive,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { RepositoryDocument, DocumentType, DocumentStatus } from "@/types/crm";

const tipoConfig: Record<DocumentType, { label: string; icon: React.ReactNode; color: string }> = {
  viabilidade: { label: "Viabilidade", icon: <FileSpreadsheet className="w-4 h-4" />, color: "bg-green-100 text-green-800" },
  contrato: { label: "Contrato", icon: <FileText className="w-4 h-4" />, color: "bg-blue-100 text-blue-800" },
  ata: { label: "Ata", icon: <FileText className="w-4 h-4" />, color: "bg-purple-100 text-purple-800" },
  proposta: { label: "Proposta", icon: <FileText className="w-4 h-4" />, color: "bg-amber-100 text-amber-800" },
  documento: { label: "Documento", icon: <File className="w-4 h-4" />, color: "bg-gray-100 text-gray-800" },
};

const statusConfig: Record<DocumentStatus, { label: string; color: string }> = {
  ativo: { label: "Ativo", color: "bg-green-100 text-green-800" },
  arquivado: { label: "Arquivado", color: "bg-gray-100 text-gray-800" },
  rascunho: { label: "Rascunho", color: "bg-yellow-100 text-yellow-800" },
};

const formatFileSize = (bytes: number | undefined) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const Repositorio = () => {
  const { toast } = useToast();
  const { profile, user, isMaster } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("ativo");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any | null>(null);
  const [processing, setProcessing] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    titulo: "",
    tipo: "documento" as DocumentType,
    descricao: "",
    tags: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("repository_documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar os documentos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!user || !profile) return;
    if (!formData.titulo.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Informe o título do documento.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      let arquivo_url = null;
      let arquivo_nome = null;
      let arquivo_tamanho = null;

      // Upload file if selected
      if (selectedFile) {
        setUploading(true);
        const fileExt = selectedFile.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("repository-documents")
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("repository-documents")
          .getPublicUrl(filePath);

        arquivo_url = urlData.publicUrl;
        arquivo_nome = selectedFile.name;
        arquivo_tamanho = selectedFile.size;
        setUploading(false);
      }

      // Insert document record
      const { error } = await supabase.from("repository_documents").insert({
        titulo: formData.titulo,
        tipo: formData.tipo,
        descricao: formData.descricao || null,
        tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()) : null,
        arquivo_url,
        arquivo_nome,
        arquivo_tamanho,
        status: "ativo",
        criado_por: user.id,
        criado_por_nome: profile.nome,
      });

      if (error) throw error;

      toast({
        title: "Documento adicionado!",
        description: "O documento foi salvo no repositório.",
      });

      setUploadDialogOpen(false);
      setFormData({
        titulo: "",
        tipo: "documento",
        descricao: "",
        tags: "",
      });
      setSelectedFile(null);
      fetchDocuments();
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o documento.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDocument || !isMaster) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from("repository_documents")
        .delete()
        .eq("id", selectedDocument.id);

      if (error) throw error;

      toast({
        title: "Documento excluído!",
        description: "O documento foi removido do repositório.",
      });

      setDeleteDialogOpen(false);
      setSelectedDocument(null);
      fetchDocuments();
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o documento.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleArchive = async (doc: any) => {
    try {
      const newStatus = doc.status === "arquivado" ? "ativo" : "arquivado";
      const { error } = await supabase
        .from("repository_documents")
        .update({ 
          status: newStatus,
          atualizado_por: user?.id,
          atualizado_por_nome: profile?.nome,
        })
        .eq("id", doc.id);

      if (error) throw error;

      toast({
        title: newStatus === "arquivado" ? "Documento arquivado!" : "Documento restaurado!",
        description: `O documento foi ${newStatus === "arquivado" ? "arquivado" : "restaurado"}.`,
      });

      fetchDocuments();
    } catch (error) {
      console.error("Error archiving document:", error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status do documento.",
        variant: "destructive",
      });
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTipo = tipoFilter === "all" || doc.tipo === tipoFilter;
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    return matchesSearch && matchesTipo && matchesStatus;
  });

  // Stats by type
  const stats = {
    total: documents.filter((d) => d.status === "ativo").length,
    viabilidades: documents.filter((d) => d.tipo === "viabilidade" && d.status === "ativo").length,
    contratos: documents.filter((d) => d.tipo === "contrato" && d.status === "ativo").length,
    atas: documents.filter((d) => d.tipo === "ata" && d.status === "ativo").length,
  };

  if (loading) {
    return (
      <AppLayout title="Repositório Central" subtitle="Carregando...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Repositório Central"
      subtitle="Viabilidades, Contratos, Atas e Documentos"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FolderOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <FileSpreadsheet className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.viabilidades}</p>
                <p className="text-sm text-muted-foreground">Viabilidades</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.contratos}</p>
                <p className="text-sm text-muted-foreground">Contratos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.atas}</p>
                <p className="text-sm text-muted-foreground">Atas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <div className="flex gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, descrição ou tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="viabilidade">Viabilidade</SelectItem>
              <SelectItem value="contrato">Contrato</SelectItem>
              <SelectItem value="ata">Ata</SelectItem>
              <SelectItem value="proposta">Proposta</SelectItem>
              <SelectItem value="documento">Documento</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ativo">Ativos</SelectItem>
              <SelectItem value="arquivado">Arquivados</SelectItem>
              <SelectItem value="rascunho">Rascunhos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)} className="gap-2">
          <Upload className="w-4 h-4" />
          Novo Documento
        </Button>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="font-semibold">Documento</TableHead>
              <TableHead className="font-semibold">Tipo</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Versão</TableHead>
              <TableHead className="font-semibold">Tamanho</TableHead>
              <TableHead className="font-semibold">Criado por</TableHead>
              <TableHead className="font-semibold">Data</TableHead>
              <TableHead className="font-semibold text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDocuments.map((doc) => (
              <TableRow key={doc.id} className="hover:bg-muted/50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${tipoConfig[doc.tipo as DocumentType]?.color}`}>
                      {tipoConfig[doc.tipo as DocumentType]?.icon}
                    </div>
                    <div>
                      <p className="font-medium">{doc.titulo}</p>
                      {doc.arquivo_nome && (
                        <p className="text-sm text-muted-foreground">{doc.arquivo_nome}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={tipoConfig[doc.tipo as DocumentType]?.color}>
                    {tipoConfig[doc.tipo as DocumentType]?.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={statusConfig[doc.status as DocumentStatus]?.color}>
                    {statusConfig[doc.status as DocumentStatus]?.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-mono">{doc.versao}</span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatFileSize(doc.arquivo_tamanho)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {doc.criado_por_nome}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(doc.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {doc.arquivo_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => window.open(doc.arquivo_url, "_blank")}
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => handleArchive(doc)}
                    >
                      <Archive className="w-3 h-3" />
                    </Button>
                    {isMaster && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-destructive"
                        onClick={() => {
                          setSelectedDocument(doc);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredDocuments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FolderOpen className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Nenhum documento encontrado</p>
          </div>
        )}
      </Card>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Documento</DialogTitle>
            <DialogDescription>
              Adicione um novo documento ao repositório central
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                placeholder="Nome do documento"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => setFormData({ ...formData, tipo: value as DocumentType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viabilidade">Viabilidade</SelectItem>
                  <SelectItem value="contrato">Contrato</SelectItem>
                  <SelectItem value="ata">Ata</SelectItem>
                  <SelectItem value="proposta">Proposta</SelectItem>
                  <SelectItem value="documento">Documento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                placeholder="Descrição do documento..."
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Tags (separadas por vírgula)</Label>
              <Input
                placeholder="Ex: fiscal, 2025, Q1"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Arquivo</Label>
              <Input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpload} disabled={processing}>
              {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {uploading ? "Enviando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O documento "{selectedDocument?.titulo}" será permanentemente removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default Repositorio;
