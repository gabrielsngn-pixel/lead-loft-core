import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("Resend webhook received:", JSON.stringify(payload));

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Resend sends events as { type, created_at, data: { email_id, to, ... } }
    const eventType = payload.type || payload.event || "unknown";
    const data = payload.data || {};
    const messageId = data.email_id || payload.message_id || null;
    const recipientEmail = Array.isArray(data.to) ? data.to[0] : (data.to || data.email || null);
    const eventTimestamp = payload.created_at || data.created_at || new Date().toISOString();

    // Insert into webhook events table
    const { error: insertError } = await supabaseAdmin
      .from("email_webhook_events")
      .insert({
        provider_message_id: messageId,
        event_type: eventType,
        recipient_email: recipientEmail,
        event_timestamp: eventTimestamp,
        raw_payload: payload,
      });

    if (insertError) {
      console.error("Failed to store webhook event:", insertError.message);
    }

    // Update message_logs status based on event type
    if (messageId) {
      const statusMap: Record<string, { status: string; field?: string }> = {
        "email.delivered": { status: "delivered", field: "delivered_at" },
        "email.opened": { status: "read", field: "read_at" },
        "email.clicked": { status: "read" },
        "email.bounced": { status: "failed" },
        "email.complained": { status: "failed" },
      };

      const mapping = statusMap[eventType];
      if (mapping) {
        const updateData: Record<string, string> = { status: mapping.status };
        if (mapping.field) {
          updateData[mapping.field] = eventTimestamp;
        }

        const { error: updateError } = await supabaseAdmin
          .from("message_logs")
          .update(updateData)
          .eq("provider_message_id", messageId);

        if (updateError) {
          console.error("Failed to update message_logs:", updateError.message);
        } else {
          console.log(`Updated message_logs: ${messageId} → ${mapping.status}`);
        }
      }

      // ── Click tracking: mark lead as HOT + notify owner ──
      if (eventType === "email.clicked") {
        const { data: msgLog } = await supabaseAdmin
          .from("message_logs")
          .select("lead_id, user_id, subject, recipient")
          .eq("provider_message_id", messageId)
          .maybeSingle();

        if (msgLog?.lead_id) {
          // Update lead priority to alta (HOT) and bump interaction date
          const { error: leadErr } = await supabaseAdmin
            .from("leads")
            .update({
              prioridade: "alta",
              data_ultima_interacao: new Date().toISOString(),
            })
            .eq("id", msgLog.lead_id);

          if (leadErr) {
            console.error("Failed to update lead priority:", leadErr.message);
          } else {
            console.log(`Lead ${msgLog.lead_id} marked as HOT (alta) due to email click`);
          }

          // Fetch lead details for activity + notification
          const { data: lead } = await supabaseAdmin
            .from("leads")
            .select("razao_social, responsavel_id, responsavel_nome")
            .eq("id", msgLog.lead_id)
            .maybeSingle();

          if (lead) {
            // Record click as activity
            await supabaseAdmin.from("activities").insert({
              lead_id: msgLog.lead_id,
              tipo: "email",
              categoria: "comercial",
              titulo: `🔥 Lead clicou no e-mail: ${msgLog.subject || "Sem assunto"}`,
              descricao: `O contato ${msgLog.recipient || ""} clicou em um link do e-mail. Lead marcado como prioridade ALTA automaticamente.`,
              data_agendada: new Date().toISOString(),
              concluida: true,
              data_conclusao: new Date().toISOString(),
              status_andamento: "concluida",
              responsavel_id: lead.responsavel_id || msgLog.user_id,
              responsavel_nome: lead.responsavel_nome || "",
              criado_por: msgLog.user_id,
              criado_por_nome: "Sistema",
            });
          }

          // Notify responsible user via email
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
                      subject: `🔥 Lead HOT: ${lead.razao_social} clicou no seu e-mail`,
                      html: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;padding:20px;color:#1a202c;">
  <div style="max-width:500px;margin:0 auto;background:#fff;border-radius:12px;border:2px solid #FF774A;padding:24px;">
    <h2 style="color:#FF774A;margin-top:0;">🔥 Lead Engajado!</h2>
    <p><strong>${lead.razao_social}</strong> clicou em um link do e-mail "<em>${msgLog.subject || ""}</em>".</p>
    <p>Este lead foi automaticamente marcado como <strong style="color:#FF774A;">prioridade ALTA</strong>.</p>
    <p style="margin-top:16px;color:#666;">Recomendação: entre em contato o mais rápido possível.</p>
    <hr style="border:none;border-top:1px solid #eee;margin:16px 0;">
    <p style="font-size:12px;color:#888;">Notificação automática do Loft CRM</p>
  </div>
</body></html>`,
                    }),
                  });
                  console.log(`Click notification sent to ${ownerProfile.email}`);
                } catch (notifErr) {
                  console.error("Failed to send click notification:", notifErr);
                }
              }
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Webhook error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 200, // Return 200 even on errors to prevent Resend retries
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
