-- Add assignment notification columns to admin_notification_settings table if they don't exist
DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'admin_notification_settings' 
                  AND column_name = 'assignment_notifications') THEN
       ALTER TABLE admin_notification_settings 
       ADD COLUMN assignment_notifications BOOLEAN DEFAULT TRUE,
       ADD COLUMN status_change_notifications BOOLEAN DEFAULT TRUE;
   END IF;
END $$;
