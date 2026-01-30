import { useEffect, useState } from "react";
import { Building2, Clock, Mail, LogOut, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const AcessoPendente = () => {
  const { user, profile, signOut, isApproved, refreshProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleCheckAgain = async () => {
    setChecking(true);
    try {
      await refreshProfile();
    } finally {
      setChecking(false);
    }
  };

  // If user is already approved, don't keep them here.
  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }
    if (isApproved) {
      navigate("/", { replace: true });
    }
  }, [loading, user, isApproved, navigate]);

  // Re-check once when entering the page (useful if approval happened while user stayed logged in).
  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (isApproved) return;

    setChecking(true);
    refreshProfile().finally(() => setChecking(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-display text-3xl font-bold text-foreground">Loft CRM</span>
          </div>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-accent mx-auto mb-4">
                <Clock className="w-8 h-8 text-accent-foreground" />
            </div>
            <CardTitle className="text-2xl">Acesso Pendente</CardTitle>
            <CardDescription>
              Sua solicitação está sendo analisada
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
              {checking && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verificando status do acesso…
                </div>
              )}

            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {user?.email}
                </span>
              </div>
              {profile && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Nome: </span>
                  <span className="font-medium">{profile.nome}</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                Um gestor irá analisar sua solicitação em breve. Você receberá
                um email quando seu acesso for aprovado.
              </p>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <p className="text-sm text-center">
                  📧 Notificação de aprovação será enviada para:{" "}
                  <strong>{user?.email}</strong>
                </p>
              </div>
            </div>

            <Button
              className="w-full gap-2"
              onClick={handleCheckAgain}
              disabled={checking || loading}
            >
              {checking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Verificar novamente
            </Button>

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Sair e voltar ao login
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          "Acesso ao CRM é governado, não automático."
        </p>
      </div>
    </div>
  );
};

export default AcessoPendente;
