#!/bin/bash

# Set the path to the SQL file
SQL_FILE="database/rename_clients_table.sql"

# Use service role key for migration
SUPABASE_URL="https://your-project-ref.supabase.co"
SERVICE_ROLE_KEY="your-service-role-key"

# Execute the SQL file using psql with service role key
psql "postgresql://postgres:$SERVICE_ROLE_KEY@db.your-project-ref.supabase.co:5432/postgres" -f "$SQL_FILE"

# Check the exit status
if [ $? -eq 0 ]; then
    echo "Migration completed successfully"
else
    echo "Migration failed"
    exit 1
fi
