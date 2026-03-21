DELETE FROM message_logs WHERE sent_at >= '2026-03-21 00:00:00+00';
DELETE FROM email_webhook_events WHERE created_at >= '2026-03-21 00:00:00+00';