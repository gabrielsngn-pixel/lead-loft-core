import { useState } from "react";
import { useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Handshake,
  Calendar,
  FileInput,
  Settings,
  ChevronLeft,
  Building2,
  BookOpen,
  ClipboardList,
  MessageSquareText,
  Shield,
  LogOut,
  Calculator,
  FolderOpen,
  UserSearch,
  Layers,
  FileText,
  UserX,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const mainMenuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Prospects", url: "/prospects", icon: UserSearch },
  { title: "Novo Lead", url: "/leads/novo", icon: FileInput },
  { title: "Repositório de Leads", url: "/leads", icon: Users },
  { title: "Contatos Ativos", url: "/contatos", icon: UserCheck },
  { title: "Viabilidade", url: "/viabilidade", icon: Calculator },
  { title: "Esteira de Projetos", url: "/esteira-projetos", icon: Layers },
  { title: "Empreendimentos", url: "/empreendimentos", icon: Building2 },
  { title: "Negociações", url: "/negociacoes", icon: Handshake },
  { title: "Calendário", url: "/calendario", icon: Calendar },
  { title: "Central de Materiais", url: "/materiais", icon: BookOpen },
  { title: "Reuniões & Atas", url: "/reunioes", icon: ClipboardList },
  { title: "Script de Atendimento", url: "/script", icon: MessageSquareText },
  { title: "Minutas", url: "/minutas", icon: FileText },
];

const settingsItems = [
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

export function AppSidebar() {
const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { isGestor, isMaster, profile, signOut } = useAuth();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/auth";
  };

  return (
    <Sidebar
      className={cn(
        "border-r-0 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
      collapsible="icon"
    >
      {/* Logo Header */}
      <div className={cn(
        "flex items-center gap-3 px-4 py-5 border-b border-sidebar-border",
        collapsed ? "justify-center" : "justify-start"
      )}>
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
          <Building2 className="w-6 h-6 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-display text-lg font-bold text-sidebar-foreground">
              Loft
            </span>
            <span className="text-[10px] text-sidebar-foreground/70 tracking-wider uppercase">
              Incorporações
            </span>
          </div>
        )}
      </div>

      <SidebarContent className="px-2 py-4">
        {/* Main Navigation */}
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs font-medium uppercase tracking-wider px-3 mb-2">
              Menu Principal
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                        "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                        collapsed && "justify-center px-2"
                      )}
                      activeClassName="bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-primary/25"
                    >
                      <item.icon className={cn("w-5 h-5 flex-shrink-0", collapsed && "w-5 h-5")} />
                      {!collapsed && (
                        <span className="text-sm font-medium">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Menu - Only for Gestors and Masters */}
        {isGestor && (
          <SidebarGroup>
            {!collapsed && (
              <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs font-medium uppercase tracking-wider px-3 mb-2">
                Administração
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/gestao-usuarios"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                        "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                        collapsed && "justify-center px-2"
                      )}
                      activeClassName="bg-sidebar-primary text-sidebar-primary-foreground"
                    >
                      <Shield className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && (
                        <span className="text-sm font-medium">Gestão de Usuários</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {isMaster && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to="/resumo-executivo"
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                          "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                          collapsed && "justify-center px-2"
                        )}
                        activeClassName="bg-sidebar-primary text-sidebar-primary-foreground"
                      >
                        <FileText className="w-5 h-5 flex-shrink-0" />
                        {!collapsed && (
                          <span className="text-sm font-medium">Resumo Executivo</span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {isMaster && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to="/contatos-excluidos"
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                          "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                          collapsed && "justify-center px-2"
                        )}
                        activeClassName="bg-sidebar-primary text-sidebar-primary-foreground"
                      >
                        <UserX className="w-5 h-5 flex-shrink-0" />
                        {!collapsed && (
                          <span className="text-sm font-medium">Contatos Excluídos</span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Settings */}
        <SidebarGroup className="mt-auto">
          {!collapsed && (
            <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs font-medium uppercase tracking-wider px-3 mb-2">
              Sistema
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                        "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                        collapsed && "justify-center px-2"
                      )}
                      activeClassName="bg-sidebar-primary text-sidebar-primary-foreground"
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && (
                        <span className="text-sm font-medium">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {/* Logout button */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <button
                    onClick={handleLogout}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                      "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-destructive/10",
                      collapsed && "justify-center px-2"
                    )}
                  >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && (
                      <span className="text-sm font-medium">Sair</span>
                    )}
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Collapse Toggle */}
      <div className="border-t border-sidebar-border p-2">
        <SidebarTrigger className={cn(
          "w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg",
          "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        )}>
          <ChevronLeft className={cn(
            "w-4 h-4 transition-transform duration-300",
            collapsed && "rotate-180"
          )} />
          {!collapsed && <span className="text-sm">Recolher</span>}
        </SidebarTrigger>
      </div>
    </Sidebar>
  );
}