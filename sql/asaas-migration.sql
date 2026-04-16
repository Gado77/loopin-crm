-- ====================================================================
-- Loopin CRM — Migração de Banco para Integração Asaas Completa
-- Execute este script no Supabase SQL Editor
-- Data: Abril 2026
-- ====================================================================

-- 1. Adicionar colunas Asaas em clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS asaas_customer_id TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Adicionar colunas Asaas em invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS asaas_payment_id TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS asaas_billing_type TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS asaas_invoice_url TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL;

-- 3. Adicionar updated_at em clients (se não existir)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 4. Índices para performance de queries Asaas
CREATE INDEX IF NOT EXISTS idx_invoices_asaas_payment_id ON invoices(asaas_payment_id);
CREATE INDEX IF NOT EXISTS idx_clients_asaas_customer_id ON clients(asaas_customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);

-- 5. Verificação: listar campos das tabelas
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'invoices' ORDER BY ordinal_position;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'clients' ORDER BY ordinal_position;
