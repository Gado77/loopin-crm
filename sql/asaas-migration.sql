-- ====================================================================
-- Loopin CRM — Migração de Banco para Integração Asaas
-- Execute no Supabase SQL Editor (seguro para rodar múltiplas vezes)
-- ====================================================================

-- 1. Colunas Asaas em clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS asaas_customer_id TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Colunas Asaas em invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS asaas_payment_id TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS asaas_billing_type TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS asaas_invoice_url TEXT;

-- 3. Criar tabela contracts ANTES de referenciar ela em invoices
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  monthly_value NUMERIC NOT NULL DEFAULT 0,
  total_months INTEGER DEFAULT 12,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para contracts
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'contracts' AND policyname = 'Allow all on contracts'
  ) THEN
    CREATE POLICY "Allow all on contracts" ON contracts FOR ALL USING (true);
  END IF;
END$$;

-- 4. contract_id em invoices (depois que contracts já existe)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL;

-- 5. Índices de performance
CREATE INDEX IF NOT EXISTS idx_invoices_asaas_payment_id ON invoices(asaas_payment_id);
CREATE INDEX IF NOT EXISTS idx_clients_asaas_customer_id ON clients(asaas_customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);

-- 7. Coluna asaas_subscription_id em contracts
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS asaas_subscription_id TEXT;
CREATE INDEX IF NOT EXISTS idx_contracts_asaas_subscription_id ON contracts(asaas_subscription_id);

-- 6. Verificação final
SELECT '=== invoices ===' AS tabela;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns WHERE table_name = 'invoices' ORDER BY ordinal_position;

SELECT '=== clients ===' AS tabela;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns WHERE table_name = 'clients' ORDER BY ordinal_position;
