-- Live schema snapshot - FALLBACK
-- Supabase CLI error occurred. Using stub schema.
-- Error: Error: Command failed: supabase db dump --schema-only
Usage:
  supabase db dump [flags]

Flags:
      --data-only         Dumps only data records.
      --db-url string     Dumps from the database specified by the connection string (must be percent-encoded).
      --dry-run           Prints the pg_dump script that would be executed.
  -x, --exclude strings   List of schema.tables to exclude from data-only dump.
  -f, --file string       File path to save the dumped contents.
  -h, --help              help for dump
      --keep-comments     Keeps commented lines from pg_dump output.
      --linked            Dumps from the linked project. (default true)
      --local             Dumps from the local database.
  -p, --password string   Password to your remote Postgres database.
      --role-only         Dumps only cluster roles.
  -s, --schema strings    Comma separated list of schema to include.
      --use-copy          Use copy statements in place of inserts.

Global Flags:
      --create-ticket                                  create a support ticket for any CLI error
      --debug                                          output debug logs to stderr
      --dns-resolver [ native | https ]                lookup domain names using the specified resolver (default native)
      --experimental                                   enable experimental features
      --network-id string                              use the specified docker network instead of a generated one
  -o, --output [ env | pretty | json | toml | yaml ]   output format of status variables (default pretty)
      --profile string                                 use a specific profile for connecting to Supabase API (default "supabase")
      --workdir string                                 path to a Supabase project directory
      --yes                                            answer yes to all prompts

unknown flag: --schema-only
Try rerunning the command with --debug to troubleshoot the error.


CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL
);
