-- Complete RLS policies for email_triage_results
-- Previously only SELECT was defined (migration 20260318000001)
-- Missing INSERT/UPDATE/DELETE caused founder to be unable to archive/delete own triage results

CREATE POLICY "founder_email_triage_insert" ON email_triage_results
  FOR INSERT WITH CHECK (founder_id = auth.uid());

CREATE POLICY "founder_email_triage_update" ON email_triage_results
  FOR UPDATE USING (founder_id = auth.uid()) WITH CHECK (founder_id = auth.uid());

CREATE POLICY "founder_email_triage_delete" ON email_triage_results
  FOR DELETE USING (founder_id = auth.uid());
