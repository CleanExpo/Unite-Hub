-- Update existing font_settings structure to include line_spacing
UPDATE company_settings 
SET font_settings = font_settings || '{
    "lineSpacing": {
        "heading1": 1.2,
        "heading2": 1.25,
        "heading3": 1.3,
        "body": 1.5,
        "small": 1.4,
        "footer": 1.3
    }
}'::jsonb
WHERE font_settings IS NOT NULL 
AND NOT (font_settings ? 'lineSpacing');

-- Add line_spacing to font_settings for new records
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
    },
    "lineSpacing": {
        "heading1": 1.2,
        "heading2": 1.25,
        "heading3": 1.3,
        "body": 1.5,
        "small": 1.4,
        "footer": 1.3
    }
}'::jsonb
WHERE font_settings IS NULL;

-- Create index for better performance on font_settings queries
CREATE INDEX IF NOT EXISTS idx_company_settings_font_settings 
ON company_settings USING GIN (font_settings);
