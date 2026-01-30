import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const ADMIN_EMAIL = "gabriel.neves@loft.com.br";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NotificationRequest {
  type: "access_request" | "approval" | "rejection";
  userEmail: string;
  userName: string;
  requestedRole?: string;
  justificativa?: string;
  rejectionReason?: string;
}

const getAccessRequestEmailHtml = (userName: string, userEmail: string, requestedRole: string, justificativa?: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Inter', -apple-system, sans-serif; background: #f5f5f5; padding: 20px; margin: 0; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 28px; font-weight: bold; color: #FF774A; }
    h1 { color: #115644; font-size: 24px; margin-bottom: 20px; }
    .info-box { background: #f9f9f9; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .info-row:last-child { border-bottom: none; }
    .info-label { font-weight: 600; color: #666; }
    .info-value { color: #333; }
    .footer { text-align: center; margin-top: 30px; color: #888; font-size: 12px; }
    .cta-button { display: inline-block; background: #FF774A; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Loft CRM</div>
    </div>
    <h1>Nova Solicitação de Acesso</h1>
    <p>Um novo usuário solicitou acesso ao CRM Loft:</p>
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Nome:</span>
        <span class="info-value">${userName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Email:</span>
        <span class="info-value">${userEmail}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Perfil Solicitado:</span>
        <span class="info-value">${requestedRole}</span>
      </div>
      ${justificativa ? `
      <div class="info-row">
        <span class="info-label">Justificativa:</span>
        <span class="info-value">${justificativa}</span>
      </div>
      ` : ""}
    </div>
    <p>Acesse o painel de Gestão de Usuários para aprovar ou rejeitar esta solicitação.</p>
    <div class="footer">
      <p>Loft CRM - Sistema de Gestão Comercial</p>
      <p>Este é um email automático, não responda.</p>
    </div>
  </div>
</body>
</html>
`;

const getApprovalEmailHtml = (userName: string, role: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Inter', -apple-system, sans-serif; background: #f5f5f5; padding: 20px; margin: 0; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 28px; font-weight: bold; color: #FF774A; }
    h1 { color: #115644; font-size: 24px; margin-bottom: 20px; }
    .success-icon { font-size: 48px; text-align: center; margin: 20px 0; }
    .info-box { background: #e8f5e9; border: 1px solid #4caf50; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
    .role-badge { display: inline-block; background: #FF774A; color: white; padding: 8px 16px; border-radius: 20px; font-weight: 600; }
    .footer { text-align: center; margin-top: 30px; color: #888; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Loft CRM</div>
    </div>
    <div class="success-icon">✅</div>
    <h1>Acesso Aprovado!</h1>
    <p>Olá <strong>${userName}</strong>,</p>
    <p>Sua solicitação de acesso ao Loft CRM foi <strong>aprovada</strong>!</p>
    <div class="info-box">
      <p>Você foi aprovado como:</p>
      <span class="role-badge">${role.toUpperCase()}</span>
    </div>
    <p>Agora você pode acessar o sistema com sua conta cadastrada.</p>
    <p>Bem-vindo à equipe!</p>
    <div class="footer">
      <p>Loft CRM - Sistema de Gestão Comercial</p>
      <p>Este é um email automático, não responda.</p>
    </div>
  </div>
</body>
</html>
`;

const getRejectionEmailHtml = (userName: string, reason?: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Inter', -apple-system, sans-serif; background: #f5f5f5; padding: 20px; margin: 0; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 28px; font-weight: bold; color: #FF774A; }
    h1 { color: #115644; font-size: 24px; margin-bottom: 20px; }
    .info-box { background: #ffebee; border: 1px solid #f44336; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #888; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Loft CRM</div>
    </div>
    <h1>Solicitação Não Aprovada</h1>
    <p>Olá <strong>${userName}</strong>,</p>
    <p>Infelizmente, sua solicitação de acesso ao Loft CRM não foi aprovada neste momento.</p>
    ${reason ? `
    <div class="info-box">
      <p><strong>Motivo:</strong></p>
      <p>${reason}</p>
    </div>
    ` : ""}
    <p>Se você acredita que isso é um erro, entre em contato com o administrador do sistema.</p>
    <div class="footer">
      <p>Loft CRM - Sistema de Gestão Comercial</p>
      <p>Este é um email automático, não responda.</p>
    </div>
  </div>
</body>
</html>
`;

const roleLabels: Record<string, string> = {
  sdr: "SDR",
  consultor: "Consultor",
  gestor: "Gestor",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { type, userEmail, userName, requestedRole, justificativa, rejectionReason }: NotificationRequest = await req.json();

    console.log(`Processing ${type} notification for ${userEmail}`);

    let emailResponse;

    if (type === "access_request") {
      // Send to admin
      emailResponse = await resend.emails.send({
        from: "Loft CRM <noreply@resend.dev>",
        to: [ADMIN_EMAIL],
        subject: `[Loft CRM] Nova Solicitação de Acesso: ${userName}`,
        html: getAccessRequestEmailHtml(
          userName,
          userEmail,
          roleLabels[requestedRole || "consultor"] || requestedRole || "Consultor",
          justificativa
        ),
      });
    } else if (type === "approval") {
      // Send to user
      emailResponse = await resend.emails.send({
        from: "Loft CRM <noreply@resend.dev>",
        to: [userEmail],
        subject: "[Loft CRM] Seu acesso foi aprovado! 🎉",
        html: getApprovalEmailHtml(userName, roleLabels[requestedRole || "consultor"] || requestedRole || "Consultor"),
      });
    } else if (type === "rejection") {
      // Send to user
      emailResponse = await resend.emails.send({
        from: "Loft CRM <noreply@resend.dev>",
        to: [userEmail],
        subject: "[Loft CRM] Atualização sobre sua solicitação de acesso",
        html: getRejectionEmailHtml(userName, rejectionReason),
      });
    } else {
      throw new Error("Invalid notification type");
    }

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-user-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
