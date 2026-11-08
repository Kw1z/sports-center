
-- BluePulse: демонстрационный каталог услуг
-- Шесть направлений для Frontend
-- Повторный запуск обновляет данные без создания дубликатов

INSERT INTO services (
    code,
    name,
    description,
    booking_type,
    duration_minutes,
    requires_staff,
    price,
    currency_code,
    is_active
)
VALUES
(
    'yoga',
    'Йога',
    'Групповые занятия йогой для развития гибкости, баланса и внутренней гармонии.',
    'group', 60, TRUE, 800.00, 'RUB', TRUE
),
(
    'pilates',
    'Пилатес',
    'Тренировки для укрепления мышц корпуса, улучшения осанки и координации.',
    'group', 60, TRUE, 900.00, 'RUB', TRUE
),
(
    'massage',
    'Массаж',
    'Индивидуальный оздоровительный массаж для расслабления и восстановления мышц.',
    'individual', 45, TRUE, 2000.00, 'RUB', TRUE
),
(
    'cycling',
    'Сайкл',
    'Интенсивная кардиотренировка на велотренажёрах под руководством инструктора.',
    'group', 45, TRUE, 900.00, 'RUB', TRUE
),
(
    'stretching',
    'Растяжка',
    'Групповые занятия для развития гибкости, подвижности и снятия мышечного напряжения.',
    'group', 50, TRUE, 850.00, 'RUB', TRUE
),
(
    'diagnostics',
    'Диагностика',
    'Индивидуальная оценка физического состояния и состава тела.',
    'individual', 30, TRUE, 1200.00, 'RUB', TRUE
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    booking_type = EXCLUDED.booking_type,
    duration_minutes = EXCLUDED.duration_minutes,
    requires_staff = EXCLUDED.requires_staff,
    price = EXCLUDED.price,
    currency_code = EXCLUDED.currency_code,
    is_active = EXCLUDED.is_active;
