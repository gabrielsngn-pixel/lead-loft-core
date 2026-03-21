import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("Inbound email received:", JSON.stringify(payload).substring(0, 500));

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Resend inbound webhook payload fields
    const fromEmail = payload.from || "";
    const toAddresses: string[] = Array.isArray(payload.to) ? payload.to : [payload.to || ""];
    const subject = payload.subject || "";
    const textBody = payload.text || "";
    const htmlBody = payload.html || "";
    const timestamp = payload.created_at || new Date().toISOString();

    // Extract provider_message_id from the tagged reply-to address
    // Format: reply+{provider_message_id}@outreach.loftinsights.com.br
    let originalMessageId: string | null = null;
    for (const addr of toAddresses) {
      const match = addr.match(/reply\+([a-f0-9-]+)@/i);
      if (match) {
        originalMessageId = match[1];
        break;
      }
    }

    console.log("Parsed inbound — from:", fromEmail, "originalMessageId:", originalMessageId);

    let matchedLeadId: string | null = null;
    let matchedUserId: string | null = null;
    let originalSubject: string | null = null;

    if (originalMessageId) {
      // Find the original outbound message by provider_message_id
      const { data: originalMsg } = await supabaseAdmin
        .from("message_logs")
        .select("id, lead_id, user_id, subject, recipient, sender_email, sender_name")
        .eq("provider_message_id", originalMessageId)
        .maybeSingle();

      if (originalMsg) {
        matchedLeadId = originalMsg.lead_id;
        matchedUserId = originalMsg.user_id;
        originalSubject = originalMsg.subject;

        // Update original message status to "replied"
        await supabaseAdmin
          .from("message_logs")
          .update({
            status: "replied",
            replied_at: timestamp,
          })
          .eq("provider_message_id", originalMessageId);

        console.log(`Original message ${originalMessageId} marked as replied`);
      }
    } else {
      // Fallback: try to match by sender email in leads table
      const senderAddr = fromEmail.match(/<([^>]+)>/)?.[1] || fromEmail;
      const { data: lead } = await supabaseAdmin
        .from("leads")
        .select("id, responsavel_id")
        .eq("email", senderAddr.toLowerCase().trim())
        .maybeSingle();

      if (lead) {
        matchedLeadId = lead.id;
        matchedUserId = lead.responsavel_id;

        // Also try to update the most recent outbound message to this lead as replied
        const { data: recentMsg } = await supabaseAdmin
          .from("message_logs")
          .select("provider_message_id")
          .eq("lead_id", lead.id)
          .eq("channel", "email")
          .in("status", ["sent", "delivered", "read"])
          .order("sent_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (recentMsg?.provider_message_id) {
          await supabaseAdmin
            .from("message_logs")
            .update({
              status: "replied",
              replied_at: timestamp,
            })
            .eq("provider_message_id", recentMsg.provider_message_id);

          console.log(`Fallback match: marked ${recentMsg.provider_message_id} as replied`);
        }
      }
    }

    // Log the inbound reply as a new message_log entry
    const { error: insertError } = await supabaseAdmin
      .from("message_logs")
      .insert({
        lead_id: matchedLeadId,
        user_id: matchedUserId || "00000000-0000-0000-0000-000000000000",
        channel: "email",
        recipient: toAddresses[0] || null,
        subject: subject || `Re: ${originalSubject || ""}`,
        body: textBody || htmlBody || "(sem conteúdo)",
        status: "replied",
        sender_name: fromEmail,
        sender_email: fromEmail.match(/<([^>]+)>/)?.[1] || fromEmail,
        reply_to: fromEmail,
      });

    if (insertError) {
      console.error("Failed to insert inbound message log:", insertError.message);
    }

    // Record activity on the lead if matched
    if (matchedLeadId) {
      // Update lead interaction date
      await supabaseAdmin
        .from("leads")
        .update({ data_ultima_interacao: new Date().toISOString() })
        .eq("id", matchedLeadId);

      // Get lead details for activity
      const { data: lead } = await supabaseAdmin
        .from("leads")
        .select("razao_social, responsavel_id, responsavel_nome")
        .eq("id", matchedLeadId)
        .maybeSingle();

      if (lead) {
        await supabaseAdmin.from("activities").insert({
          lead_id: matchedLeadId,
          tipo: "email",
          categoria: "comercial",
          titulo: `📩 Resposta recebida: ${subject || "Sem assunto"}`,
          descricao: `O lead ${lead.razao_social} respondeu ao e-mail. Conteúdo: ${(textBody || "").substring(0, 300)}`,
          data_agendada: new Date().toISOString(),
          concluida: true,
          data_conclusao: new Date().toISOString(),
          status_andamento: "concluida",
          responsavel_id: lead.responsavel_id || matchedUserId,
          responsavel_nome: lead.responsavel_nome || "",
          criado_por: matchedUserId || lead.responsavel_id || "00000000-0000-0000-0000-000000000000",
          criado_por_nome: "Sistema",
        });
      }

      // Notify the responsible user via email
      if (lead?.responsavel_id) {
        const { data: ownerProfile } = await supabaseAdmin
          .from("profiles")
          .select("email, nome")
          .eq("user_id", lead.responsavel_id)
          .maybeSingle();

        if (ownerProfile?.email) {
          const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
          if (RESEND_API_KEY) {
            try {
              await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${RESEND_API_KEY}`,
                },
                body: JSON.stringify({
                  from: "Loft CRM <noreply@outreach.loftinsights.com.br>",
                  to: [ownerProfile.email],
                  subject: `📩 ${lead.razao_social} respondeu seu e-mail`,
                  html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;color:#1a202c;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="500" style="max-width:500px;width:100%;border:2px solid #3B82F6;border-radius:12px;">
        <tr><td style="padding:24px;">
          <h2 style="color:#3B82F6;margin-top:0;">📩 Resposta Recebida!</h2>
          <p><strong>${lead.razao_social}</strong> respondeu ao seu e-mail.</p>
          <p><strong>Assunto:</strong> ${subject || "Sem assunto"}</p>
          <p style="background:#f7fafc;padding:12px;border-radius:8px;border-left:3px solid #3B82F6;font-size:13px;color:#4a5568;">${(textBody || "").substring(0, 200)}${(textBody || "").length > 200 ? "..." : ""}</p>
          <p style="margin-top:16px;color:#666;">Verifique sua caixa de entrada para a mensagem completa.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:16px 0;"/>
          <p style="font-size:12px;color:#888;">Notificação automática do Loft CRM</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
                }),
              });
              console.log(`Reply notification sent to ${ownerProfile.email}`);
            } catch (notifErr) {
              console.error("Failed to send reply notification:", notifErr);
            }
          }
        }
      }
    }

    // Also store in webhook events for auditing
    await supabaseAdmin.from("email_webhook_events").insert({
      provider_message_id: originalMessageId,
      event_type: "email.reply_received",
      recipient_email: fromEmail.match(/<([^>]+)>/)?.[1] || fromEmail,
      event_timestamp: timestamp,
      raw_payload: payload,
    });

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Inbound email error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 200, // Return 200 to prevent Resend retries
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
