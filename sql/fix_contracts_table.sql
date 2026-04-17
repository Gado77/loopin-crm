-- =============================================
-- FIX: Criar tabela contracts completa
-- Execute no SQL Editor do Supabase
-- =============================================

-- 1. Criar tabela contracts (com todas as colunas que a API usa)
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT,                            -- descrição/nome da assinatura
  months INTEGER,                       -- duração em meses (legado)
  total_months INTEGER,                 -- duração em meses (novo campo)
  monthly_value NUMERIC NOT NULL,
  total_value NUMERIC,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT DEFAULT 'active',         -- active, completed, cancelled
  notes TEXT,
  asaas_subscription_id TEXT,           -- ID da assinatura no Asaas
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Adicionar colunas faltantes (caso a tabela já exista)
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS total_months INTEGER;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS asaas_subscription_id TEXT;

-- 3. Adicionar contract_id nas invoices (caso não exista)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL;

-- 4. RLS
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Evitar erro se a policy já existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contracts' AND policyname = 'Allow all on contracts'
  ) THEN
    CREATE POLICY "Allow all on contracts" ON contracts FOR ALL USING (true);
  END IF;
END $$;
