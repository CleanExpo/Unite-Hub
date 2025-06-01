import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env file
const envPath = path.join(path.resolve(), '.env');
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });

// Log environment variables for debugging
console.log('Environment variables:', Object.keys(process.env).filter(key => 
  key.includes('SUPABASE') || key.includes('DATABASE') || key === 'NODE_ENV'
).map(key => `${key}=${key.includes('KEY') ? '*****' : process.env[key]}`));

// Get environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase environment variables');
  console.error('Make sure .env file exists with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('Supabase URL:', SUPABASE_URL);
console.log('Supabase Key:', SUPABASE_KEY ? '*****' : 'missing');

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  db: { schema: 'public' }
});

// Get current directory (use process.cwd() for the working directory)
const baseDir = process.cwd();
const migrationsDir = path.join(baseDir, 'database');

// List of SQL files to execute in order
const migrationFiles = [
  'create_execute_sql_function.sql', // Must be first
  'create_clients_table.sql',
  'crm_activity_tracking.sql',
  'crm_document_management.sql',
  'crm_pipeline_management.sql'
];

async function runMigration() {
  try {
    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      if (file === 'create_execute_sql_function.sql') {
        // Execute SQL directly using Supabase REST API
        const { error } = await supabase
          .from('pg_catalog.pg_proc') // Use a system table to bypass RLS
          .insert([{ sql }]);
          
        if (error) {
          console.error(`Error executing ${file}:`, error);
          return;
        }
      } else {
        // Execute SQL using rpc method
        const { error } = await supabase.rpc('execute_sql', { sql });
        
        if (error) {
          console.error(`Error executing ${file}:`, error);
          return;
        }
      }
      
      console.log(`Migration successful: ${file}`);
    }
    
    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
