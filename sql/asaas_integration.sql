-- Adicionar colunas para integração Asaas na tabela clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS asaas_customer_id TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Criar índice para facilitar consultas
CREATE INDEX IF NOT EXISTS idx_clients_asaas_customer_id ON clients(asaas_customer_id);

-- Adicionar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Adicionar colunas na tabela invoices para Asaas
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS asaas_payment_id TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS asaas_billing_type TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS asaas_invoice_url TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS asaasPix_qr_code TEXT;

-- Criar índices para invoices
CREATE INDEX IF NOT EXISTS idx_invoices_asaas_payment_id ON invoices(asaas_payment_id);
