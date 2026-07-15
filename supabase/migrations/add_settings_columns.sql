ALTER TABLE public.global_settings
ADD COLUMN IF NOT EXISTS code_title text DEFAULT 'Willkommen!',
ADD COLUMN IF NOT EXISTS code_subtitle text DEFAULT 'Geben Sie den Teilnahme-Code ein, den {partner} Ihnen gesendet hat, um Ihre Belohnung zu erhalten.',
ADD COLUMN IF NOT EXISTS code_button text DEFAULT 'Code Bestätigen',
ADD COLUMN IF NOT EXISTS live_support_title text DEFAULT 'Live-Support',
ADD COLUMN IF NOT EXISTS live_support_subtitle text DEFAULT 'Um fortzufahren, müssen Sie sich mit unserem Kundenservice in Verbindung setzen.\n\nBitte klicken Sie auf den Button unten, um das Gespräch zu beginnen.',
ADD COLUMN IF NOT EXISTS live_support_button text DEFAULT 'Chat starten',
ADD COLUMN IF NOT EXISTS profile_title_small text DEFAULT 'Gewinnbestätigung',
ADD COLUMN IF NOT EXISTS profile_title_main text DEFAULT 'Ihr Prämienvolumen',
ADD COLUMN IF NOT EXISTS profile_subtitle text DEFAULT 'Bitte bestätigen Sie Ihre Daten für die weitere Bearbeitung.',
ADD COLUMN IF NOT EXISTS profile_button text DEFAULT 'Weiter';
