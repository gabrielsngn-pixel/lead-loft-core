import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALLOWED_DOMAINS = ["outreach.loftinsights.com.br"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { to, subject, body, lead_id, template_id, bulk_dispatch_id, from_name } =
      await req.json();

    if (!to || !subject || !body) {
      throw new Error("Missing required fields: to, subject, body");
    }

    // Load sender identity from profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("nome, sender_name, sender_email, reply_to_email, email_signature_html")
      .eq("user_id", user.id)
      .maybeSingle();

    const senderName = from_name || profile?.sender_name || profile?.nome || "Loft Incorporações";
    const senderEmail = profile?.sender_email || "contato@outreach.loftinsights.com.br";
    const replyTo = profile?.reply_to_email || user.email || "";

    // Validate sender email domain
    const senderDomain = senderEmail.split("@")[1];
    if (!ALLOWED_DOMAINS.includes(senderDomain)) {
      throw new Error(`Sender domain '${senderDomain}' not allowed. Allowed: ${ALLOWED_DOMAINS.join(", ")}`);
    }

    // Build final HTML with proper email structure
    // Don't replace \n with <br/> on rich HTML — it breaks tags
    const isRichHtml = /<[a-z][\s\S]*>/i.test(body);
    let bodyHtml = isRichHtml ? body : body.replace(/\n/g, "<br/>");

    let signatureBlock = "";
    if (profile?.email_signature_html) {
      signatureBlock = `<div style="margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0;">${profile.email_signature_html}</div>`;
    }

    const finalHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
</head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#1a202c;background-color:#ffffff;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    ${bodyHtml}
    ${signatureBlock}
  </div>
</body>
</html>`;

    // Send via Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${senderName} <${senderEmail}>`,
        to: [to],
        subject,
        html: finalHtml,
        reply_to: replyTo,
      }),
    });

    const resendData = await resendResponse.json();
    const emailStatus = resendResponse.ok ? "sent" : "failed";

    // Log to message_logs
    await supabase.from("message_logs").insert({
      lead_id: lead_id || null,
      user_id: user.id,
      channel: "email",
      recipient: to,
      subject,
      body,
      status: emailStatus,
      provider_message_id: resendData?.id || null,
      template_id: template_id || null,
      bulk_dispatch_id: bulk_dispatch_id || null,
      sender_name: senderName,
      sender_email: senderEmail,
      reply_to: replyTo,
    });

    // Create activity if lead_id provided
    if (lead_id && emailStatus === "sent") {
      await supabase.from("activities").insert({
        lead_id,
        tipo: "email",
        categoria: "comercial",
        titulo: `E-mail enviado: ${subject}`,
        descricao: body.substring(0, 500),
        data_agendada: new Date().toISOString(),
        concluida: true,
        data_conclusao: new Date().toISOString(),
        status_andamento: "concluida",
        responsavel_id: user.id,
        responsavel_nome: profile?.nome || "",
        criado_por: user.id,
        criado_por_nome: profile?.nome || "",
      });
    }

    if (!resendResponse.ok) {
      throw new Error(`Resend API error: ${JSON.stringify(resendData)}`);
    }

    return new Response(
      JSON.stringify({ success: true, message_id: resendData.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("send-email error:", message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
