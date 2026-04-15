-- Run this once in Supabase SQL editor
CREATE TABLE IF NOT EXISTS token_logs (
  id                 uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  query              text NOT NULL,
  sonnet_input       integer NOT NULL DEFAULT 0,
  sonnet_output      integer NOT NULL DEFAULT 0,
  haiku_input        integer NOT NULL DEFAULT 0,
  haiku_output       integer NOT NULL DEFAULT 0,
  estimated_cost_usd numeric(10,6) NOT NULL DEFAULT 0,
  created_at         timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS token_logs_created_at_idx ON token_logs (created_at DESC);
