import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageLogTab } from "@/components/communication/MessageLogTab";
import { BulkDispatchTab } from "@/components/communication/BulkDispatchTab";
import { TemplatesTab } from "@/components/communication/TemplatesTab";
import { CommMetricsTab } from "@/components/communication/CommMetricsTab";
import { CommSettingsTab } from "@/components/communication/CommSettingsTab";
import { MessageSquare, Send, FileText, BarChart3, Settings } from "lucide-react";

export default function CommunicationPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Comunicação</h1>
          <p className="text-muted-foreground text-sm">Envie emails e gerencie seus disparos em massa</p>
        </div>

        <Tabs defaultValue="messages" className="space-y-4">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="messages" className="gap-1.5">
              <MessageSquare className="w-4 h-4" /> Mensagens
            </TabsTrigger>
            <TabsTrigger value="bulk" className="gap-1.5">
              <Send className="w-4 h-4" /> Disparo em Massa
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-1.5">
              <FileText className="w-4 h-4" /> Templates
            </TabsTrigger>
            <TabsTrigger value="metrics" className="gap-1.5">
              <BarChart3 className="w-4 h-4" /> Métricas
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5">
              <Settings className="w-4 h-4" /> Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="messages"><MessageLogTab /></TabsContent>
          <TabsContent value="bulk"><BulkDispatchTab /></TabsContent>
          <TabsContent value="templates"><TemplatesTab /></TabsContent>
          <TabsContent value="metrics"><CommMetricsTab /></TabsContent>
          <TabsContent value="settings"><CommSettingsTab /></TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
