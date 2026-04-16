-- Adicionar campos de contrato aos clientes
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contract_months INTEGER;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contract_start_date DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contract_monthly_value NUMERIC;
