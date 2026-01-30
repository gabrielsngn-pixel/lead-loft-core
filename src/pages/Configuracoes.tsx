import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Bell, Shield, Link, Building2, Save } from "lucide-react";

const Configuracoes = () => {
  return (
    <AppLayout title="Configurações" subtitle="Gerencie suas preferências do sistema">
      <div className="max-w-4xl space-y-6">
        {/* Profile Settings */}
        <Card className="animate-fade-in">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Perfil</CardTitle>
                <CardDescription>
                  Suas informações pessoais e credenciais
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome completo</Label>
                <Input id="nome" defaultValue="João Silva" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" defaultValue="joao@loft.com.br" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input id="telefone" defaultValue="(11) 99999-9999" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cargo">Cargo</Label>
                <Select defaultValue="consultor">
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
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="animate-fade-in" style={{ animationDelay: "100ms" }}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/10">
                <Bell className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <CardTitle>Notificações</CardTitle>
                <CardDescription>
                  Configure como deseja receber alertas
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Novos leads</p>
                <p className="text-sm text-muted-foreground">
                  Receba alertas quando novos leads forem cadastrados
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Lembretes de atividades</p>
                <p className="text-sm text-muted-foreground">
                  Notificações 30 minutos antes das atividades agendadas
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Atualizações de negociações</p>
                <p className="text-sm text-muted-foreground">
                  Alertas quando uma negociação mudar de etapa
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">E-mails semanais</p>
                <p className="text-sm text-muted-foreground">
                  Resumo semanal de performance e atividades
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Integrations */}
        <Card className="animate-fade-in" style={{ animationDelay: "200ms" }}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <Link className="w-5 h-5 text-success" />
              </div>
              <div>
                <CardTitle>Integrações</CardTitle>
                <CardDescription>
                  Conexões com sistemas externos
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Simulador Loft</p>
                  <p className="text-sm text-muted-foreground">
                    Integração com simulador financeiro
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Conectar
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              A integração com o simulador permite enviar dados de viabilidade diretamente
              pelo CRM usando o CNPJ como chave única.
            </p>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="animate-fade-in" style={{ animationDelay: "300ms" }}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/20">
                <Shield className="w-5 h-5 text-warning-foreground" />
              </div>
              <div>
                <CardTitle>Segurança</CardTitle>
                <CardDescription>
                  Configurações de acesso e autenticação
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="senha-atual">Senha atual</Label>
              <Input id="senha-atual" type="password" placeholder="••••••••" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nova-senha">Nova senha</Label>
                <Input id="nova-senha" type="password" placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmar-senha">Confirmar nova senha</Label>
                <Input id="confirmar-senha" type="password" placeholder="••••••••" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button size="lg">
            <Save className="w-4 h-4 mr-2" />
            Salvar Alterações
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default Configuracoes;