-- Loopin CRM Database Schema for Supabase PostgreSQL (DOOH DOOH Media Network)

-- ==========================================
-- RESET DE BANCO DE DADOS (ATENÇÃO: Isso limpa as tabelas velhas para aplicar a nova estrutura!)
-- ==========================================
DROP TABLE IF EXISTS campaign_establishments CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS establishments CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS expense_categories CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ==========================================
-- CRIAÇÃO DAS TABELAS
-- ==========================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients table (Anunciantes)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  document TEXT,
  address TEXT,
  segment TEXT, -- e.g., restaurante, loja
  lead_source TEXT, -- e.g., Instagram, indicação
  plan_type TEXT,
  monthly_fee NUMERIC DEFAULT 0,
  start_date DATE,
  renewal_date DATE,
  status TEXT DEFAULT 'active', -- active, paused, cancelled
  notes TEXT,
  grace_days INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Establishments table (Ativos / Pontos de TV)
CREATE TABLE IF NOT EXISTS establishments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  responsible_name TEXT,
  address TEXT,
  screens_count INTEGER DEFAULT 1,
  estimated_flow TEXT, -- low, medium, high
  audience_type TEXT, -- jovem, familia, executivo, etc
  location_cost NUMERIC DEFAULT 0, -- custo do ponto (aluguel, permuta)
  status TEXT DEFAULT 'active', -- active, negotiation, inactive
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaigns table (O que está rodando)
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  ad_type TEXT, -- video, imagem
  frequency TEXT, -- 2x/hora, 5x/dia
  proof_of_play_url TEXT,
  status TEXT DEFAULT 'active', -- active, expired
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign Establishments (Muitos para Muitos)
CREATE TABLE IF NOT EXISTS campaign_establishments (
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  PRIMARY KEY (campaign_id, establishment_id)
);

-- Invoices table (Faturamento / Contas a Receber)
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, paid, overdue, cancelled
  paid_at TIMESTAMPTZ,
  payment_method TEXT, -- Pix, Boleto, Dinheiro, Cartão
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expense categories table
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL
);

-- Transactions table (Contas a Pagar / Fluxo)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- income, expense
  category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default expense categories
INSERT INTO expense_categories (id, name) 
SELECT gen_random_uuid(), name FROM unnest(ARRAY[
  'Infraestrutura (TVs/Internet)',
  'Marketing e Vendas',
  'Comissões',
  'Aluguel de Pontos',
  'Software/Assinaturas',
  'Manutenção',
  'Impostos',
  'Outros'
]) AS name
WHERE NOT EXISTS (SELECT 1 FROM expense_categories);

-- Insert default admin user (password: admin123)
INSERT INTO users (id, email, password_hash, name)
SELECT gen_random_uuid(), 'admin@loopin.com', '$2a$10$mJwesRy75Sokw0HfxhA3Euz9hmY2ABD.dNUwFAURGsgcpv4WSMraG', 'Administrador'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@loopin.com');

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Allow all operations (simplified for this app)
CREATE POLICY "Allow all on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all on clients" ON clients FOR ALL USING (true);
CREATE POLICY "Allow all on establishments" ON establishments FOR ALL USING (true);
CREATE POLICY "Allow all on campaigns" ON campaigns FOR ALL USING (true);
CREATE POLICY "Allow all on campaign_establishments" ON campaign_establishments FOR ALL USING (true);
CREATE POLICY "Allow all on invoices" ON invoices FOR ALL USING (true);
CREATE POLICY "Allow all on expense_categories" ON expense_categories FOR ALL USING (true);
CREATE POLICY "Allow all on transactions" ON transactions FOR ALL USING (true);
