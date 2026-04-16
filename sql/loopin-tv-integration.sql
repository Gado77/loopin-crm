-- ====================================================================
-- Loopin CRM — Integração Loopin.tv e Métricas
-- ====================================================================

-- 1. Tabela de sincronização com Loopin.tv
CREATE TABLE IF NOT EXISTS loopin_tv_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  loopin_tv_advertiser_id TEXT,
  last_sync TIMESTAMPTZ,
  campaigns_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id)
);

-- RLS para loopin_tv_sync
ALTER TABLE loopin_tv_sync ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'loopin_tv_sync' AND policyname = 'Allow all on loopin_tv_sync') THEN
    CREATE POLICY "Allow all on loopin_tv_sync" ON loopin_tv_sync FOR ALL USING (true);
  END IF;
END$$;


-- 2. Tabela de métricas de telas
CREATE TABLE IF NOT EXISTS screen_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  views INTEGER DEFAULT 0,
  recorded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para screen_metrics
ALTER TABLE screen_metrics ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'screen_metrics' AND policyname = 'Allow all on screen_metrics') THEN
    CREATE POLICY "Allow all on screen_metrics" ON screen_metrics FOR ALL USING (true);
  END IF;
END$$;


-- 3. Function para verificar inadimplência
-- Retorna BOOLEAN indicando se o cliente tem faturas em atraso além do período de carência (grace_days)
CREATE OR REPLACE FUNCTION check_client_overdue(client_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  has_overdue BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM invoices 
    WHERE client_id = client_uuid 
    AND status = 'overdue'
    AND due_date < CURRENT_DATE - (SELECT COALESCE(grace_days, 30) FROM clients WHERE id = client_uuid)
  ) INTO has_overdue;
  
  RETURN has_overdue;
END;
$$ LANGUAGE plpgsql;
