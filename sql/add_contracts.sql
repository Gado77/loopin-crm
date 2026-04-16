-- Contratos table
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  months INTEGER NOT NULL,
  monthly_value NUMERIC NOT NULL,
  total_value NUMERIC NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active', -- active, completed, cancelled
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add contract_id to invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL;

-- RLS
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on contracts" ON contracts FOR ALL USING (true);
