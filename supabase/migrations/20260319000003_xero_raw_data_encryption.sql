-- UNI-1593: Secure raw_xero_data in bookkeeper_transactions
--
-- raw_xero_data (JSONB) stores full Xero API responses unencrypted —
-- bank account details, invoice data, customer PII.
--
-- Strategy:
--   1. Add raw_xero_data_encrypted (TEXT) for AES-256-GCM ciphertext going forward
--   2. Add raw_xero_data_iv and raw_xero_data_salt for decryption
--   3. NULL out existing raw_xero_data rows (data is debug-only, not load-bearing)
--   4. Application layer (orchestrator.ts) encrypts before write, decrypts on read
--
-- NOTE: raw_xero_data column is NOT dropped here to allow rollback.
--       Drop it in the next sprint after confirming orchestrator is writing encrypted.

ALTER TABLE public.bookkeeper_transactions
  ADD COLUMN IF NOT EXISTS raw_xero_data_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS raw_xero_data_iv        TEXT,
  ADD COLUMN IF NOT EXISTS raw_xero_data_salt      TEXT;

-- Clear existing unencrypted data — this is diagnostic/debug data,
-- not required for reconciliation (amount, date, description are in dedicated columns).
UPDATE public.bookkeeper_transactions
  SET raw_xero_data = NULL
  WHERE raw_xero_data IS NOT NULL;
