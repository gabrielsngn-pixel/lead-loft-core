import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALLOWED_DOMAINS = ["outreach.loftinsights.com.br"];
const EXCLUDED_STATUSES = ["perdido", "descartado", "inativo"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Service role client for audit logging (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

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

    // ── Ownership & status validation ──
    if (lead_id) {
      const { data: lead, error: leadError } = await supabase
        .from("leads")
        .select("id, responsavel_id, status")
        .eq("id", lead_id)
        .maybeSingle();

      if (leadError || !lead) {
        // Log unauthorized attempt
        await supabaseAdmin.from("admin_action_logs").insert({
          admin_user_id: user.id,
          admin_name: user.email || "unknown",
          action_type: "email_send_blocked",
          details: { reason: "lead_not_found", lead_id, to },
        });
        throw new Error("Lead não encontrado");
      }

      if (lead.responsavel_id !== user.id) {
        await supabaseAdmin.from("admin_action_logs").insert({
          admin_user_id: user.id,
          admin_name: user.email || "unknown",
          action_type: "email_send_blocked",
          details: { reason: "not_lead_owner", lead_id, to, owner: lead.responsavel_id },
        });
        throw new Error("Você não tem permissão para enviar emails para leads de outros consultores");
      }

      if (EXCLUDED_STATUSES.includes(lead.status)) {
        await supabaseAdmin.from("admin_action_logs").insert({
          admin_user_id: user.id,
          admin_name: user.email || "unknown",
          action_type: "email_send_blocked",
          details: { reason: "inactive_lead", lead_id, to, status: lead.status },
        });
        throw new Error(`Lead com status '${lead.status}' não pode receber emails`);
      }
    }

    // Load sender identity from profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("nome, sender_name, sender_email, reply_to_email, email_signature_html")
      .eq("user_id", user.id)
      .maybeSingle();

    const senderName = from_name || profile?.sender_name || profile?.nome || "Loft Incorporações";
    const userEmailPrefix = (user.email || "contato").split("@")[0];
    const senderEmail = profile?.sender_email || `${userEmailPrefix}@outreach.loftinsights.com.br`;
    const userReplyTo = profile?.reply_to_email || user.email || "";

    // Validate sender email domain
    const senderDomain = senderEmail.split("@")[1];
    if (!ALLOWED_DOMAINS.includes(senderDomain)) {
      throw new Error(`Sender domain '${senderDomain}' not allowed. Allowed: ${ALLOWED_DOMAINS.join(", ")}`);
    }

    // Build Gmail-safe HTML with table-based layout and inline CSS only
    const isRichHtml = /<[a-z][\s\S]*>/i.test(body);
    const bodyHtml = isRichHtml ? body : body.replace(/\n/g, "<br/>");

    let signatureBlock = "";
    if (profile?.email_signature_html) {
      signatureBlock = `<tr><td style="padding-top:16px;border-top:1px solid #e2e8f0;">${profile.email_signature_html}</td></tr>`;
    }

    const baseHtml = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#ffffff;">
    <tr>
      <td align="center" style="padding:0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;">
          <tr>
            <td style="padding:20px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#1a202c;">
              ${bodyHtml}
            </td>
          </tr>
          ${signatureBlock}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // Convert data URI images to inline CID attachments
    const inlineAttachments: Array<{
      filename: string;
      content: string;
      content_type: string;
      content_id: string;
    }> = [];

    const extByMime: Record<string, string> = {
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/gif": "gif",
      "image/webp": "webp",
      "image/svg+xml": "svg",
    };

    const finalHtml = baseHtml.replace(
      /<img([^>]*?)src=["']data:(image\/[a-zA-Z0-9.+-]+);base64,([^"']+)["']([^>]*)>/gi,
      (_match, before, mime, base64Content, after) => {
        const cid = `inline-image-${inlineAttachments.length + 1}`;
        const ext = extByMime[mime.toLowerCase()] || "bin";

        inlineAttachments.push({
          filename: `${cid}.${ext}`,
          content: String(base64Content).replace(/\s/g, ""),
          content_type: mime,
          content_id: cid,
        });

        return `<img${before}src="cid:${cid}"${after}>`;
      }
    );

    const textFallback = finalHtml
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

    const consultantReplyTo = userReplyTo || user.email;

    // Send via Resend — reply_to points to consultant's real email for clean appearance
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
        text: textFallback,
        reply_to: consultantReplyTo,
        attachments: inlineAttachments.length > 0 ? inlineAttachments : undefined,
        tracking: { opens: true, clicks: true },
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
      reply_to: consultantReplyTo,
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
