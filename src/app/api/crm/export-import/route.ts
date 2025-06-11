import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'export';

    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (action === 'export') {
      return handleExport(request, supabase);
    } else if (action === 'import') {
      return handleImport(request, supabase);
    } else if (action === 'template') {
      return handleTemplate(request);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Export/Import API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');

    if (!entityType) {
      return NextResponse.json({ error: 'Entity type required' }, { status: 400 });
    }

    return handleTemplate(request);

  } catch (error) {
    console.error('Template download error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleExport(request: NextRequest, supabase: any) {
  const body = await request.json();
  const { entities, format, includeMetadata } = body;

  const exportData: { [key: string]: any[] } = {};

  // Fetch data for each selected entity
  for (const entityType of entities) {
    try {
      const query = supabase.from(entityType).select('*');
      
      const { data, error } = await query;
      
      if (error) {
        console.error(`Error fetching ${entityType}:`, error);
        continue;
      }

      // Process data based on includeMetadata flag
      let processedData = data || [];
      if (!includeMetadata) {
        processedData = processedData.map((row: any) => {
          const { created_at, updated_at, ...rest } = row;
          return rest;
        });
      }

      exportData[entityType] = processedData;
    } catch (error) {
      console.error(`Error processing ${entityType}:`, error);
    }
  }

  // Generate file based on format
  if (format === 'csv') {
    const csvContent = generateCSV(exportData);
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=crm-export.csv',
      },
    });
  } else {
    // For Excel, we'd use a library like xlsx, but for demo we'll return CSV
    const csvContent = generateCSV(exportData);
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=crm-export.xlsx',
      },
    });
  }
}

async function handleImport(request: NextRequest, supabase: any) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const entityType = formData.get('entityType') as string;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (!entityType) {
    return NextResponse.json({ error: 'Entity type required' }, { status: 400 });
  }

  try {
    // Read file content
    const content = await file.text();
    const rows = parseCSV(content);
    
    if (rows.length === 0) {
      return NextResponse.json({ error: 'No data found in file' }, { status: 400 });
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);
    
    const result = {
      success: true,
      totalRows: dataRows.length,
      successfulRows: 0,
      failedRows: 0,
      errors: [] as Array<{ row: number; field: string; message: string }>,
      warnings: [] as Array<{ row: number; field: string; message: string }>,
    };

    // Process each row
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNumber = i + 2; // +2 because we skip header and arrays are 0-indexed

      try {
        // Convert row array to object
        const rowData: { [key: string]: any } = {};
        headers.forEach((header, index) => {
          const value = row[index]?.trim();
          if (value && value !== '') {
            rowData[header] = value;
          }
        });

        // Validate required fields
        const validationResult = validateRowData(entityType, rowData, rowNumber);
        if (validationResult.errors.length > 0) {
          result.errors.push(...validationResult.errors);
          result.failedRows++;
          continue;
        }

        if (validationResult.warnings.length > 0) {
          result.warnings.push(...validationResult.warnings);
        }

        // Insert into database
        const { error } = await supabase
          .from(entityType)
          .insert(rowData);

        if (error) {
          result.errors.push({
            row: rowNumber,
            field: 'database',
            message: error.message,
          });
          result.failedRows++;
        } else {
          result.successfulRows++;
        }

      } catch (error) {
        result.errors.push({
          row: rowNumber,
          field: 'processing',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
        result.failedRows++;
      }
    }

    // Determine overall success
    result.success = result.failedRows === 0;

    return NextResponse.json(result);

  } catch (error) {
    return NextResponse.json({
      success: false,
      totalRows: 0,
      successfulRows: 0,
      failedRows: 0,
      errors: [{ row: 0, field: 'file', message: 'Failed to process file' }],
      warnings: [],
    }, { status: 400 });
  }
}

async function handleTemplate(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get('entityType');

  if (!entityType) {
    return NextResponse.json({ error: 'Entity type required' }, { status: 400 });
  }

  const templates = {
    clients: [
      'name,email,phone,company,address,status',
      'John Doe,john@example.com,555-0123,Acme Corp,123 Main St,active',
      'Jane Smith,jane@example.com,555-0124,Tech Inc,456 Oak Ave,active',
    ],
    deals: [
      'title,description,value,stage,status,client_id,assigned_to,expected_close_date',
      'Software License,Annual software license deal,50000,negotiation,open,1,john@company.com,2024-02-01',
      'Consulting Services,Q1 consulting project,25000,proposal,open,2,jane@company.com,2024-03-15',
    ],
    tasks: [
      'title,description,status,priority,assigned_to,client_id,deal_id,due_date',
      'Follow up call,Call client to discuss proposal,pending,high,john@company.com,1,1,2024-01-25',
      'Send contract,Draft and send contract,pending,medium,jane@company.com,2,2,2024-01-30',
    ],
    invoices: [
      'invoice_number,client_id,amount,tax_amount,total_amount,status,due_date',
      'INV-2024-001,1,10000,1000,11000,sent,2024-02-15',
      'INV-2024-002,2,5000,500,5500,draft,2024-02-20',
    ],
  };

  const templateContent = templates[entityType as keyof typeof templates];
  
  if (!templateContent) {
    return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 });
  }

  const csvContent = templateContent.join('\n');

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename=${entityType}-template.csv`,
    },
  });
}

function generateCSV(data: { [key: string]: any[] }): string {
  const sections: string[] = [];

  Object.entries(data).forEach(([entityType, rows]) => {
    if (rows.length === 0) return;

    // Add section header
    sections.push(`\n# ${entityType.toUpperCase()}`);
    
    // Get headers from first row
    const headers = Object.keys(rows[0]);
    sections.push(headers.join(','));
    
    // Add data rows
    rows.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      });
      sections.push(values.join(','));
    });
  });

  return sections.join('\n');
}

function parseCSV(content: string): string[][] {
  const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  const rows: string[][] = [];

  for (const line of lines) {
    const row: string[] = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          currentField += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(currentField);
        currentField = '';
      } else {
        currentField += char;
      }
    }
    
    row.push(currentField); // Add last field
    rows.push(row);
  }

  return rows;
}

function validateRowData(entityType: string, data: any, rowNumber: number) {
  const errors: Array<{ row: number; field: string; message: string }> = [];
  const warnings: Array<{ row: number; field: string; message: string }> = [];

  const requiredFields = {
    clients: ['name'],
    deals: ['title', 'value'],
    tasks: ['title'],
    invoices: ['invoice_number', 'amount'],
  };

  const required = requiredFields[entityType as keyof typeof requiredFields] || [];

  // Check required fields
  required.forEach(field => {
    if (!data[field] || data[field].toString().trim() === '') {
      errors.push({
        row: rowNumber,
        field,
        message: `${field} is required`,
      });
    }
  });

  // Type-specific validations
  if (entityType === 'clients' && data.email && !isValidEmail(data.email)) {
    errors.push({
      row: rowNumber,
      field: 'email',
      message: 'Invalid email format',
    });
  }

  if ((entityType === 'deals' || entityType === 'invoices') && data.value) {
    const value = parseFloat(data.value);
    if (isNaN(value) || value < 0) {
      errors.push({
        row: rowNumber,
        field: 'value',
        message: 'Value must be a positive number',
      });
    }
  }

  // Date validations
  const dateFields = ['due_date', 'expected_close_date'];
  dateFields.forEach(field => {
    if (data[field] && !isValidDate(data[field])) {
      warnings.push({
        row: rowNumber,
        field,
        message: `${field} format may be invalid, please use YYYY-MM-DD`,
      });
    }
  });

  return { errors, warnings };
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}
