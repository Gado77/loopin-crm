import Database from 'better-sqlite3'
import { hashSync } from 'bcryptjs'

export interface DbClient {
  id: string
  name: string
  email: string | null
  phone: string | null
  document: string | null
  address: string | null
  grace_days: number
  created_at: string
}

export interface DbEstablishment {
  id: string
  client_id: string
  name: string
  address: string | null
  monthly_fee: number
  created_at: string
}

export interface DbInvoice {
  id: string
  client_id: string
  establishment_id: string | null
  amount: number
  due_date: string
  status: string
  paid_at: string | null
  notes: string | null
  created_at: string
}

let db: Database.Database | null = null

export function useDb(): Database.Database {
  if (!db) {
    db = new Database('loopin-crm.db')
    initDb(db)
  }
  return db
}

function initDb(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      document TEXT,
      address TEXT,
      grace_days INTEGER DEFAULT 30,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS establishments (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      name TEXT NOT NULL,
      address TEXT,
      monthly_fee REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      establishment_id TEXT,
      amount REAL NOT NULL,
      due_date DATE NOT NULL,
      status TEXT DEFAULT 'pending',
      paid_at DATETIME,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
      FOREIGN KEY (establishment_id) REFERENCES establishments(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS expense_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      category_id TEXT,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES expense_categories(id) ON DELETE SET NULL
    );
  `)

  const defaultCategories = [
    'Infraestrutura',
    'Marketing',
    'Funcionários',
    'Software/Assinaturas',
    'Manutenção',
    'Utilidades',
    'Impostos',
    'Outros',
  ]

  const existingCategories = database.prepare('SELECT COUNT(*) as count FROM expense_categories').get() as { count: number }
  if (existingCategories.count === 0) {
    const insertCategory = database.prepare('INSERT INTO expense_categories (id, name) VALUES (?, ?)')
    defaultCategories.forEach((cat, i) => {
      insertCategory.run(`cat-${i + 1}`, cat)
    })
  }

  const existingUsers = database.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
  if (existingUsers.count === 0) {
    const adminHash = hashSync('admin123', 12)
    database.prepare('INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)').run(
      'user-admin',
      'admin@loopin.com',
      adminHash,
      'Administrador'
    )
  }
}
