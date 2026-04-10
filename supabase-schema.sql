-- Loopin CRM Database Schema for Supabase PostgreSQL

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  document TEXT,
  address TEXT,
  grace_days INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Establishments table
CREATE TABLE IF NOT EXISTS establishments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  monthly_fee NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  establishment_id UUID REFERENCES establishments(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expense categories table
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default expense categories
INSERT INTO expense_categories (id, name) 
SELECT gen_random_uuid(), name FROM unnest(ARRAY[
  'Infraestrutura',
  'Marketing',
  'Funcionários',
  'Software/Assinaturas',
  'Manutenção',
  'Utilidades',
  'Impostos',
  'Outros'
]) AS name
WHERE NOT EXISTS (SELECT 1 FROM expense_categories);

-- Insert default admin user (password: admin123)
INSERT INTO users (id, email, password_hash, name)
SELECT gen_random_uuid(), 'admin@loopin.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYWPQFQfN6Fe', 'Administrador'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@loopin.com');

-- Row Level Security (RLS) - disable for now since this is a simple app
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Allow all operations (simplified for this app)
CREATE POLICY "Allow all on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all on clients" ON clients FOR ALL USING (true);
CREATE POLICY "Allow all on establishments" ON establishments FOR ALL USING (true);
CREATE POLICY "Allow all on invoices" ON invoices FOR ALL USING (true);
CREATE POLICY "Allow all on expense_categories" ON expense_categories FOR ALL USING (true);
CREATE POLICY "Allow all on transactions" ON transactions FOR ALL USING (true);
