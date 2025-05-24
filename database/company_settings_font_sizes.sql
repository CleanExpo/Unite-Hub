-- Add font_sizes column to company_settings table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'company_settings' 
        AND column_name = 'font_sizes'
    ) THEN
        ALTER TABLE company_settings 
        ADD COLUMN font_sizes JSONB DEFAULT '{
            "heading1": 24,
            "heading2": 18,
            "heading3": 14,
            "body": 12,
            "small": 10,
            "footer": 8
        }'::jsonb;
    END IF;
END $$;

-- Update existing font_settings structure to include font_sizes
UPDATE company_settings 
SET font_settings = font_settings || '{
    "fontSizes": {
        "heading1": 24,
        "heading2": 18,
        "heading3": 14,
        "body": 12,
        "small": 10,
        "footer": 8
    }
}'::jsonb
WHERE font_settings IS NOT NULL 
AND NOT (font_settings ? 'fontSizes');

-- Add font_sizes to font_settings for new records
UPDATE company_settings 
SET font_settings = '{
    "headingFont": "helvetica",
    "bodyFont": "helvetica",
    "useCustomFont": false,
    "fontSizes": {
        "heading1": 24,
        "heading2": 18,
        "heading3": 14,
        "body": 12,
        "small": 10,
        "footer": 8
    }
}'::jsonb
WHERE font_settings IS NULL;
