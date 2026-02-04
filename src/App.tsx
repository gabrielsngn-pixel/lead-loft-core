import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import NovoLead from "./pages/NovoLead";
import Contatos from "./pages/Contatos";
import Negociacoes from "./pages/Negociacoes";
import Calendario from "./pages/Calendario";
import Materiais from "./pages/Materiais";
import Reunioes from "./pages/Reunioes";
import Script from "./pages/Script";
import Configuracoes from "./pages/Configuracoes";
import GestaoUsuarios from "./pages/GestaoUsuarios";
import Viabilidade from "./pages/Viabilidade";
import Prospects from "./pages/Prospects";
import Auth from "./pages/Auth";
import AcessoPendente from "./pages/AcessoPendente";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/acesso-pendente" element={<AcessoPendente />} />

            {/* Protected routes - require approval */}
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/prospects" element={
              <ProtectedRoute>
                <Prospects />
              </ProtectedRoute>
            } />
            <Route path="/leads" element={
              <ProtectedRoute>
                <Leads />
              </ProtectedRoute>
            } />
            <Route path="/leads/novo" element={
              <ProtectedRoute>
                <NovoLead />
              </ProtectedRoute>
            } />
            <Route path="/contatos" element={
              <ProtectedRoute>
                <Contatos />
              </ProtectedRoute>
            } />
            <Route path="/negociacoes" element={
              <ProtectedRoute>
                <Negociacoes />
              </ProtectedRoute>
            } />
            <Route path="/calendario" element={
              <ProtectedRoute>
                <Calendario />
              </ProtectedRoute>
            } />
            <Route path="/materiais" element={
              <ProtectedRoute>
                <Materiais />
              </ProtectedRoute>
            } />
            <Route path="/reunioes" element={
              <ProtectedRoute>
                <Reunioes />
              </ProtectedRoute>
            } />
            <Route path="/script" element={
              <ProtectedRoute>
                <Script />
              </ProtectedRoute>
            } />
            <Route path="/configuracoes" element={
              <ProtectedRoute>
                <Configuracoes />
              </ProtectedRoute>
            } />

            {/* Gestor-only routes */}
            <Route path="/gestao-usuarios" element={
              <ProtectedRoute allowedRoles={["gestor", "master"]}>
                <GestaoUsuarios />
              </ProtectedRoute>
            } />

            {/* Viabilidade module */}
            <Route path="/viabilidade" element={
              <ProtectedRoute>
                <Viabilidade />
              </ProtectedRoute>
            } />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
