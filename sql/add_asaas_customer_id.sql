-- Adicionar coluna asaas_customer_id na tabela clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS asaas_customer_id TEXT;

-- Criar índice para facilitar consultas
CREATE INDEX IF NOT EXISTS idx_clients_asaas_customer_id ON clients(asaas_customer_id);
