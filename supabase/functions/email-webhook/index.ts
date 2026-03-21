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
