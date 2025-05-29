-- Update existing font_settings structure to include paragraph_spacing
UPDATE company_settings 
SET font_settings = font_settings || '{
    "paragraphSpacing": {
        "paragraphSpacing": 10,
        "headingBottomSpacing": 12,
        "headingTopSpacing": 18,
        "sectionSpacing": 25,
        "listItemSpacing": 5,
        "blockElementSpacing": 15
    }
}'::jsonb
WHERE font_settings IS NOT NULL 
AND NOT (font_settings ? 'paragraphSpacing');

-- Add paragraph_spacing to font_settings for new records
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
    },
    "paragraphSpacing": {
        "paragraphSpacing": 10,
        "headingBottomSpacing": 12,
        "headingTopSpacing": 18,
        "sectionSpacing": 25,
        "listItemSpacing": 5,
        "blockElementSpacing": 15
    }
}'::jsonb
WHERE font_settings IS NULL;
