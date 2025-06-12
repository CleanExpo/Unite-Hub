import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Create and initialize SQLite database
export async function initDb() {
  const db = await open({
    filename: './crm.db',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      company_name TEXT NOT NULL,
      contact_person TEXT,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      website TEXT,
      industry TEXT,
      company_size TEXT,
      annual_revenue REAL,
      client_status TEXT DEFAULT 'lead',
      tags TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT,
      last_contact_date TEXT,
      address_line1 TEXT,
      address_line2 TEXT,
      city TEXT,
      state TEXT,
      postal_code TEXT,
      country TEXT DEFAULT 'Australia'
    );
    
    CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(client_status);
    CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
    CREATE INDEX IF NOT EXISTS idx_clients_company ON clients(company_name);
  `);

  return db;
}
