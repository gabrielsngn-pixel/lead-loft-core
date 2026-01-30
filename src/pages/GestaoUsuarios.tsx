import { useState, useEffect } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Users,
  Shield,
  Clock,
  Check,
  X,
  Search,
  Filter,
  Mail,
  User,
  History,
  AlertCircle,
  Loader2,
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface AccessRequest {
  id: string;
  user_id: string;
  email: string;
  nome: string;
  requested_role: string;
  justificativa: string | null;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
}

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  nome: string;
  role: string;
  approved_at: string | null;
  created_at: string;
}

interface AdminLog {
  id: string;
  admin_user_id: string;
  admin_name: string;
  action_type: string;
  target_user_email: string | null;
  details: any;
  created_at: string;
}

const roleConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
  sdr: { label: "SDR", color: "bg-blue-100 text-blue-800" },
  consultor: { label: "Consultor", color: "bg-green-100 text-green-800" },
  gestor: { label: "Gestor", color: "bg-purple-100 text-purple-800" },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Aguardando", color: "bg-yellow-100 text-yellow-800" },
  approved: { label: "Aprovado", color: "bg-green-100 text-green-800" },
  rejected: { label: "Rejeitado", color: "bg-red-100 text-red-800" },
};

const GestaoUsuarios = () => {
  const { toast } = useToast();
  const { profile, user } = useAuth();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("consultor");
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [requestsRes, usersRes, logsRes] = await Promise.all([
        supabase.from("access_requests").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("admin_action_logs").select("*").order("created_at", { ascending: false }).limit(50),
      ]);

      if (requestsRes.data) setRequests(requestsRes.data);
      if (usersRes.data) setUsers(usersRes.data);
      if (logsRes.data) setLogs(logsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleApproveClick = (request: AccessRequest) => {
    setSelectedRequest(request);
    setSelectedRole(request.requested_role || "consultor");
    setApproveDialogOpen(true);
  };

  const handleRejectClick = (request: AccessRequest) => {
    setSelectedRequest(request);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  // Handler para aprovar diretamente da lista de usuários (pendentes sem solicitação)
  const handleApproveUserClick = (userProfile: UserProfile) => {
    // Cria um "fake" request para reutilizar o dialog
    const fakeRequest: AccessRequest = {
      id: "",
      user_id: userProfile.user_id,
      email: userProfile.email,
      nome: userProfile.nome,
      requested_role: "consultor",
      justificativa: null,
      status: "pending",
      reviewed_by: null,
      reviewed_at: null,
      review_notes: null,
      created_at: userProfile.created_at,
    };
    setSelectedRequest(fakeRequest);
    setSelectedRole("consultor");
    setApproveDialogOpen(true);
  };

  const handleRejectUserClick = (userProfile: UserProfile) => {
    const fakeRequest: AccessRequest = {
      id: "",
      user_id: userProfile.user_id,
      email: userProfile.email,
      nome: userProfile.nome,
      requested_role: "consultor",
      justificativa: null,
      status: "pending",
      reviewed_by: null,
      reviewed_at: null,
      review_notes: null,
      created_at: userProfile.created_at,
    };
    setSelectedRequest(fakeRequest);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedRequest || !user || !profile) return;
    setProcessing(true);

    try {
      // Update profile role
      await supabase
        .from("profiles")
        .update({
          role: selectedRole as "sdr" | "consultor" | "gestor",
          approved_at: new Date().toISOString(),
          approved_by: user.id,
        })
        .eq("user_id", selectedRequest.user_id);

      // Update access request (only if it exists - i.e., has a valid id)
      if (selectedRequest.id) {
        await supabase
          .from("access_requests")
          .update({
            status: "approved",
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
          })
          .eq("id", selectedRequest.id);
      }

      // Log the action
      await supabase.from("admin_action_logs").insert({
        admin_user_id: user.id,
        admin_name: profile.nome,
        action_type: "approve_user",
        target_user_id: selectedRequest.user_id,
        target_user_email: selectedRequest.email,
        details: { role: selectedRole },
      });

      // Send approval email
      try {
        await supabase.functions.invoke("send-user-notification", {
          body: {
            type: "approval",
            userEmail: selectedRequest.email,
            userName: selectedRequest.nome,
            requestedRole: selectedRole,
          },
        });
      } catch (emailError) {
        console.error("Error sending email:", emailError);
      }

      toast({
        title: "Usuário aprovado!",
        description: `${selectedRequest.nome} agora tem acesso como ${roleConfig[selectedRole]?.label || selectedRole}.`,
      });

      setApproveDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error approving user:", error);
      toast({
        title: "Erro ao aprovar",
        description: "Ocorreu um erro ao aprovar o usuário. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !user || !profile) return;
    setProcessing(true);

    try {
      // Update profile
      await supabase
        .from("profiles")
        .update({
          rejected_at: new Date().toISOString(),
          rejected_by: user.id,
          rejection_reason: rejectionReason || null,
        })
        .eq("user_id", selectedRequest.user_id);

      // Update access request (only if it exists)
      if (selectedRequest.id) {
        await supabase
          .from("access_requests")
          .update({
            status: "rejected",
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
            review_notes: rejectionReason || null,
          })
          .eq("id", selectedRequest.id);
      }

      // Log the action
      await supabase.from("admin_action_logs").insert({
        admin_user_id: user.id,
        admin_name: profile.nome,
        action_type: "reject_user",
        target_user_id: selectedRequest.user_id,
        target_user_email: selectedRequest.email,
        details: { reason: rejectionReason },
      });

      // Send rejection email
      try {
        await supabase.functions.invoke("send-user-notification", {
          body: {
            type: "rejection",
            userEmail: selectedRequest.email,
            userName: selectedRequest.nome,
            rejectionReason: rejectionReason,
          },
        });
      } catch (emailError) {
        console.error("Error sending email:", emailError);
      }

      toast({
        title: "Solicitação rejeitada",
        description: `A solicitação de ${selectedRequest.nome} foi rejeitada.`,
      });

      setRejectDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error rejecting user:", error);
      toast({
        title: "Erro ao rejeitar",
        description: "Ocorreu um erro ao rejeitar a solicitação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  if (loading) {
    return (
      <AppLayout title="Gestão de Usuários" subtitle="Carregando...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Gestão de Usuários"
      subtitle="Gerencie acessos e permissões do CRM"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-100">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">Pendentes</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {users.filter((u) => u.role !== "pending").length}
              </p>
              <p className="text-sm text-muted-foreground">Aprovados</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {users.filter((u) => u.role === "gestor").length}
              </p>
              <p className="text-sm text-muted-foreground">Gestores</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{users.length}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="requests" className="gap-2">
            <Clock className="w-4 h-4" />
            Solicitações
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <History className="w-4 h-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          {/* Filters */}
          <div className="stat-card mb-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 items-center">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                    <SelectItem value="approved">Aprovados</SelectItem>
                    <SelectItem value="rejected">Rejeitados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Requests Table */}
          <div className="stat-card p-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-semibold">Usuário</TableHead>
                  <TableHead className="font-semibold">Perfil Solicitado</TableHead>
                  <TableHead className="font-semibold">Justificativa</TableHead>
                  <TableHead className="font-semibold">Data</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id} className="table-row-hover">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{request.nome}</p>
                          <p className="text-sm text-muted-foreground">{request.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={roleConfig[request.requested_role]?.color || "bg-gray-100"}>
                        {roleConfig[request.requested_role]?.label || request.requested_role}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <p className="text-sm text-muted-foreground truncate">
                        {request.justificativa || "—"}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(request.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusConfig[request.status]?.color || "bg-gray-100"}>
                        {statusConfig[request.status]?.label || request.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {request.status === "pending" && (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() => handleApproveClick(request)}
                          >
                            <Check className="w-3 h-3" />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleRejectClick(request)}
                          >
                            <X className="w-3 h-3" />
                            Rejeitar
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredRequests.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <AlertCircle className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">
                  {statusFilter === "pending"
                    ? "Nenhuma solicitação pendente"
                    : "Nenhuma solicitação encontrada"}
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="users">
          <div className="stat-card p-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-semibold">Usuário</TableHead>
                  <TableHead className="font-semibold">Perfil</TableHead>
                  <TableHead className="font-semibold">Aprovado em</TableHead>
                  <TableHead className="font-semibold">Cadastro</TableHead>
                  <TableHead className="font-semibold text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((userProfile) => (
                  <TableRow key={userProfile.id} className="table-row-hover">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{userProfile.nome}</p>
                          <p className="text-sm text-muted-foreground">{userProfile.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={roleConfig[userProfile.role]?.color || "bg-gray-100"}>
                        {roleConfig[userProfile.role]?.label || userProfile.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {userProfile.approved_at
                        ? format(new Date(userProfile.approved_at), "dd/MM/yyyy", { locale: ptBR })
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(userProfile.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      {userProfile.role === "pending" && (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() => handleApproveUserClick(userProfile)}
                          >
                            <Check className="w-3 h-3" />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleRejectUserClick(userProfile)}
                          >
                            <X className="w-3 h-3" />
                            Rejeitar
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <div className="stat-card p-0 overflow-hidden">
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-semibold">Administrador</TableHead>
                    <TableHead className="font-semibold">Ação</TableHead>
                    <TableHead className="font-semibold">Usuário Alvo</TableHead>
                    <TableHead className="font-semibold">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.admin_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {log.action_type === "approve_user"
                            ? "Aprovou usuário"
                            : log.action_type === "reject_user"
                            ? "Rejeitou usuário"
                            : log.action_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {log.target_user_email || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar Usuário</DialogTitle>
            <DialogDescription>
              Defina o perfil de acesso para {selectedRequest?.nome}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Perfil de Acesso</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sdr">SDR</SelectItem>
                  <SelectItem value="consultor">Consultor</SelectItem>
                  <SelectItem value="gestor">Gestor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleApprove} disabled={processing}>
              {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Aprovar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Solicitação</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição para {selectedRequest?.nome}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Motivo da Rejeição (opcional)</Label>
              <Textarea
                placeholder="Descreva o motivo..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={processing}>
              {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Rejeitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default GestaoUsuarios;
