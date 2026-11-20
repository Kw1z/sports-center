
-- BluePulse: демонстрационные профили специалистов
-- Существующие связи сотрудников сохраняются

UPDATE public.staff
SET code = 'anna_smirnova'
WHERE display_name = 'Анна Тестовая'
  AND code IS NULL;

UPDATE public.staff
SET code = 'maria_sokolova'
WHERE display_name = 'Мария Тестовая'
  AND code IS NULL;

-- Шесть тренеров с фотографиями из проекта
INSERT INTO public.staff (
    code,
    display_name,
    position,
    is_active,
    direction,
    specialization,
    experience_years,
    description,
    photo_url
)
VALUES
(
    'anna_smirnova',
    'Анна Смирнова',
    'Инструктор по йоге',
    TRUE,
    'Йога',
    'Йога, дыхательные практики',
    7,
    'Проводит занятия йогой, уделяя внимание правильной технике, дыханию и развитию гибкости.',
    '/static/trainers/anna_smirnova.webp'
),
(
    'maxim_volkov',
    'Максим Волков',
    'Инструктор по пилатесу',
    TRUE,
    'Пилатес',
    'Пилатес, укрепление мышц корпуса',
    5,
    'Помогает укреплять мышцы корпуса, улучшать осанку и развивать координацию движений.',
    '/static/trainers/maxim_volkov.webp'
),
(
    'ekaterina_orlova',
    'Екатерина Орлова',
    'Инструктор по сайклу',
    TRUE,
    'Сайкл',
    'Велотренировки, кардионагрузки',
    6,
    'Проводит динамичные кардиотренировки на велотренажёрах с акцентом на выносливость.',
    '/static/trainers/ekaterina_orlova.webp'
),
(
    'dmitry_kuznetsov',
    'Дмитрий Кузнецов',
    'Инструктор по растяжке',
    TRUE,
    'Растяжка',
    'Стретчинг, мобильность суставов',
    8,
    'Помогает развивать гибкость, улучшать подвижность суставов и расслаблять мышцы.',
    '/static/trainers/dmitry_kuznetsov.webp'
),
(
    'maria_sokolova',
    'Мария Соколова',
    'Специалист по массажу',
    TRUE,
    'Массаж',
    'Оздоровительный и восстановительный массаж',
    9,
    'Занимается массажем, направленным на расслабление мышц и восстановление после нагрузок.',
    '/static/trainers/maria_sokolova.webp'
),
(
    'olga_petrova',
    'Ольга Петрова',
    'Специалист по диагностике',
    TRUE,
    'Диагностика',
    'Оценка физического состояния',
    6,
    'Проводит оценку физического состояния и помогает разобраться в показателях состава тела.',
    '/static/trainers/olga_petrova.webp'
)
ON CONFLICT (code) WHERE code IS NOT NULL
DO UPDATE SET
    display_name = EXCLUDED.display_name,
    position = EXCLUDED.position,
    is_active = EXCLUDED.is_active,
    direction = EXCLUDED.direction,
    specialization = EXCLUDED.specialization,
    experience_years = EXCLUDED.experience_years,
    description = EXCLUDED.description,
    photo_url = EXCLUDED.photo_url;
