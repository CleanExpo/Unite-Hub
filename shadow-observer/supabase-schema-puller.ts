/**
 * Supabase Schema Puller
 * Introspects Supabase schema non-destructively
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { shadowConfig } from './shadow-config';

export interface SchemaTable {
  id: string;
  name: string;
  schema: string;
  columns: Array<{
    name: string;
    type: string;
    nullable: boolean;
    default: string | null;
  }>;
  policies: Array<{
    name: string;
    type: string;
    definition: string;
  }>;
  indexes: string[];
}

export interface SchemaAnalysis {
  tables: SchemaTable[];
  warnings: Array<{
    table: string;
    type: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
  }>;
  timestamp: string;
}

/**
 * Pull schema from Supabase using information_schema
 * This is read-only and uses the service role for introspection
 */
export async function pullSupabaseSchema(): Promise<SchemaAnalysis> {
  try {
    const client = createClient(
      shadowConfig.supabaseUrl,
      shadowConfig.supabaseServiceKey
    );

    // Query information_schema for all tables
    const { data: tables, error: tablesError } = await client
      .from('information_schema.tables')
      .select('*')
      .eq('table_schema', 'public');

    if (tablesError) throw new Error(`Failed to fetch tables: ${tablesError.message}`);

    const analysis: SchemaAnalysis = {
      tables: [],
      warnings: [],
      timestamp: new Date().toISOString()
    };

    // For each table, fetch columns and policies
    for (const table of tables || []) {
      const { data: columns, error: columnsError } = await client
        .from('information_schema.columns')
        .select('*')
        .eq('table_schema', 'public')
        .eq('table_name', table.table_name);

      if (columnsError) continue;

      const schemaTable: SchemaTable = {
        id: table.table_name,
        name: table.table_name,
        schema: 'public',
        columns: (columns || []).map(col => ({
          name: col.column_name,
          type: col.data_type,
          nullable: col.is_nullable === 'YES',
          default: col.column_default
        })),
        policies: [], // Would need custom RLS introspection
        indexes: []
      };

      // Check for RLS
      const hasRls = (columns || []).some(col => col.column_name === 'tenant_id');
      if (!hasRls && table.table_name.includes('public')) {
        analysis.warnings.push({
          table: table.table_name,
          type: 'missing_rls',
          description: `Table "${table.table_name}" lacks tenant_id or RLS policy`,
          severity: 'high'
        });
      }

      analysis.tables.push(schemaTable);
    }

    return analysis;
  } catch (error) {
    console.error('Schema pull failed:', error);
    throw error;
  }
}

/**
 * Save schema analysis to report
 */
export async function saveSchemaReport(analysis: SchemaAnalysis): Promise<void> {
  const reportPath = path.join(shadowConfig.reportDir, 'schema_health.json');

  // Ensure reports directory exists
  if (!fs.existsSync(shadowConfig.reportDir)) {
    fs.mkdirSync(shadowConfig.reportDir, { recursive: true });
  }

  fs.writeFileSync(reportPath, JSON.stringify(analysis, null, 2));
  console.log(`✓ Schema report saved: ${reportPath}`);
}

export async function main() {
  try {
    console.log('🔍 Pulling Supabase schema...');
    const analysis = await pullSupabaseSchema();
    await saveSchemaReport(analysis);

    console.log(`✓ Found ${analysis.tables.length} tables`);
    console.log(`⚠ Found ${analysis.warnings.length} warnings`);

    return analysis;
  } catch (error) {
    console.error('❌ Schema pull failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
