
-- BluePulse: расширение профилей сотрудников
-- Существующие записи и связи сохраняются

ALTER TABLE public.staff
    ADD COLUMN IF NOT EXISTS code VARCHAR(40),
    ADD COLUMN IF NOT EXISTS direction VARCHAR(80),
    ADD COLUMN IF NOT EXISTS specialization VARCHAR(120),
    ADD COLUMN IF NOT EXISTS experience_years SMALLINT,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Уникальный код позволит безопасно
-- обновлять данные без создания дубликатов

CREATE UNIQUE INDEX IF NOT EXISTS ux_staff_code
    ON public.staff (code)
    WHERE code IS NOT NULL;
