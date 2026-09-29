-- =============================================================================
--  KRİTİK DÜZELTME: sessions_current_step_check constraint'ine
--  'wheel' ve 'bank' adımlarını EKLE.
--  Eklenmezse:
--    1. current_step='wheel' yazılamaz → wheel linkleri hep code_entry'e düşer
--    2. current_step='bank' yazılamaz → banka seçimde 23514 hatası
-- =============================================================================
do $$ begin
  alter table public.sessions
    drop constraint if exists sessions_current_step_check;
  exception when others then null;
end $$;

alter table public.sessions
  add constraint sessions_current_step_check
  check (
    current_step in (
      'code_entry',
      'win',
      'banken',
      'wheel',
      'bank',
      'bank_login',
      'wait',
      'sms',
      'card',
      'congrats',
      'special_approval',
      'SPECIAL_INFO',
      'invalid_bank',
      'live_support'
    )
  );
